import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Typography } from 'antd'
import {
  MessageOutlined,
  DatabaseOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'

const { Header, Sider, Content } = AntLayout

const SIDEBAR_BG = '#0f1526'
const SIDEBAR_SELECTED = '#1a2740'
const ACCENT = '#667eea'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = user?.role === 'admin'
  const currentKey = (() => {
    if (location.pathname.startsWith('/chat')) return '/chat'
    if (location.pathname.startsWith('/knowledge')) return '/knowledge'
    return location.pathname
  })()

  const menuItems = [
    { key: '/chat', icon: <MessageOutlined />, label: '知识库问答' },
    ...(isAdmin ? [{ key: '/knowledge', icon: <DatabaseOutlined />, label: '知识库管理' }] : []),
    { type: 'divider' as const },
    { key: '/profile', icon: <SettingOutlined />, label: '个人中心' },
  ]

  const userMenuItems = [
    { key: 'profile', icon: <SettingOutlined />, label: '个人设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  const handleMenuClick = ({ key }: { key: string }) => navigate(key)
  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      useChatStore.setState({ sessions: [], currentSessionId: null, messages: [] })
      navigate('/login')
    } else if (key === 'profile') navigate('/profile')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          background: SIDEBAR_BG,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${ACCENT}, #764ba2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BookOutlined style={{ fontSize: 18, color: '#fff' }} />
          </div>
          {!collapsed && (
            <Typography.Text style={{ color: '#fff', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
              知识库问答
            </Typography.Text>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 0,
            marginTop: 8,
            padding: '0 8px',
          }}
          theme="dark"
        />
      </Sider>

      <AntLayout>
        {/* Header */}
        <Header style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, color: '#555' }}
          />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={['click']}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                size={32}
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #764ba2)`,
                  flexShrink: 0,
                }}
                icon={<UserOutlined />}
              />
              <div>
                <Typography.Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                  {user?.username || '用户'}
                </Typography.Text>
                {isAdmin && (
                  <Typography.Text style={{ fontSize: 10, color: ACCENT }}>管理员</Typography.Text>
                )}
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ background: '#f5f6fa', overflow: 'auto', height: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
