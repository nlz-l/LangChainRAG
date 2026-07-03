import { create } from 'zustand'
import { chatAPI, SessionInfo, MessageInfo } from '../api/chat'

interface ChatState {
  sessions: SessionInfo[]
  currentSessionId: number | null
  messages: MessageInfo[]
  loading: boolean
  streaming: boolean

  loadSessions: () => Promise<void>
  createSession: () => Promise<number>
  deleteSession: (id: number) => Promise<void>
  updateSessionTitle: (id: number, title: string) => Promise<void>
  switchSession: (id: number) => Promise<void>
  loadMessages: (sessionId: number) => Promise<void>

  sendMessage: (sessionId: number, message: string) => Promise<string>
  appendMessage: (msg: MessageInfo) => void
  setStreaming: (v: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  loading: false,
  streaming: false,

  loadSessions: async () => {
    try {
      const res = await chatAPI.listSessions()
      set({ sessions: res.data })
    } catch { /* ignore */ }
  },

  createSession: async () => {
    const res = await chatAPI.createSession()
    const newSession = res.data
    // 不设置 currentSessionId，由 URL 驱动的 useEffect 统一处理切换
    set((s) => ({ sessions: [newSession, ...s.sessions], messages: [] }))
    return newSession.id
  },

  deleteSession: async (id) => {
    await chatAPI.deleteSession(id)
    set((s) => {
      const sessions = s.sessions.filter((sess) => sess.id !== id)
      const isCurrentDeleted = s.currentSessionId === id
      return {
        sessions,
        currentSessionId: isCurrentDeleted ? (sessions[0]?.id || null) : s.currentSessionId,
        messages: isCurrentDeleted ? [] : s.messages,
      }
    })
  },

  updateSessionTitle: async (id, title) => {
    await chatAPI.updateSession(id, title)
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, title } : sess)),
    }))
  },

  switchSession: async (id) => {
    set({ currentSessionId: id, messages: [] })
    await get().loadMessages(id)
  },

  loadMessages: async (sessionId) => {
    try {
      const res = await chatAPI.getMessages(sessionId)
      set({ messages: res.data })
    } catch { /* ignore */ }
  },

  sendMessage: async (sessionId, message) => {
    set({ streaming: true })

    // 添加用户消息
    const userMsg: MessageInfo = {
      id: Date.now(),
      session_id: sessionId,
      role: 'user',
      content: message,
      sources: null,
      created_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMsg] }))

    // 准备接收助手消息
    const assistantMsg: MessageInfo = {
      id: Date.now() + 1,
      session_id: sessionId,
      role: 'assistant',
      content: '',
      sources: null,
      created_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, assistantMsg] }))

    try {
      const response = await chatAPI.streamChat(sessionId, message)
      if (!response.ok) throw new Error('请求失败')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取流')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk') {
                fullContent += data.content
                set((s) => ({
                  messages: s.messages.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                  ),
                }))
              } else if (data.type === 'done') {
                // 完成后重新加载消息获取 sources
                setTimeout(() => get().loadMessages(sessionId), 500)
              } else if (data.type === 'error') {
                set((s) => ({
                  messages: s.messages.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: `错误: ${data.content}` }
                      : m
                  ),
                }))
              }
            } catch { /* JSON parse error */ }
          }
        }
      }
      set({ streaming: false })
      return fullContent
    } catch (err: any) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `请求失败: ${err.message}` }
            : m
        ),
        streaming: false,
      }))
      return ''
    }
  },

  appendMessage: (msg) => {
    set((s) => ({ messages: [...s.messages, msg] }))
  },

  setStreaming: (v) => set({ streaming: v }),
}))
