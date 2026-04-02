<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  email: '',
  password: '',
  code: ''
})

const resetForm = ref({
  email: '',
  password: '',
  code: ''
})

const activeTab = ref('login')
const isLoading = ref(false)
const error = ref('')
const success = ref('')

// 登录
const handleLogin = async () => {
  // 表单验证
  if (!loginForm.value.email || !loginForm.value.password) {
    error.value = '请填写邮箱和密码'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    console.log('正在登录:', loginForm.value.email)
    
    const response = await authApi.login(loginForm.value)
    
    console.log('登录成功:', response)
    
    // 存储 access_token 和 refresh_token
    if (response.tokens) {
      tokenManager.setToken(response.tokens.access_token)
      localStorage.setItem('refresh_token', response.tokens.refresh_token)
      console.log('Token已保存:', response.tokens.access_token.substring(0, 20) + '...')
    }
    
    // 获取用户信息
    await userStore.fetchUserInfo()
    console.log('用户信息已获取:', userStore.user)
    
    success.value = '登录成功'
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (err: any) {
    console.error('登录错误详情:', err)
    error.value = err.response?.data?.error || err.message || '登录失败，请检查邮箱和密码'
  } finally {
    isLoading.value = false
  }
}

// 发送验证码
const sendCode = async () => {
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!registerForm.value.email) {
    error.value = '请输入邮箱地址'
    return
  }
  if (!emailRegex.test(registerForm.value.email)) {
    error.value = '请输入正确的邮箱格式'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    console.log('正在发送验证码到:', registerForm.value.email)
    
    const response = await authApi.sendCode({
      email: registerForm.value.email,
      type: 'register'
    })
    
    console.log('验证码发送成功:', response)
    ElMessage.success('验证码已发送到您的邮箱，请查收')
  } catch (err: any) {
    console.error('发送验证码错误详情:', err)
    const errorMsg = err.response?.data?.error || err.message || '发送验证码失败，请检查网络连接'
    error.value = errorMsg
    
    // 如果邮箱已被注册，弹出提示
    if (err.response?.status === 409 || errorMsg.includes('邮箱已被注册') || errorMsg.includes('already exists') || errorMsg.includes('邮箱已存在')) {
      ElMessageBox.alert('邮箱已被注册', '提示', {
        confirmButtonText: '确定',
        type: 'warning',
        center: true
      })
    }
  } finally {
    isLoading.value = false
  }
}

// 注册
const handleRegister = async () => {
  // 表单验证
  if (!registerForm.value.email || !registerForm.value.password || !registerForm.value.code) {
    error.value = '请填写完整信息'
    return
  }
  if (registerForm.value.password.length < 6) {
    error.value = '密码长度至少6位'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    console.log('正在注册:', registerForm.value.email)
    
    const response = await authApi.register(registerForm.value)
    
    console.log('注册成功:', response)
    
    success.value = '注册成功，请登录'
    activeTab.value = 'login'
    // 清空注册表单
    registerForm.value = {
      email: registerForm.value.email, // 保留邮箱
      password: '',
      code: ''
    }
  } catch (err: any) {
    console.error('注册错误详情:', err)
    const errorMsg = err.response?.data?.error || err.message || '注册失败'
    error.value = errorMsg
    
    // 如果邮箱已被注册，弹出提示
    if (err.response?.status === 409 || errorMsg.includes('邮箱已被注册') || errorMsg.includes('already exists')) {
      ElMessageBox.alert('邮箱已被注册', '提示', {
        confirmButtonText: '确定',
        type: 'warning',
        center: true
      })
    }
  } finally {
    isLoading.value = false
  }
}

