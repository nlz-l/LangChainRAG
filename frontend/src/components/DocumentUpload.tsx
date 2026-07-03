import { Upload, Button, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

interface DocumentUploadProps {
  onSuccess: () => void
}

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const token = localStorage.getItem('access_token')

  const props: UploadProps = {
    name: 'file',
    accept: '.pdf,.txt,.md,.csv,.docx,.doc',
    action: '/api/knowledge/upload',
    headers: { Authorization: `Bearer ${token}` },
    showUploadList: { showRemoveIcon: true },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传并处理成功`)
        onSuccess()
      } else if (info.file.status === 'error') {
        // 尝试从响应中获取错误信息
        const response = info.file.response
        const errMsg = response?.detail || '上传失败'
        message.error(`${info.file.name} ${errMsg}`)
      }
    },
  }

  return (
    <Upload.Dragger {...props} style={{ padding: '20px 0' }}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p style={{ fontSize: 16 }}>点击或拖拽文件到此区域上传</p>
      <p style={{ color: '#999', fontSize: 13 }}>
        支持 PDF、TXT、Markdown、CSV、Word（.docx / .doc）格式，单文件最大 50MB
      </p>
    </Upload.Dragger>
  )
}
