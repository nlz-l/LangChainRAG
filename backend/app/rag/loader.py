"""文档加载器 - 支持多种文档格式"""
import os
from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
    Docx2txtLoader,
    UnstructuredWordDocumentLoader,
)
from app.config import settings


LOADER_MAP = {
    ".pdf": PyPDFLoader,
    ".txt": TextLoader,
    ".csv": CSVLoader,
    ".md": UnstructuredMarkdownLoader,
    ".docx": Docx2txtLoader,
    ".doc": UnstructuredWordDocumentLoader,
}


def load_document(file_path: str) -> List[Document]:
    """根据文件扩展名选择合适的加载器"""
    ext = os.path.splitext(file_path)[1].lower()
    loader_cls = LOADER_MAP.get(ext)
    if loader_cls is None:
        raise ValueError(f"不支持的文件格式: {ext}")

    if ext == ".csv":
        loader = loader_cls(file_path, encoding="utf-8")
    elif ext == ".txt":
        loader = loader_cls(file_path, encoding="utf-8")
    else:
        loader = loader_cls(file_path)

    documents = loader.load()

    # 为每个 document 添加源文件名元数据
    filename = os.path.basename(file_path)
    for doc in documents:
        doc.metadata["source"] = filename

    return documents
