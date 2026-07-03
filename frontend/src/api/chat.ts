import api from './auth'

export interface SessionInfo {
  id: number
  user_id: number
  title: string
  created_at: string | null
  updated_at: string | null
  message_count: number
}

export interface MessageInfo {
  id: number
  session_id: number
  role: string
  content: string
  sources: SourceInfo[] | null
  created_at: string | null
}

export interface SourceInfo {
  doc_name: string
  chunk: string
  score: number | null
}

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` })

export const chatAPI = {
  // 会话管理
  listSessions: () => api.get<SessionInfo[]>('/sessions/', { headers: authHeader() }),
  createSession: (title?: string) => api.post<SessionInfo>('/sessions/', { title: title || '新对话' }, { headers: authHeader() }),
  updateSession: (id: number, title: string) => api.put(`/sessions/${id}`, { title }, { headers: authHeader() }),
  deleteSession: (id: number) => api.delete(`/sessions/${id}`, { headers: authHeader() }),

  // 消息
  getMessages: (sessionId: number) => api.get<MessageInfo[]>(`/chat/messages/${sessionId}`, { headers: authHeader() }),

  // 流式问答
  streamChat: (sessionId: number, message: string) =>
    fetch('http://localhost:8000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
      body: JSON.stringify({ session_id: sessionId, message }),
    }),

  // 导出会话
  exportSession: (sessionId: number) =>
    fetch(`http://localhost:8000/api/chat/export/${sessionId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    }),

  // 反馈
  submitFeedback: (messageId: number, rating: 'like' | 'dislike') =>
    api.post('/chat/feedback', { message_id: messageId, rating }, { headers: authHeader() }),
}
