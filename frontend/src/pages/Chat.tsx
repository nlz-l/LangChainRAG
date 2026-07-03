import { useEffect, useRef, useState } from 'react'
import { Input, Button, Typography, Tooltip, message } from 'antd'
import { SendOutlined, DownloadOutlined, RobotOutlined, BulbOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import { chatAPI } from '../api/chat'
import ChatMessage from '../components/ChatMessage'
import SessionList from '../components/SessionList'

const ACCENT = '#667eea'
const SUGGESTIONS = [
  { icon: <BulbOutlined />, text: '这款商品的主要特点是什么？' },
  { icon: <QuestionCircleOutlined />, text: '这个产品的售后服务怎么样？' },
  { icon: <BulbOutlined />, text: '请对比一下这几款商品的优缺点' },
]

export default function Chat() {
  const {
    sessions, currentSessionId, messages, streaming,
    loadSessions, createSession, deleteSession,
    updateSessionTitle, switchSession, sendMessage,
  } = useChatStore()

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { sessionId } = useParams()
  const navigate = useNavigate()

  useEffect(() => { loadSessions() }, [])
  useEffect(() => {
    if (sessionId) {
      const id = parseInt(sessionId)
      if (!isNaN(id) && id !== currentSessionId) switchSession(id)
    }
  }, [sessionId])
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId && !sessionId) {
      const firstId = sessions[0].id
      navigate(`/chat/${firstId}`, { replace: true })
      switchSession(firstId)
    }
  }, [sessions, currentSessionId, sessionId])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const msg = (text || inputValue).trim()
    if (!msg || streaming) return
    setInputValue('')

    let targetId = currentSessionId
    if (!targetId) {
      targetId = await createSession()
      navigate(`/chat/${targetId}`, { replace: true })
    }
    await sendMessage(targetId, msg)
    await loadSessions()
  }

  const handleCreateSession = async () => {
    const newId = await createSession()
    navigate(`/chat/${newId}`, { replace: true })
  }
  const handleSwitchSession = (id: number) => { navigate(`/chat/${id}`); switchSession(id) }
  const handleDeleteSession = async (id: number) => {
    await deleteSession(id)
    if (id === currentSessionId) {
      const remain = sessions.filter(s => s.id !== id)
      navigate(remain.length > 0 ? `/chat/${remain[0].id}` : '/chat')
    }
  }
  const handleExport = async () => {
    if (!currentSessionId) return
    try {
      const res = await chatAPI.exportSession(currentSessionId)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `session_${currentSessionId}.md`; a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch { message.error('导出失败') }
  }
  const handleFeedback = async (messageId: number, rating: 'like' | 'dislike') => {
    try {
      await chatAPI.submitFeedback(messageId, rating)
      message.success(rating === 'like' ? '感谢认可！' : '感谢反馈')
    } catch { message.error('反馈失败') }
  }

  const sessionTitle = sessions.find(s => s.id === currentSessionId)?.title || '对话'

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧会话列表 */}
      <div style={{
        width: 280, flexShrink: 0, overflow: 'hidden',
        background: '#fafbfc',
        borderRight: '1px solid rgba(0,0,0,0.06)',
      }}>
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSwitch={handleSwitchSession}
          onCreate={handleCreateSession}
          onDelete={handleDeleteSession}
          onRename={updateSessionTitle}
        />
      </div>

      {/* 右侧聊天区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* 标题栏 */}
        {currentSessionId && (
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
          }}>
            <Typography.Text strong style={{ fontSize: 14 }}>{sessionTitle}</Typography.Text>
            <Tooltip title="导出 Markdown">
              <Button type="text" size="small" icon={<DownloadOutlined />}
                onClick={handleExport} disabled={messages.length === 0} />
            </Tooltip>
          </div>
        )}

        {/* 消息区 */}
        <div
          ref={messagesContainerRef}
          style={{ flex: 1, overflow: 'auto', background: '#f5f6fa' }}
        >
          {messages.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', padding: 40, gap: 24,
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
              }}>
                <RobotOutlined style={{ fontSize: 36, color: '#fff' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={4} style={{ color: '#1a1a2e', marginBottom: 8 }}>
                  有什么可以帮你的？
                </Typography.Title>
                <Typography.Text style={{ color: '#8c8c8c', fontSize: 14 }}>
                  我是基于知识库的 AI 助手，可以回答关于商品的各种问题
                </Typography.Text>
              </div>
              {currentSessionId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 440 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleSend(s.text)}
                      style={{
                        padding: '12px 18px',
                        background: '#fff',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        border: '1px solid #f0f0f0',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = ACCENT
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(102,126,234,0.12)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#f0f0f0'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <span style={{ color: ACCENT, fontSize: 16 }}>{s.icon}</span>
                      <Typography.Text style={{ fontSize: 13, color: '#555' }}>{s.text}</Typography.Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                sources={msg.sources}
                isStreaming={streaming && msg.role === 'assistant' && msg === messages[messages.length - 1]}
                onFeedback={(rating) => handleFeedback(msg.id, rating)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div style={{
          padding: '16px 24px 20px',
          background: 'linear-gradient(180deg, transparent 0%, #f5f6fa 20%)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: 10,
            padding: '8px 8px 8px 18px',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e8e8e8',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <Input.TextArea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={currentSessionId ? '输入问题，Enter 发送，Shift+Enter 换行' : '创建会话后开始提问'}
              autoSize={{ minRows: 1, maxRows: 5 }}
              disabled={streaming || !currentSessionId}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                resize: 'none', padding: '6px 0', fontSize: 14,
                boxShadow: 'none',
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSend()}
              loading={streaming}
              disabled={!inputValue.trim() || !currentSessionId}
              style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: inputValue.trim() && !streaming
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : '#d9d9d9',
                border: 'none',
                boxShadow: inputValue.trim() && !streaming
                  ? '0 4px 12px rgba(102,126,234,0.4)'
                  : 'none',
                transition: 'all 0.3s',
              }}
            />
          </div>
          <Typography.Text style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, color: '#bbb' }}>
            AI 回答基于知识库内容生成，请注意核实重要信息
          </Typography.Text>
        </div>
      </div>
    </div>
  )
}
