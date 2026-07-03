"""会话管理路由"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.session import Session
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import SessionCreate, SessionUpdate, SessionResponse
from app.middleware.auth_middleware import get_current_user

router = APIRouter()


@router.get("/", response_model=list[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用户的所有会话列表"""
    # 子查询获取每个会话的消息数
    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id)
        .order_by(Session.updated_at.desc())
    )
    sessions = result.scalars().all()

    response = []
    for s in sessions:
        # 获取消息数
        count_result = await db.execute(
            select(func.count()).select_from(Message).where(Message.session_id == s.id)
        )
        msg_count = count_result.scalar() or 0
        response.append(SessionResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            created_at=s.created_at.isoformat() if s.created_at else None,
            updated_at=s.updated_at.isoformat() if s.updated_at else None,
            message_count=msg_count,
        ))
    return response


@router.post("/", response_model=SessionResponse)
async def create_session(
    req: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建新会话"""
    session = Session(user_id=current_user.id, title=req.title)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at.isoformat() if session.created_at else None,
        updated_at=session.updated_at.isoformat() if session.updated_at else None,
        message_count=0,
    )


@router.put("/{session_id}")
async def update_session(
    session_id: int,
    req: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """重命名会话"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此会话")
    session.title = req.title
    await db.flush()
    return {"message": "会话已更新", "title": req.title}


@router.delete("/{session_id}")
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除会话（级联删除消息）"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此会话")
    await db.delete(session)
    await db.flush()
    return {"message": "会话已删除"}
