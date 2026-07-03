"""问答路由 - SSE 流式接口"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.session import Session
from app.models.user import User
from app.models.message import Message
from app.models.feedback import Feedback
from app.schemas.chat import ChatRequest
from app.middleware.auth_middleware import get_current_user
from app.services.chat_service import stream_qa

router = APIRouter()


@router.post("/stream")
async def chat_stream(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """流式问答接口（SSE）"""
    # 验证会话归属
    result = await db.execute(select(Session).where(Session.id == req.session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问此会话")

    async def event_generator():
        try:
            async for chunk in stream_qa(db, req.session_id, req.message):
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/messages/{session_id}")
async def get_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取会话消息列表"""
    # 验证会话归属
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问此会话")

    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    return [
        {
            "id": msg.id,
            "session_id": msg.session_id,
            "role": msg.role,
            "content": msg.content,
            "sources": msg.sources,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        for msg in messages
    ]


@router.get("/export/{session_id}")
async def export_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出会话为 Markdown 格式"""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问此会话")

    result = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    md_lines = [f"# {session.title}", "", f"*导出时间: {session.updated_at}*", "", "---", ""]
    for msg in messages:
        role_label = "**用户**" if msg.role == "user" else "**AI 助手**"
        md_lines.append(f"### {role_label}")
        md_lines.append("")
        md_lines.append(msg.content)
        md_lines.append("")
        if msg.sources:
            md_lines.append("*参考来源:*")
            for src in msg.sources:
                md_lines.append(f"- `{src['doc_name']}`: {src['chunk'][:100]}...")
            md_lines.append("")
        md_lines.append("---")
        md_lines.append("")

    content = "\n".join(md_lines)
    filename = f"{session.title.replace(' ', '_')}.md"
    return PlainTextResponse(content, media_type="text/markdown", headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })


from pydantic import BaseModel

class FeedbackRequest(BaseModel):
    message_id: int
    rating: str

@router.post("/feedback")
async def submit_feedback(
    req: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交消息反馈（like/dislike）"""
    if req.rating not in ("like", "dislike"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="rating 必须是 like 或 dislike")

    message_id = req.message_id
    rating = req.rating

    # 检查消息是否存在
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="消息不存在")

    # 检查是否已反馈（幂等）
    result = await db.execute(
        select(Feedback).where(
            Feedback.user_id == current_user.id,
            Feedback.message_id == message_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.rating = rating
        await db.flush()
        return {"message": "反馈已更新", "rating": rating}

    feedback = Feedback(user_id=current_user.id, message_id=message_id, rating=rating)
    db.add(feedback)
    await db.flush()
    return {"message": "反馈已提交", "rating": rating}

