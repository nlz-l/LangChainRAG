"""文档分割器"""
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings


# 中文友好的分隔符
CHINESE_SEPARATORS = [
    "\n\n",
    "\n",
    "。",
    "！",
    "？",
    "；",
    "，",
    " ",
    "",
]


def get_text_splitter(
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> RecursiveCharacterTextSplitter:
    """获取文本分割器"""
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size or settings.CHUNK_SIZE,
        chunk_overlap=chunk_overlap or settings.CHUNK_OVERLAP,
        separators=CHINESE_SEPARATORS,
        keep_separator=True,
    )


def split_documents(documents: List[Document]) -> List[Document]:
    """将文档分割为 chunks"""
    splitter = get_text_splitter()
    chunks = splitter.split_documents(documents)

    # 为每个 chunk 添加序号
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i

    return chunks
