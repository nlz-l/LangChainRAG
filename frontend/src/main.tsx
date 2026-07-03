import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'

// 全局 CSS 动画
const globalStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #bfbfbf; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }
  .message-content pre { background: #1e1e2e; color: #cdd6f4; border-radius: 10px; padding: 16px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
  .message-content code { font-family: "SF Mono", "Fira Code", monospace; font-size: 13px; }
  .message-content :not(pre) > code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; color: #e74c3c; }
  .message-content table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  .message-content th, .message-content td { border: 1px solid #e8e8e8; padding: 8px 12px; text-align: left; }
  .message-content th { background: #f5f6fa; font-weight: 600; }
  .message-content p { margin: 0 0 8px; }
  .message-content p:last-child { margin-bottom: 0; }
  .message-content ul, .message-content ol { margin: 8px 0; padding-left: 20px; }
`

const styleEl = document.createElement('style')
styleEl.textContent = globalStyles
document.head.appendChild(styleEl)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#667eea',
            borderRadius: 8,
            colorBgContainer: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          components: {
            Menu: {
              darkItemBg: 'transparent',
              darkItemSelectedBg: 'rgba(102,126,234,0.2)',
              darkItemColor: 'rgba(255,255,255,0.65)',
              darkItemSelectedColor: '#667eea',
            },
            Button: {
              borderRadius: 8,
              controlHeight: 36,
            },
            Input: {
              borderRadius: 8,
              controlHeight: 36,
            },
            Card: {
              borderRadiusLG: 14,
            },
          },
        }}
      >
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
