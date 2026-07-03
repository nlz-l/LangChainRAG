import { useState } from 'react'
import { Card, Form, Input, Button, Typography, Descriptions, message, Avatar } from 'antd'
import { UserOutlined, LockOutlined, CrownOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../api/auth'

const ACCENT = '#667eea'

export default function Profile() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const onChangePassword = async (values: { old_password: string; new_password: string }) => {
    setLoading(true)
    try {
      await authAPI.changePassword(values.old_password, values.new_password)
      message.success('密码修改成功')
    } catch (err: any) {
      message.error(err.response?.data?.detail || '修改失败')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800, margin: '0 auto' }}>
      <Typography.Title level={4} style={{ marginBottom: 24, color: '#1a1a2e' }}>个人中心</Typography.Title>

      {/* User info card */}
      <Card style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 24, border: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar
            size={64}
            icon={<UserOutlined />}
            style={{
              background: user?.role === 'admin'
                ? 'linear-gradient(135deg, #f093fb, #f5576c)'
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Typography.Title level={5} style={{ margin: 0 }}>{user?.username || '-'}</Typography.Title>
              {user?.role === 'admin' && (
                <span style={{
                  padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <CrownOutlined /> 管理员
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <Typography.Text style={{ fontSize: 13, color: '#8c8c8c' }}>
                角色: {user?.role === 'admin' ? '管理员' : '普通用户'}
              </Typography.Text>
              <Typography.Text style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                状态: {user?.is_active ? '正常' : '已禁用'}
              </Typography.Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card
        title={<Typography.Text strong style={{ fontSize: 15 }}>修改密码</Typography.Text>}
        style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}
      >
        <Form name="changePassword" onFinish={onChangePassword} layout="vertical" style={{ maxWidth: 420 }}>
          <Form.Item name="old_password" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入原密码" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="new_password" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6个字符' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入新密码" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item
            name="confirm_password" label="确认新密码" dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve()
                  return Promise.reject(new Error('两次密码输入不一致'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="请再次输入新密码" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{
              height: 40, borderRadius: 10, fontWeight: 600, padding: '0 32px',
              background: `linear-gradient(135deg, ${ACCENT}, #764ba2)`, border: 'none',
              boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
            }}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
