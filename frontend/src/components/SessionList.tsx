import { Button, Typography, Dropdown, Modal, Input, Tooltip } from 'antd'
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import type { SessionInfo } from '../api/chat'

interface SessionListProps {
  sessions: SessionInfo[]
  currentSessionId: number | null
  onSwitch: (id: number) => void
  onCreate: () => void
  onDelete: (id: number) => void
  onRename: (id: number, title: string) => void
}

const ACCENT = '#667eea'

export default function SessionList({ sessions, currentSessionId, onSwitch, onCreate, onDelete, onRename }: SessionListProps) {
  const [renameModal, setRenameModal] = useState<{ id: number; title: string } | null>(null)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* New chat button */}
      <div style={{ padding: '14px 12px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={onCreate}
          style={{
            height: 40, borderRadius: 10, fontWeight: 600, fontSize: 13,
            background: `linear-gradient(135deg, ${ACCENT}, #764ba2)`,
            border: 'none',
            boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
          }}
        >
          新对话
        </Button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <MessageOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
            <Typography.Paragraph style={{ color: '#bbb', fontSize: 12, marginTop: 10 }}>
              暂无对话
            </Typography.Paragraph>
          </div>
        ) : (
          sessions.map((item) => {
            const isActive = item.id === currentSessionId
            return (
              <div
                key={item.id}
                onClick={() => onSwitch(item.id)}
                style={{
                  padding: '11px 14px',
                  marginBottom: 4,
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.08))' : 'transparent',
                  borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Tooltip title={item.title}>
                    <Typography.Text
                      strong={isActive}
                      style={{
                        fontSize: 13, display: 'block', flex: 1, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: isActive ? ACCENT : '#333',
                      }}
                    >
                      {item.title}
                    </Typography.Text>
                  </Tooltip>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'rename', icon: <EditOutlined />, label: '重命名' },
                        { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                      ],
                      onClick: ({ key, domEvent }) => {
                        domEvent.stopPropagation()
                        if (key === 'rename') setRenameModal({ id: item.id, title: item.title })
                        else if (key === 'delete') {
                          Modal.confirm({ title: '确认删除', content: '删除后对话记录不可恢复', onOk: () => onDelete(item.id) })
                        }
                      },
                    }}
                    trigger={['click']}
                  >
                    <Button
                      type="text" size="small"
                      icon={<MoreOutlined style={{ fontSize: 12, color: '#bbb' }} />}
                      onClick={e => e.stopPropagation()}
                      style={{ opacity: 0.5 }}
                    />
                  </Dropdown>
                </div>
                <Typography.Text style={{ fontSize: 11, color: '#bbb', marginTop: 2, display: 'block' }}>
                  {item.message_count || 0} 条 · {item.updated_at ? dayjs(item.updated_at).format('MM-DD HH:mm') : ''}
                </Typography.Text>
              </div>
            )
          })
        )}
      </div>

      <Modal
        title="重命名会话"
        open={!!renameModal}
        onOk={() => { if (renameModal) { onRename(renameModal.id, renameModal.title); setRenameModal(null) } }}
        onCancel={() => setRenameModal(null)}
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <Input
          value={renameModal?.title || ''}
          onChange={e => setRenameModal(prev => prev ? { ...prev, title: e.target.value } : null)}
          style={{ borderRadius: 8 }}
        />
      </Modal>
    </div>
  )
}
