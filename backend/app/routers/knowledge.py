"""知识库管理路由（管理员专用）"""
import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.config import settings
from app.middleware.auth_middleware import get_admin_user
from app.models.user import User
from app.services.knowledge_service import process_document, get_knowledge_stats

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    admin: User = Depends(get_admin_user),
):
    """上传文档到知识库（管理员专用）"""
    # 检查文件大小
    content = await file.read()
    file_size_mb = len(content) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制 ({settings.MAX_UPLOAD_SIZE_MB}MB)",
        )
    # 重置文件指针
    await file.seek(0)

    result = await process_document(file)
    return {
        "message": "文档处理完成",
        "doc_id": result["doc_id"],
        "filename": result["filename"],
        "chunk_count": result["chunk_count"],
        "file_size_kb": result["file_size_kb"],
    }


@router.get("/stats")
async def knowledge_stats(admin: User = Depends(get_admin_user)):
    """获取知识库统计信息（管理员专用）"""
    return get_knowledge_stats()


@router.get("/documents")
async def list_documents(admin: User = Depends(get_admin_user)):
    """列出知识库中所有文档"""
    stats = get_knowledge_stats()
    documents = []
    for doc_name in stats["documents"]:
        documents.append({
            "filename": doc_name,
        })
    return {"documents": documents, "total": len(documents)}


@router.delete("/documents/{filename}")
async def delete_document(
    filename: str,
    admin: User = Depends(get_admin_user),
):
    """删除知识库中的文档"""
    from app.rag.vectorstore import get_vectorstore

    vectorstore = get_vectorstore()
    collection = vectorstore._collection

    # 查找并删除该文件的所有 chunks
    result = collection.get()
    ids_to_delete = []
    for i, meta in enumerate(result.get("metadatas", [])):
        if meta and (meta.get("source") == filename or meta.get("filename") == filename):
            ids_to_delete.append(result["ids"][i])

    if ids_to_delete:
        collection.delete(ids=ids_to_delete)

    # 同时删除上传目录中的文件
    for root, _, files in os.walk(settings.UPLOAD_DIR):
        for f in files:
            if filename in f:
                try:
                    os.remove(os.path.join(root, f))
                except OSError:
                    pass

    return {"message": f"文档 '{filename}' 已删除", "deleted_chunks": len(ids_to_delete)}


@router.post("/rebuild")
async def rebuild_index(admin: User = Depends(get_admin_user)):
    """重建知识库索引"""
    from app.rag.vectorstore import reset_vectorstore, get_vectorstore
    import shutil

    reset_vectorstore()

    # 清除 ChromaDB 持久化数据
    if os.path.exists(settings.CHROMA_PERSIST_DIR):
        shutil.rmtree(settings.CHROMA_PERSIST_DIR)
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

    # 重新初始化
    get_vectorstore()

    return {"message": "知识库索引已重建，请重新上传文档"}
