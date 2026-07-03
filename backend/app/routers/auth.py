"""认证路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, UserChangePassword, TokenResponse, UserInfo
from app.services.auth_service import (
    register_user,
    authenticate_user,
    change_password,
    create_access_token,
    create_refresh_token,
)
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserInfo)
async def register(req: UserRegister, db: AsyncSession = Depends(get_db)):
    """用户注册"""
    user = await register_user(db, req.username, req.password)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLogin, db: AsyncSession = Depends(get_db)):
    """用户登录，返回 JWT token"""
    user = await authenticate_user(db, req.username, req.password)
    return TokenResponse(
        access_token=create_access_token(user.id, user.username, user.role),
        refresh_token=create_refresh_token(user.id, user.username, user.role),
        username=user.username,
        role=user.role,
    )


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user


@router.post("/change-password")
async def change_pwd(
    req: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改密码"""
    await change_password(db, current_user, req.old_password, req.new_password)
    return {"message": "密码修改成功"}
