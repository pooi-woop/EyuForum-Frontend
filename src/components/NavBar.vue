<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { User, SwitchButton, Search, Refresh, Setting, Message, ChatLineRound } from '@element-plus/icons-vue'
import { tokenManager } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import Avatar from './Avatar.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeIndex = ref('/')
const isInitialized = ref(false)
const searchKeyword = ref('')

// 直接使用 store 的计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.user?.is_admin || false)

// 组件挂载时初始化
onMounted(async () => {
  // 初始化用户状态
  await userStore.init()
  
  activeIndex.value = route.path
  isInitialized.value = true
})

const handleLogout = async () => {
  await userStore.logout()
  router.push('/')
}

const goToProfile = () => {
  router.push('/profile')
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 跳转到搜索结果页面并传递搜索关键词
    router.push({
      path: '/search',
      query: { keyword: searchKeyword.value.trim() }
    })
    searchKeyword.value = ''
  }
}

const handleSelect = (path: string) => {
  if (path === 'profile') {
    goToProfile()
    return
  }
  if (path === 'logout') {
    handleLogout()
    return
  }
  if (path === 'logout-all') {
    handleLogoutAll()
    return
  }
  if (path === 'admin') {
    goToAdmin()
    return
  }
  router.push(path)
}

// 跳转到管理员界面
const goToAdmin = () => {
  if (!isAdmin.value) {
    ElMessage.warning('功能未对您开放')
    return
  }
  router.push('/admin')
}

// 处理登出所有设备
const handleLogoutAll = async () => {
  await userStore.logoutAll()
  router.push('/')
}
</script>

<template>
  <el-menu
    :default-active="activeIndex"
    mode="horizontal"
    :ellipsis="false"
    class="navbar"
    @select="handleSelect"
  >
    <!-- Logo -->
    <el-menu-item index="/" class="logo-item">
      <span class="logo">EyuForum</span>
    </el-menu-item>

    <!-- 导航链接 -->
    <el-menu-item index="/">首页</el-menu-item>
    <el-menu-item index="/forum">论坛</el-menu-item>
    <el-menu-item index="/ai">AI 问答</el-menu-item>
    <el-menu-item index="/about">关于</el-menu-item>

    <!-- 搜索框 -->
    <div class="search-container">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索帖子..."
        :prefix-icon="Search"
        clearable
        @keyup.enter="handleSearch"
        class="search-input"
      />
    </div>

    <!-- 右侧空白填充 -->
    <div class="flex-grow" />

    <!-- 信箱图标 -->
    <el-menu-item v-if="isLoggedIn" index="/inbox" class="inbox-item">
      <el-icon class="inbox-icon"><Message /></el-icon>
    </el-menu-item>

    <!-- 用户区域 - 已登录 -->
    <el-sub-menu v-if="isLoggedIn" index="user">
      <template #title>
        <Avatar :src="userStore.avatarUrl" :size="36" />
        <span class="username">{{ userStore.displayName }}</span>
      </template>
      <el-menu-item index="profile">
        <el-icon class="menu-icon"><User /></el-icon>
        个人中心
      </el-menu-item>
      <el-menu-item index="admin">
        <el-icon class="menu-icon"><Setting /></el-icon>
        管理员后台
      </el-menu-item>
      <el-menu-item index="logout">
        <el-icon class="menu-icon"><SwitchButton /></el-icon>
        退出登录
      </el-menu-item>
      <el-menu-item index="logout-all">
        <el-icon class="menu-icon"><Refresh /></el-icon>
        登出所有设备
      </el-menu-item>
    </el-sub-menu>

    <!-- 用户区域 - 未登录 -->
    <el-menu-item v-else index="/login">
      <el-button type="primary" size="small">登录</el-button>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
}

.navbar :deep(.el-menu-item),
.navbar :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.9) !important;
  border-bottom: none !important;
}

.navbar :deep(.el-menu-item:hover),
.navbar :deep(.el-sub-menu__title:hover) {
  color: #fff !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.navbar :deep(.el-menu-item.is-active) {
  color: #fff !important;
  border-bottom: 2px solid #fff !important;
}

.logo-item {
  pointer-events: none;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
}

.flex-grow {
  flex-grow: 1;
}

.username {
  margin-left: 8px;
  color: #fff;
}

.menu-icon {
  font-size: 18px;
  margin-right: 6px;
}

.search-container {
  margin: 0 20px;
  min-width: 200px;
  max-width: 300px;
  align-self: center;
}

.search-input {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 20px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: none;
}

.search-input :deep(.el-input__inner) {
  background: transparent;
  border: none;
  color: #fff;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.search-input :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.6);
}

.inbox-item {
  padding: 0 15px !important;
}

.inbox-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.inbox-icon:hover {
  color: #fff;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .navbar :deep(.el-menu-item:not(.logo-item)) {
    padding: 0 10px;
  }
  
  .username {
    display: none;
  }
  
  .search-container {
    display: none;
  }
}
</style>
