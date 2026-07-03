"""数据库连接管理"""
from datetime import datetime, timezone, timedelta
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# 中国标准时间 UTC+8
CST = timezone(timedelta(hours=8))

def now_cst() -> datetime:
    """返回中国标准时间（UTC+8）"""
    return datetime.now(CST).replace(tzinfo=None)

# 异步引擎（FastAPI 使用）
_engine_kwargs = dict(echo=False, pool_pre_ping=True)
# SQLite 不支持连接池，仅对 PostgreSQL 启用
if "sqlite" not in settings.DATABASE_URL:
    _engine_kwargs["pool_size"] = 20

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

# 为 SQLite 启用外键约束（级联删除需要）
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# SQLAlchemy 声明式基类
class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """获取数据库会话（依赖注入）"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
