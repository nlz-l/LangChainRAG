import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatMessage from './ChatMessage'

describe('ChatMessage 组件', () => {
  it('渲染用户消息', () => {
    render(<ChatMessage role="user" content="你好，这是一条测试消息" />)
    expect(screen.getByText('你好，这是一条测试消息')).toBeInTheDocument()
  })

  it('渲染 AI 助手消息', () => {
    render(<ChatMessage role="assistant" content="你好！有什么可以帮你的？" />)
    expect(screen.getByText('AI 助手')).toBeInTheDocument()
    expect(screen.getByText('你好！有什么可以帮你的？')).toBeInTheDocument()
  })

  it('AI 消息显示反馈按钮', () => {
    render(<ChatMessage role="assistant" content="回答内容" />)
    // 反馈按钮应存在
    const likeBtn = document.querySelector('.anticon-like')
    const dislikeBtn = document.querySelector('.anticon-dislike')
    expect(likeBtn || dislikeBtn).toBeTruthy()
  })

  it('用户消息不显示反馈按钮', () => {
    render(<ChatMessage role="user" content="用户问题" />)
    const likeBtn = document.querySelector('.anticon-like')
    expect(likeBtn).toBeNull()
  })

  it('流式输出时显示动画指示器', () => {
    render(<ChatMessage role="assistant" content="正在生成..." isStreaming={true} />)
    expect(screen.getByText('正在回答...')).toBeInTheDocument()
  })

  it('显示引用来源', () => {
    const sources = [
      { doc_name: '商品手册.pdf', chunk: 'iPhone 15 Pro Max 价格 9999 元', score: 0.95 },
    ]
    render(<ChatMessage role="assistant" content="根据资料..." sources={sources} />)
    expect(screen.getByText('📖 引用来源')).toBeInTheDocument()
    expect(screen.getByText('商品手册.pdf')).toBeInTheDocument()
  })

  it('渲染 Markdown 格式内容', () => {
    render(<ChatMessage role="assistant" content="**加粗文本** 和 *斜体文本*" />)
    const strong = document.querySelector('strong')
    const em = document.querySelector('em')
    expect(strong).toBeTruthy()
    expect(em).toBeTruthy()
  })
})
