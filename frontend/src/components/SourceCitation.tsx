import { Typography } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import type { SourceInfo } from '../api/chat'

interface SourceCitationProps {
  source: SourceInfo
  index: number
}

export default function SourceCitation({ source, index }: SourceCitationProps) {
  return (
    <div style={{
      minWidth: 240,
      maxWidth: 300,
      padding: '12px 14px',
      borderRadius: 10,
      background: '#fff',
      border: '1px solid #f0f0f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      flexShrink: 0,
      cursor: 'default',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{index}</span>
        </div>
        <Typography.Text strong style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {source.doc_name}
        </Typography.Text>
      </div>
      <Typography.Paragraph
        style={{ margin: 0, fontSize: 11, color: '#999', lineHeight: 1.6 }}
        ellipsis={{ rows: 3 }}
      >
        {source.chunk}
      </Typography.Paragraph>
      {source.score !== null && source.score !== undefined && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            height: 4, flex: 1, borderRadius: 2, background: '#f0f0f0', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${Math.round(source.score * 100)}%`,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #11998e, #38ef7d)',
            }} />
          </div>
          <Typography.Text style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>
            {Math.round(source.score * 100)}%
          </Typography.Text>
        </div>
      )}
    </div>
  )
}
