from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.group import Group
from app.models.user import User

def _reject_if_faculty_has_users(db: Session, faculty_id: int) -> None:
    if db.query(User).filter(User.faculty_id == faculty_id).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu fakultetga biriktirilgan foydalanuvchilar bor — avval ularni ko'chiring yoki faqat deactivate qiling",
        )


def _reject_if_group_has_users(db: Session, group_id: int) -> None:
    if db.query(User).filter(User.group_id == group_id).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu guruhga biriktirilgan foydalanuvchilar bor — avval ularni ko'chiring yoki faqat deactivate qiling",
        )
from app.schemas.faculty import FacultyCreate, FacultyOut, FacultyUpdate, GroupCreate, GroupOut, GroupUpdate

router = APIRouter(tags=["faculties"])


@router.get("/api/faculties", response_model=list[FacultyOut])
def list_faculties(db: Session = Depends(get_db)):
    return db.query(Faculty).filter(Faculty.is_active.is_(True)).order_by(Faculty.name).all()


@router.get("/api/admin/faculties", response_model=list[FacultyOut])
def list_faculties_admin(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    """Unlike /api/faculties (user-facing), this returns inactive faculties
    too, so admins can find and reactivate ones they previously deactivated."""
    return db.query(Faculty).order_by(Faculty.name).all()


@router.post("/api/admin/faculties", response_model=FacultyOut, status_code=status.HTTP_201_CREATED)
def create_faculty(payload: FacultyCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    if db.query(Faculty).filter(Faculty.name == payload.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu nomdagi fakultet mavjud")
    faculty = Faculty(name=payload.name)
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.put("/api/admin/faculties/{faculty_id}", response_model=FacultyOut)
def update_faculty(
    faculty_id: int, payload: FacultyUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if faculty is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fakultet topilmadi")
    if payload.name is not None and payload.name != faculty.name:
        if db.query(Faculty).filter(Faculty.name == payload.name, Faculty.id != faculty_id).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu nomdagi fakultet mavjud")
        faculty.name = payload.name
    if payload.is_active is not None:
        faculty.is_active = payload.is_active
    db.commit()
    db.refresh(faculty)
    return faculty


@router.delete("/api/admin/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if faculty is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fakultet topilmadi")
    _reject_if_faculty_has_users(db, faculty_id)
    db.delete(faculty)
    db.commit()


@router.get("/api/faculties/{faculty_id}/groups", response_model=list[GroupOut])
def list_groups(faculty_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Group)
        .filter(Group.faculty_id == faculty_id, Group.is_active.is_(True))
        .order_by(Group.name)
        .all()
    )


@router.get("/api/admin/faculties/{faculty_id}/groups", response_model=list[GroupOut])
def list_groups_admin(faculty_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    """Admin variant of /api/faculties/{id}/groups — includes inactive groups."""
    return db.query(Group).filter(Group.faculty_id == faculty_id).order_by(Group.name).all()


@router.post("/api/admin/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    faculty = db.query(Faculty).filter(Faculty.id == payload.faculty_id).first()
    if faculty is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fakultet topilmadi")
    group = Group(name=payload.name, faculty_id=payload.faculty_id)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/api/admin/groups/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int, payload: GroupUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guruh topilmadi")
    if payload.name is not None:
        group.name = payload.name
    if payload.faculty_id is not None:
        group.faculty_id = payload.faculty_id
    if payload.is_active is not None:
        group.is_active = payload.is_active
    db.commit()
    db.refresh(group)
    return group


@router.delete("/api/admin/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guruh topilmadi")
    _reject_if_group_has_users(db, group_id)
    db.delete(group)
    db.commit()
