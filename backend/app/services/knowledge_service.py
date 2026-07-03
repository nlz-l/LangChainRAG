"""知识库管理业务逻辑"""
import os
import hashlib
import uuid
from typing import List
from fastapi import UploadFile, HTTPException, status
from app.config import settings
from app.rag.loader import load_document
from app.rag.splitter import split_documents
from app.rag.vectorstore import add_documents, get_collection_stats
import aiofiles


async def save_upload_file(file: UploadFile) -> str:
    """保存上传文件，返回文件路径"""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # 安全文件名
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    # 异步写入
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return file_path


def calculate_md5(file_path: str) -> str:
    """计算文件 MD5"""
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


async def process_document(file: UploadFile) -> dict:
    """处理上传的文档：保存 → 加载 → 分割 → 向量化 → 存储"""
    # 1. 验证文件类型
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = {".pdf", ".txt", ".md", ".csv", ".docx", ".doc"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"不支持的文件格式: {ext}")

    # 2. 保存文件
    file_path = await save_upload_file(file)
    file_size = os.path.getsize(file_path)

    # 3. 加载文档
    try:
        documents = load_document(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"文档加载失败: {str(e)}")

    if not documents:
        os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文档内容为空")

    # 4. 分割文档
    chunks = split_documents(documents)

    # 5. 生成唯一文档 ID 前缀
    doc_id_prefix = uuid.uuid4().hex[:12]

    # 6. 为 chunk 添加文档元数据
    for i, chunk in enumerate(chunks):
        chunk.metadata["doc_id_prefix"] = doc_id_prefix
        chunk.metadata["filename"] = file.filename
        chunk.metadata["file_path"] = file_path
        chunk.metadata["upload_time"] = str(chunks[0].metadata.get("upload_time", ""))

    # 7. 批量向量化并存入 ChromaDB
    chunk_count = add_documents(chunks, doc_id_prefix)

    return {
        "doc_id": doc_id_prefix,
        "filename": file.filename,
        "file_path": file_path,
        "chunk_count": chunk_count,
        "file_size_kb": round(file_size / 1024, 2),
    }


def get_knowledge_stats() -> dict:
    """获取知识库统计信息"""
    stats = get_collection_stats()
    return {
        "total_documents": stats["total_documents"],
        "total_chunks": stats["total_chunks"],
        "documents": stats["documents"],
        "collection_name": settings.CHROMA_COLLECTION_NAME,
    }
