import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import Login from './Login'

// Mock auth store
const mockLogin = vi.fn()
vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: any) => {
    if (typeof selector === 'function') {
      return selector({
        isLoggedIn: false,
        user: null,
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        fetchUser: vi.fn(),
        init: vi.fn(),
      })
    }
    return { isLoggedIn: false, user: null, login: mockLogin }
  },
}))

function renderLogin() {
  return render(
    <BrowserRouter>
      <ConfigProvider>
        <Login />
      </ConfigProvider>
    </BrowserRouter>
  )
}

describe('Login 页面', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('渲染登录表单', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByText('登 录')).toBeInTheDocument()
  })

  it('显示系统标题', () => {
    renderLogin()
    expect(screen.getByText('RAG 知识库问答')).toBeInTheDocument()
    expect(screen.getByText('企业级智能知识库问答平台')).toBeInTheDocument()
  })

  it('显示管理员提示', () => {
    renderLogin()
    expect(screen.getByText('管理员: admin / 123456')).toBeInTheDocument()
  })

  it('显示注册链接', () => {
    renderLogin()
    expect(screen.getByText('还没有账号？立即注册')).toBeInTheDocument()
  })

  it('提交时调用 login', async () => {
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('用户名'), 'admin')
    await userEvent.type(screen.getByPlaceholderText('密码'), '123456')
    await userEvent.click(screen.getByText('登 录'))

    expect(mockLogin).toHaveBeenCalledWith('admin', '123456')
  })

  it('空表单应显示验证错误', async () => {
    renderLogin()
    await userEvent.click(screen.getByText('登 录'))

    // Ant Design form validation
    expect(await screen.findByText('请输入用户名')).toBeInTheDocument()
  })
})
