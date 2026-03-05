<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { User, SwitchButton } from '@element-plus/icons-vue'
import { tokenManager } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeIndex = ref('/')
const isInitialized = ref(false)

// 直接使用 store 的计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn)

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

const handleSelect = (path: string) => {
  if (path === 'profile') {
    goToProfile()
    return
  }
  if (path === 'logout') {
    handleLogout()
    return
  }
  router.push(path)
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
      <span class="logo">bbsDemo</span>
    </el-menu-item>

    <!-- 导航链接 -->
    <el-menu-item index="/">首页</el-menu-item>
    <el-menu-item index="/forum">论坛</el-menu-item>
    <el-menu-item index="/news">资讯</el-menu-item>
    <el-menu-item index="/community">社区</el-menu-item>
    <el-menu-item index="/about">关于</el-menu-item>

    <!-- 右侧空白填充 -->
    <div class="flex-grow" />

    <!-- 用户区域 - 已登录 -->
    <el-sub-menu v-if="isLoggedIn" index="user">
      <template #title>
        <el-avatar :size="36" :src="userStore.avatarUrl" />
        <span class="username">{{ userStore.displayName }}</span>
      </template>
      <el-menu-item index="profile">
        <el-icon class="menu-icon"><User /></el-icon>
        个人中心
      </el-menu-item>
      <el-menu-item index="logout">
        <el-icon class="menu-icon"><SwitchButton /></el-icon>
        退出登录
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

/* 移动端适配 */
@media (max-width: 768px) {
  .navbar :deep(.el-menu-item:not(.logo-item)) {
    padding: 0 10px;
  }
  
  .username {
    display: none;
  }
}
</style>