// 发送重置密码验证码
const sendResetCode = async () => {
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!resetForm.value.email) {
    error.value = '请输入邮箱地址'
    return
  }
  if (!emailRegex.test(resetForm.value.email)) {
    error.value = '请输入正确的邮箱格式'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    console.log('正在发送验证码到:', resetForm.value.email)
    
    const response = await authApi.sendCode({
      email: resetForm.value.email,
      type: 'reset'
    })
    
    console.log('验证码发送成功:', response)
    ElMessage.success('验证码已发送到您的邮箱，请查收')
  } catch (err: any) {
    console.error('发送验证码错误详情:', err)
    error.value = err.response?.data?.error || err.message || '发送验证码失败，请检查网络连接'
  } finally {
    isLoading.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  // 表单验证
  if (!resetForm.value.email || !resetForm.value.password || !resetForm.value.code) {
    error.value = '请填写完整信息'
    return
  }
  if (resetForm.value.password.length < 6) {
    error.value = '密码长度至少6位'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    console.log('正在重置密码:', resetForm.value.email)
    
    const response = await authApi.resetPassword(resetForm.value)
    
    console.log('重置密码成功:', response)
    
    success.value = '密码重置成功，请登录'
    activeTab.value = 'login'
    // 清空重置表单
    resetForm.value = {
      email: '',
      password: '',
      code: ''
    }
  } catch (err: any) {
    console.error('重置密码错误详情:', err)
    error.value = err.response?.data?.error || err.message || '重置密码失败'
  } finally {
    isLoading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      await authApi.logout({ refresh_token: refreshToken })
    }
    tokenManager.removeToken()
    localStorage.removeItem('refresh_token')
    success.value = '已退出登录'
  } catch (err) {
    console.error('退出登录错误', err)
    // 即使失败也要清除本地存储
    tokenManager.removeToken()
    localStorage.removeItem('refresh_token')
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h1>bbsDemo</h1>
      
      <!-- 标签页 -->
      <div class="tab-container">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          登录
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          注册
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'reset' }"
          @click="activeTab = 'reset'"
        >
          找回密码
        </button>
      </div>
      
      <!-- 登录表单 -->
      <div v-if="activeTab === 'login'" class="form-container">
        <el-form :model="loginForm" label-width="80px">
          <el-form-item label="邮箱">
            <el-input v-model="loginForm.email" placeholder="请输入邮箱" type="email" />
          </el-form-item>
          
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleLogin" :loading="isLoading" style="width: 100%">
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 注册表单 -->
      <div v-if="activeTab === 'register'" class="form-container">
        <el-form :model="registerForm" label-width="80px">
          <el-form-item label="邮箱">
            <el-input v-model="registerForm.email" placeholder="请输入邮箱" type="email" />
          </el-form-item>
          
          <el-form-item label="密码">
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          
          <el-form-item label="验证码">
            <el-input v-model="registerForm.code" placeholder="请输入验证码">
              <template #append>
                <el-button @click="sendCode" :loading="isLoading">
                  发送验证码
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleRegister" :loading="isLoading" style="width: 100%">
              注册
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 找回密码表单 -->
      <div v-if="activeTab === 'reset'" class="form-container">
        <el-form :model="resetForm" label-width="80px">
          <el-form-item label="邮箱">
            <el-input v-model="resetForm.email" placeholder="请输入邮箱" type="email" />
          </el-form-item>
          
          <el-form-item label="新密码">
            <el-input v-model="resetForm.password" type="password" placeholder="请输入新密码" />
          </el-form-item>
          
          <el-form-item label="验证码">
            <el-input v-model="resetForm.code" placeholder="请输入验证码">
              <template #append>
                <el-button @click="sendResetCode" :loading="isLoading">
                  发送验证码
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleResetPassword" :loading="isLoading" style="width: 100%">
              重置密码
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 消息提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
      
      <!-- Token 状态 -->
      <div class="token-info">
        <h3>登录状态</h3>
        <p>是否已登录: {{ tokenManager.isAuthenticated() ? '是' : '否' }}</p>
        <el-button v-if="tokenManager.isAuthenticated()" type="danger" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
}

.login-box {
  width: 100%;
  max-width: 400px;
  margin: 1rem;
  padding: clamp(1.5rem, 5vw, 2rem);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: clamp(1.5rem, 4vw, 2rem);
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: bold;
}

.tab-container {
  display: flex;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  border-bottom: 1px solid #e4e7ed;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem 0;
  background: none;
  border: none;
  font-size: clamp(0.875rem, 3vw, 1rem);
  color: #909399;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
}

.form-container {
  margin-bottom: 1rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  text-align: center;
}

.success-message {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f0f9eb;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  color: #67c23a;
  text-align: center;
}

.token-info {
  margin-top: clamp(1.5rem, 4vw, 2rem);
  padding: clamp(0.75rem, 2vw, 1rem);
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.token-info h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.token-info p {
  margin: 0.5rem 0;
  color: #606266;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
}

@media (max-width: 480px) {
  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 0.5rem;
  }
  
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>
