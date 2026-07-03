import axios from 'axios'

// 直接请求后端，绕过 Vite 代理
const API_BASE = 'http://localhost:8000/api'
const api = axios.create({ baseURL: API_BASE })

// 使用 defaults 而不是拦截器确保 token 始终被带上
function getToken(): string | null {
  return localStorage.getItem('access_token')
}

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 时清除状态并跳转（登录接口和未登录请求除外）
    if (err.response?.status === 401) {
      const isAuthEndpoint = err.config?.url?.includes('/auth/')
      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  username: string
  role: string
}

export interface UserInfo {
  id: number
  username: string
  role: string
  is_active: boolean
}

export const authAPI = {
  login: (data: LoginParams) => api.post<TokenResponse>('/auth/login', data),
  register: (data: RegisterParams) => api.post<UserInfo>('/auth/register', data),
  getMe: () => api.get<UserInfo>('/auth/me', {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  }),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password', { old_password, new_password }),
}

export default api
