import { useEffect, useState, useCallback } from 'react'
import { Card, Table, Button, Popconfirm, message, Space, Typography, Tag } from 'antd'
import { DeleteOutlined, ReloadOutlined, FileTextOutlined, AppstoreOutlined, CloudUploadOutlined, FilePdfOutlined, FileWordOutlined, FileMarkdownOutlined, FileExcelOutlined, FileOutlined } from '@ant-design/icons'
import DocumentUpload from '../components/DocumentUpload'
import { knowledgeAPI, KnowledgeStats, DocumentInfo } from '../api/knowledge'

const ACCENT = '#667eea'

const fileTypeIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
    docx: <FileWordOutlined style={{ color: '#1890ff' }} />,
    doc: <FileWordOutlined style={{ color: '#1890ff' }} />,
    md: <FileMarkdownOutlined style={{ color: '#52c41a' }} />,
    txt: <FileTextOutlined style={{ color: '#666' }} />,
    csv: <FileExcelOutlined style={{ color: '#52c41a' }} />,
  }
  return map[ext || ''] || <FileOutlined style={{ color: '#999' }} />
}

const fileTypeColor = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = { pdf: 'red', docx: 'blue', doc: 'blue', md: 'green', txt: 'default', csv: 'green' }
  return map[ext || ''] || 'default'
}

export default function KnowledgeManage() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([knowledgeAPI.getStats(), knowledgeAPI.listDocuments()])
      setStats(s.data)
      setDocuments(d.data.documents || [])
    } catch { message.error('加载失败') } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (filename: string) => {
    try { await knowledgeAPI.deleteDocument(filename); message.success(`已删除 "${filename}"`); loadData() }
    catch { message.error('删除失败') }
  }
  const handleRebuild = async () => {
    try { await knowledgeAPI.rebuildIndex(); message.success('索引已重建'); loadData() }
    catch { message.error('重建失败') }
  }

  const columns = [
    {
      title: '文档名称', dataIndex: 'filename', key: 'filename', ellipsis: true,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {fileTypeIcon(text)}
          <Typography.Text strong style={{ fontSize: 13 }}>{text}</Typography.Text>
          <Tag color={fileTypeColor(text)} style={{ fontSize: 10, borderRadius: 4 }}>
            {text.split('.').pop()?.toUpperCase()}
          </Tag>
        </div>
      ),
    },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_: any, record: DocumentInfo) => (
        <Popconfirm title="确定删除？" description="将从知识库中永久删除" onConfirm={() => handleDelete(record.filename)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  const statCards = [
    { title: '文档总数', value: stats?.total_documents || 0, icon: <FileTextOutlined />, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { title: '知识片段', value: stats?.total_chunks || 0, icon: <AppstoreOutlined />, gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { title: '向量集合', value: stats?.collection_name || '-', icon: <CloudUploadOutlined />, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', isText: true },
  ]

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <Typography.Title level={4} style={{ marginBottom: 24, color: '#1a1a2e' }}>
        知识库管理
      </Typography.Title>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            padding: '20px 24px', borderRadius: 14,
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: card.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {card.icon}
            </div>
            <div>
              <Typography.Text style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>{card.title}</Typography.Text>
              <Typography.Text strong style={{ fontSize: card.isText ? 13 : 22, color: '#1a1a2e' }}>
                {card.value}
              </Typography.Text>
            </div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <Card
        title={<Typography.Text strong style={{ fontSize: 15 }}>上传文档</Typography.Text>}
        style={{ marginBottom: 24, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}
        bodyStyle={{ padding: '16px 24px 24px' }}
      >
        <DocumentUpload onSuccess={loadData} />
      </Card>

      {/* Document list */}
      <Card
        title={<Typography.Text strong style={{ fontSize: 15 }}>文档列表</Typography.Text>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} style={{ borderRadius: 8 }}>刷新</Button>
            <Popconfirm title="确定重建索引？" description="将清空所有知识库数据" onConfirm={handleRebuild}>
              <Button danger icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>重建索引</Button>
            </Popconfirm>
          </Space>
        }
        style={{ borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}
      >
        <Table
          columns={columns}
          dataSource={documents.map((d, i) => ({ ...d, key: i }))}
          loading={loading}
          locale={{ emptyText: '暂无文档，请上传 PDF/TXT/Markdown/CSV/Word 格式文件' }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
