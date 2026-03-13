import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { userApi, authApi } from '@/services/userApi'
import { tokenManager } from '@/utils/auth'
import { config } from '@/config'

// 用户类型定义
export interface User {
  id: string | number
  email: string
  nickname?: string
  bio?: string
  avatar?: string
  status?: number
  is_admin?: boolean
  is_verified?: boolean
  created_at: string
}

// 使用 Pinia 创建用户状态管理 Store
export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  // 当前用户信息
  const user = ref<User | null>(null)
  // 加载状态
  const isLoading = ref(false)
  // 错误信息
  const error = ref('')

  // ==================== Getters ====================
  // 是否已登录
  const isLoggedIn = computed(() => !!user.value && tokenManager.isAuthenticated())
  // 用户昵称（如果没有则显示邮箱前缀）
  const displayName = computed(() => {
    if (!user.value) return '未登录'
    if (user.value.nickname) return user.value.nickname
    if (user.value.email) return user.value.email.split('@')[0]
    return '匿名用户'
  })
  // 用户头像（如果没有则使用默认头像）
  const avatarUrl = computed(() => {
    const avatar = user.value?.avatar
    // 检查是否为空字符串、null 或 undefined
    if (!avatar || avatar.trim() === '') {
      return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
    // 如果是相对路径（以 / 开头），转换为完整的 URL
    if (avatar.startsWith('/')) {
      return `http://localhost:8080${avatar}`
    }
    // 如果已经是完整 URL，直接返回
    return avatar
  })

  // ==================== Actions ====================
  // 获取用户信息
  async function fetchUserInfo() {
    if (!tokenManager.isAuthenticated()) {
      user.value = null
      return
    }

    try {
      isLoading.value = true
      error.value = ''
      const response = await userApi.getUserInfo()
      console.log('获取用户信息响应:', response)
      console.log('response.user:', response.user)
      // 后端返回格式: { user: { ... } }
      user.value = response.user || response
      console.log('user.value:', user.value)
    } catch (err: any) {
      error.value = err.response?.error || '获取用户信息失败'
      console.error('获取用户信息错误:', err)
      // 如果获取失败且是 401 错误，清除登录状态
      if (err.response?.status === 401) {
        logout()
      }
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户信息
  async function updateUserInfo(data: { nickname?: string; bio?: string; avatar?: string }) {
    try {
      isLoading.value = true
      error.value = ''

      if (data.nickname) {
        await userApi.updateNickname({ nickname: data.nickname })
      }

      if (data.bio) {
        await userApi.updateBio({ bio: data.bio })
      }

      // 更新本地状态
      if (user.value) {
        user.value = { ...user.value, ...data }
      }

      return true
    } catch (err: any) {
      error.value = err.response?.error || '更新用户信息失败'
      console.error('更新用户信息错误:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 上传头像
  async function uploadUserAvatar(file: File) {
    try {
      isLoading.value = true
      error.value = ''

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await userApi.uploadAvatar(formData)

      // 更新本地状态
      // 后端返回: { message: "...", avatar: "/uploads/..." }
      if (user.value && response.avatar) {
        user.value.avatar = response.avatar
      }

      return true
    } catch (err: any) {
      error.value = err.response?.error || '上传头像失败'
      console.error('上传头像错误:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 注销账号
  async function deleteAccount(email: string, code: string) {
    try {
      isLoading.value = true
      error.value = ''

      await authApi.deleteAccount({ email, code })

      // 清除本地状态
      logout()

      return true
    } catch (err: any) {
      error.value = err.response?.error || '注销账号失败'
      console.error('注销账号错误:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 登录
  async function login(email: string, password: string) {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authApi.login({ email, password })

      // 保存 refresh_token
      if (response.tokens?.refresh_token) {
        localStorage.setItem('refresh_token', response.tokens.refresh_token)
      }

      // 获取用户信息
      await fetchUserInfo()

      return true
    } catch (err: any) {
      error.value = err.response?.error || '登录失败'
      console.error('登录错误:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await authApi.logout({ refresh_token: refreshToken })
      }
    } catch (err) {
      console.error('登出错误:', err)
    } finally {
      // 清除本地状态
      user.value = null
      tokenManager.removeToken()
      localStorage.removeItem('refresh_token')
    }
  }

  // 登出所有设备
  async function logoutAll() {
    try {
      await authApi.logoutAll()
    } catch (err) {
      console.error('登出所有设备错误:', err)
    } finally {
      // 清除本地状态
      user.value = null
      tokenManager.removeToken()
      localStorage.removeItem('refresh_token')
    }
  }

  // 初始化（应用启动时调用）
  async function init() {
    if (tokenManager.isAuthenticated()) {
      await fetchUserInfo()
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    
    // Getters
    isLoggedIn,
    displayName,
    avatarUrl,
    
    // Actions
    init,
    fetchUserInfo,
    updateUserInfo,
    uploadUserAvatar,
    deleteAccount,
    login,
    logout,
    logoutAll
  }
})
