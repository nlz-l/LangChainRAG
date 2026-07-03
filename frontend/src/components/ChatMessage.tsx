import { useState } from 'react'
import { Avatar, Typography, Button, Tooltip } from 'antd'
import { UserOutlined, RobotOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import SourceCitation from './SourceCitation'
import type { SourceInfo } from '../api/chat'

interface ChatMessageProps {
  role: string
  content: string
  sources?: SourceInfo[] | null
  isStreaming?: boolean
  onFeedback?: (rating: 'like' | 'dislike') => void
}

export default function ChatMessage({ role, content, sources, isStreaming, onFeedback }: ChatMessageProps) {
  const isUser = role === 'user'
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null)

  const handleFeedback = (rating: 'like' | 'dislike') => {
    setFeedback(rating)
    onFeedback?.(rating)
  }

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: 12 }}>
        <div style={{ maxWidth: '75%' }}>
          <div style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            borderRadius: '18px 18px 4px 18px',
            fontSize: 14,
            lineHeight: 1.7,
            boxShadow: '0 2px 8px rgba(102,126,234,0.25)',
          }}>
            <Typography.Paragraph style={{ margin: 0, color: '#fff' }}>{content}</Typography.Paragraph>
          </div>
        </div>
        <Avatar
          size={36}
          icon={<UserOutlined />}
          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', flexShrink: 0, boxShadow: '0 2px 8px rgba(102,126,234,0.3)' }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <div style={{ display: 'flex', gap: 14, maxWidth: '85%' }}>
        <Avatar
          size={38}
          icon={<RobotOutlined />}
          style={{
            background: 'linear-gradient(135deg, #11998e, #38ef7d)',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(17,153,142,0.3)',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Typography.Text strong style={{ fontSize: 13, color: '#333' }}>AI 助手</Typography.Text>
            {isStreaming && (
              <span style={{
                display: 'inline-block',
                width: 8, height: 8,
                borderRadius: '50%',
                background: '#52c41a',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            )}
            {isStreaming && (
              <Typography.Text style={{ fontSize: 11, color: '#999' }}>正在回答...</Typography.Text>
            )}
          </div>

          {/* Content */}
          <div style={{
            padding: '16px 20px',
            background: '#fff',
            borderRadius: '4px 18px 18px 18px',
            fontSize: 14,
            lineHeight: 1.9,
            wordBreak: 'break-word',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
          }}>
            <div className="message-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            {/* 流式光标 */}
            {isStreaming && (
              <span style={{
                display: 'inline-block',
                width: 2, height: 18,
                background: ACCENT,
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </div>

          {/* Sources */}
          {sources && sources.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Typography.Text style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 8, display: 'block' }}>
                📖 引用来源
              </Typography.Text>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {sources.map((src, idx) => (
                  <SourceCitation key={idx} source={src} index={idx + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {!isStreaming && content && (
            <div style={{ marginTop: 6, display: 'flex', gap: 2 }}>
              <Tooltip title="有帮助">
                <Button
                  type="text"
                  size="small"
                  icon={<LikeOutlined style={{ fontSize: 12, color: feedback === 'like' ? ACCENT : '#bbb' }} />}
                  onClick={() => handleFeedback('like')}
                />
              </Tooltip>
              <Tooltip title="需改进">
                <Button
                  type="text"
                  size="small"
                  icon={<DislikeOutlined style={{ fontSize: 12, color: feedback === 'dislike' ? '#ff4d4f' : '#bbb' }} />}
                  onClick={() => handleFeedback('dislike')}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ACCENT = '#667eea'
