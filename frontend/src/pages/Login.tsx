import { useState } from 'react'
import { Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success('登录成功')
      window.location.href = '/chat'
    } catch (err: any) {
      message.error(err.response?.data?.detail || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* 背景装饰 */}
      <div style={styles.bgDecor}>
        <div style={{ ...styles.bgCircle, width: 400, height: 400, top: -100, left: -100 }} />
        <div style={{ ...styles.bgCircle, width: 300, height: 300, bottom: -80, right: -80 }} />
        <div style={{ ...styles.bgCircle, width: 200, height: 200, top: '40%', left: '60%' }} />
      </div>

      {/* 登录卡片 */}
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Typography.Title level={2} style={{ margin: '16px 0 0', color: '#1a1a2e' }}>
            RAG 知识库问答
          </Typography.Title>
          <Typography.Text style={{ color: '#8c8c8c', fontSize: 15 }}>
            企业级智能知识库问答平台
          </Typography.Text>
        </div>

        {/* 表单 */}
        <Form name="login" onFinish={onFinish} size="large" style={{ width: '100%' }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用户名"
              style={styles.input}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
              style={styles.input}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={styles.loginBtn}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Link to="/register" style={{ color: '#667eea', fontSize: 13 }}>
            还没有账号？立即注册
          </Link>
        </div>

        <div style={styles.footer}>
          <Typography.Text style={{ color: '#bfbfbf', fontSize: 12 }}>
            管理员: admin / 123456
          </Typography.Text>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  bgDecor: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: 420,
    padding: '48px 40px 32px',
    background: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 20,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'fadeInUp 0.6s ease-out',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
  },
  input: {
    borderRadius: 10,
    height: 46,
    fontSize: 14,
  },
  loginBtn: {
    height: 46,
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 4,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
    width: '100%',
  },
}
