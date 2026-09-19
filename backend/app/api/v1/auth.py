from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.group import Group
from app.models.user import User
from app.schemas.auth import AdminLogin, Token, UserLogin, UserOut, UserRegister
from app.services.rate_limit import check_register_rate_limit

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    check_register_rate_limit(payload.phone)

    existing = db.query(User).filter(User.phone == payload.phone).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu foydalanuvchi allaqachon ro'yxatdan o'tgan",
        )

    faculty = db.query(Faculty).filter(Faculty.id == payload.faculty_id, Faculty.is_active.is_(True)).first()
    if faculty is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fakultet topilmadi")

    group = (
        db.query(Group)
        .filter(Group.id == payload.group_id, Group.faculty_id == payload.faculty_id, Group.is_active.is_(True))
        .first()
    )
    if group is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Guruh topilmadi")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        faculty_id=payload.faculty_id,
        group_id=payload.group_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone, User.is_admin.is_(False)).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Telefon raqam yoki parol xato")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisobingiz faol emas")

    token = create_access_token(subject=str(user.id), role="user")
    return Token(access_token=token, role="user")


@router.post("/admin/login", response_model=Token)
def admin_login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.phone == payload.phone, User.is_admin.is_(True)).first()
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login yoki parol xato")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob faol emas")

    token = create_access_token(subject=str(admin.id), role="admin")
    return Token(access_token=token, role="admin")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
