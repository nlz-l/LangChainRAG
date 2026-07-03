import api from './auth'

export interface KnowledgeStats {
  total_documents: number
  total_chunks: number
  documents: string[]
  collection_name: string
}

export interface DocumentInfo {
  filename: string
}

export const knowledgeAPI = {
  uploadDocument: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getStats: () => api.get<KnowledgeStats>('/knowledge/stats'),
  listDocuments: () => api.get<{ documents: DocumentInfo[]; total: number }>('/knowledge/documents'),
  deleteDocument: (filename: string) => api.delete(`/knowledge/documents/${encodeURIComponent(filename)}`),
  rebuildIndex: () => api.post('/knowledge/rebuild'),
}
