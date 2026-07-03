import { useState } from 'react'
import { Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await register(values.username, values.password)
      message.success('注册成功，请登录')
      window.location.href = '/login'
    } catch (err: any) {
      message.error(err.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgDecor}>
        <div style={{ ...styles.bgCircle, width: 400, height: 400, top: -100, right: -100 }} />
        <div style={{ ...styles.bgCircle, width: 300, height: 300, bottom: -80, left: -80 }} />
      </div>

      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Typography.Title level={2} style={{ margin: '16px 0 0', color: '#1a1a2e' }}>
            创建账号
          </Typography.Title>
          <Typography.Text style={{ color: '#8c8c8c', fontSize: 15 }}>
            加入企业级知识库问答平台
          </Typography.Text>
        </div>

        <Form name="register" onFinish={onFinish} size="large" style={{ width: '100%' }}>
          <Form.Item name="username" rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, message: '至少2个字符' },
          ]}>
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="用户名" style={styles.input} />
          </Form.Item>
          <Form.Item name="password" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '至少6个字符' },
          ]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="密码" style={styles.input} />
          </Form.Item>
          <Form.Item name="confirmPassword" dependencies={['password']} rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve()
                return Promise.reject(new Error('两次密码输入不一致'))
              },
            }),
          ]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="确认密码" style={styles.input} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={styles.loginBtn}>
              注 册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#667eea', fontSize: 13 }}>
            已有账号？去登录
          </Link>
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
  },
  bgDecor: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoArea: { textAlign: 'center', marginBottom: 32 },
  logoIcon: {
    width: 60, height: 60, borderRadius: 16,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
  },
  input: { borderRadius: 10, height: 46, fontSize: 14 },
  loginBtn: {
    height: 46, borderRadius: 10, fontSize: 15, fontWeight: 600, letterSpacing: 4,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none', boxShadow: '0 4px 15px rgba(102,126,234,0.4)', marginTop: 4,
  },
}
