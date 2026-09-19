from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.category import Category
from app.models.faculty import Faculty
from app.models.subcategory import SubCategory
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    SubCategoryCreate,
    SubCategoryOut,
    SubCategoryUpdate,
)

router = APIRouter(tags=["categories"])


def _category_out(category: Category) -> CategoryOut:
    return CategoryOut(
        id=category.id,
        name=category.name,
        is_active=category.is_active,
        is_archived=category.is_archived,
        visible_to_all_faculties=category.visible_to_all_faculties,
        faculty_ids=[f.id for f in category.faculties],
        created_at=category.created_at,
    )


@router.get("/api/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = (
        db.query(Category)
        .options(joinedload(Category.faculties))
        .filter(Category.is_active.is_(True), Category.is_archived.is_(False), Category.is_deleted.is_(False))
    )
    categories = query.order_by(Category.name).all()

    if current_user.is_admin:
        visible = categories
    else:
        visible = [
            c
            for c in categories
            if c.visible_to_all_faculties or current_user.faculty_id in {f.id for f in c.faculties}
        ]
    return [_category_out(c) for c in visible]


@router.get("/api/admin/categories", response_model=list[CategoryOut])
def list_categories_admin(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    categories = (
        db.query(Category)
        .options(joinedload(Category.faculties))
        .filter(Category.is_deleted.is_(False))
        .order_by(Category.name)
        .all()
    )
    return [_category_out(c) for c in categories]


@router.post("/api/admin/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    category = Category(name=payload.name, visible_to_all_faculties=payload.visible_to_all_faculties)
    if not payload.visible_to_all_faculties and payload.faculty_ids:
        faculties = db.query(Faculty).filter(Faculty.id.in_(payload.faculty_ids)).all()
        category.faculties = faculties
    db.add(category)
    db.commit()
    db.refresh(category)
    return _category_out(category)


@router.put("/api/admin/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == category_id, Category.is_deleted.is_(False)).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bo'lim topilmadi")

    if payload.name is not None:
        category.name = payload.name
    if payload.visible_to_all_faculties is not None:
        category.visible_to_all_faculties = payload.visible_to_all_faculties
    if payload.faculty_ids is not None:
        faculties = db.query(Faculty).filter(Faculty.id.in_(payload.faculty_ids)).all()
        category.faculties = faculties

    db.commit()
    db.refresh(category)
    return _category_out(category)


@router.patch("/api/admin/categories/{category_id}/toggle", response_model=CategoryOut)
def toggle_category(category_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id, Category.is_deleted.is_(False)).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bo'lim topilmadi")
    category.is_active = not category.is_active
    db.commit()
    db.refresh(category)
    return _category_out(category)


@router.delete("/api/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int, hard: bool = Query(default=False), db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == category_id, Category.is_deleted.is_(False)).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bo'lim topilmadi")

    if hard:
        # Hard delete: userga va admin ro'yxatlariga umuman ko'rinmaydi, LEKIN
        # qatorlar analitika uchun bazada qoladi (is_deleted=True orqali yashiriladi).
        category.is_deleted = True
        category.is_active = False
        for sub in category.subcategories:
            sub.is_deleted = True
            sub.is_active = False
    else:
        # Soft delete: arxivga tushadi, admin qayta tiklashi mumkin.
        category.is_archived = True
        category.is_active = False

    db.commit()


@router.post("/api/admin/categories/{category_id}/restore", response_model=CategoryOut)
def restore_category(category_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id, Category.is_deleted.is_(False)).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bo'lim topilmadi")
    category.is_archived = False
    db.commit()
    db.refresh(category)
    return _category_out(category)


# ---------------- SubCategories ----------------


def _is_subcategory_open(sub: SubCategory) -> bool:
    now = datetime.now(timezone.utc)
    if sub.available_from and now < sub.available_from:
        return False
    if sub.available_until and now > sub.available_until:
        return False
    return True


@router.get("/api/categories/{category_id}/subcategories", response_model=list[SubCategoryOut])
def list_subcategories(category_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    subs = (
        db.query(SubCategory)
        .filter(
            SubCategory.category_id == category_id,
            SubCategory.is_active.is_(True),
            SubCategory.is_archived.is_(False),
            SubCategory.is_deleted.is_(False),
        )
        .order_by(SubCategory.name)
        .all()
    )
    return [s for s in subs if _is_subcategory_open(s)]


@router.get("/api/admin/categories/{category_id}/subcategories", response_model=list[SubCategoryOut])
def list_subcategories_admin(category_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return (
        db.query(SubCategory)
        .filter(SubCategory.category_id == category_id, SubCategory.is_deleted.is_(False))
        .order_by(SubCategory.name)
        .all()
    )


@router.post("/api/admin/subcategories", response_model=SubCategoryOut, status_code=status.HTTP_201_CREATED)
def create_subcategory(
    payload: SubCategoryCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == payload.category_id, Category.is_deleted.is_(False)).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bo'lim topilmadi")

    sub = SubCategory(**payload.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.put("/api/admin/subcategories/{subcategory_id}", response_model=SubCategoryOut)
def update_subcategory(
    subcategory_id: int,
    payload: SubCategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    sub = db.query(SubCategory).filter(SubCategory.id == subcategory_id, SubCategory.is_deleted.is_(False)).first()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sub-bo'lim topilmadi")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sub, field, value)

    db.commit()
    db.refresh(sub)
    return sub


@router.patch("/api/admin/subcategories/{subcategory_id}/toggle", response_model=SubCategoryOut)
def toggle_subcategory(subcategory_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    sub = db.query(SubCategory).filter(SubCategory.id == subcategory_id, SubCategory.is_deleted.is_(False)).first()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sub-bo'lim topilmadi")
    sub.is_active = not sub.is_active
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/api/admin/subcategories/{subcategory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subcategory(
    subcategory_id: int,
    hard: bool = Query(default=False),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    sub = db.query(SubCategory).filter(SubCategory.id == subcategory_id, SubCategory.is_deleted.is_(False)).first()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sub-bo'lim topilmadi")

    if hard:
        sub.is_deleted = True
        sub.is_active = False
    else:
        sub.is_archived = True
        sub.is_active = False

    db.commit()
