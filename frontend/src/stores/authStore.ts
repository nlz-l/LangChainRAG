import { create } from 'zustand'
import { authAPI, UserInfo } from '../api/auth'

interface AuthState {
  isLoggedIn: boolean
  user: UserInfo | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: !!localStorage.getItem('access_token'),
  user: null,

  login: async (username, password) => {
    const res = await authAPI.login({ username, password })
    const { access_token, refresh_token, username: uname, role } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    set({
      isLoggedIn: true,
      user: { id: 0, username: uname, role, is_active: true },
    })
  },

  register: async (username, password) => {
    await authAPI.register({ username, password })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ isLoggedIn: false, user: null })
  },

  fetchUser: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ isLoggedIn: false, user: null })
      return
    }
    try {
      const res = await authAPI.getMe()
      set({ isLoggedIn: true, user: res.data })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ isLoggedIn: false, user: null })
    }
  },

  init: async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      await get().fetchUser()
    }
  },
}))
