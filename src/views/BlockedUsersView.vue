<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { blockApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 状态管理
const blockedUsers = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')

// 页面加载时检查登录状态
onMounted(async () => {
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录后再查看黑名单'
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else {
    await fetchBlockedUsers()
  }
})

// 获取拉黑列表
const fetchBlockedUsers = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('开始获取拉黑列表...')
    const response = await blockApi.getBlockedUsers({
      page: currentPage.value,
      page_size: pageSize.value,
      t: Date.now() // 添加时间戳避免缓存
    })
    
    console.log('获取拉黑列表响应:', response)
    console.log('响应数据结构:', JSON.stringify(response, null, 2))
    
    // 检查响应中是否包含拉黑时间字段
    if (response && Array.isArray(response) && response.length > 0) {
      console.log('第一个用户数据:', JSON.stringify(response[0], null, 2))
      console.log('是否包含created_at字段:', 'created_at' in response[0])
      console.log('是否包含blocked_at字段:', 'blocked_at' in response[0])
      console.log('是否包含unblocked_at字段:', 'unblocked_at' in response[0])
      console.log('是否包含is_blocked字段:', 'is_blocked' in response[0])
      console.log('是否包含status字段:', 'status' in response[0])
    }
    
    // 由于响应拦截器已经返回了response.data，所以直接使用response
    // 检查响应数据结构
    if (response && Array.isArray(response)) {
      // 如果响应直接是数组
      blockedUsers.value = response
      total.value = response.length
    } else if (response && typeof response === 'object') {
      // 如果响应是对象，检查可能的字段
      if (response.data) {
        // 标准格式: { data: [...], total: 1 }
        blockedUsers.value = response.data
        total.value = response.total || response.data.length
      } else if (response.blocked_users) {
        // 可能的格式: { blocked_users: [...], total: 1 }
        blockedUsers.value = response.blocked_users
        total.value = response.total || response.blocked_users.length
      } else if (response.users) {
        // 可能的格式: { users: [...], total: 1 }
        blockedUsers.value = response.users
        total.value = response.total || response.users.length
      } else {
        // 其他情况，尝试将整个对象作为单个用户
        blockedUsers.value = [response]
        total.value = 1
      }
    } else {
      blockedUsers.value = []
      total.value = 0
    }
    
    // 显示所有被拉黑过的用户（包括已释放的）
    console.log('获取到的用户数量:', blockedUsers.value.length)
    total.value = blockedUsers.value.length
    
    console.log('解析后的数据:', {
      blockedUsers: blockedUsers.value,
      total: total.value
    })
  } catch (err: any) {
    console.error('获取拉黑列表错误:', err)
    console.error('错误响应:', err.response)
    // 只有真正的错误才显示错误信息，空列表不算错误
    if (err.response?.status && err.response?.status !== 200) {
      error.value = err.response?.data?.error || err.response?.error || '获取拉黑列表失败'
    }
    // 清空列表
    blockedUsers.value = []
    total.value = 0
  } finally {
    console.log('获取拉黑列表完成，设置isLoading为false')
    isLoading.value = false
  }
}

// 取消拉黑
const unblockUser = (userId: string | number, userName: string) => {
  console.log('unblockUser 被调用:', { userId, userName })
  console.log('userId 类型:', typeof userId)
  console.log('userId 是否为空:', !userId)
  
  // 确保 userId 是字符串类型，避免大数字精度问题
  const stringUserId = String(userId)
  
  if (!stringUserId) {
    console.error('userId 为空，无法取消拉黑')
    ElMessage.error('用户ID无效')
    return
  }
  
  console.log('处理后的 userId:', stringUserId)
  
  ElMessageBox.confirm(`确定要取消拉黑用户 "${userName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      
      console.log('开始取消拉黑用户:', stringUserId)
      console.log('调用 blockApi.unblockUser:', stringUserId)
      await blockApi.unblockUser(stringUserId)
      
      ElMessage.success('取消拉黑成功')
      
      // 重新获取拉黑列表（确保数据同步）
      console.log('重新获取拉黑列表...')
      await fetchBlockedUsers()
    } catch (err: any) {
      console.error('取消拉黑错误:', err)
      console.error('错误响应:', err.response)
      console.error('错误信息:', err.message)
      
      // 处理 "not blocked" 错误 - 用户已经不是拉黑状态
      if (err.response?.data?.error === 'not blocked') {
        console.log('用户已经不是拉黑状态，标记为已取消')
        // 本地标记用户为已取消
        blockedUsers.value = blockedUsers.value.map(user => {
          const userIdToCheck = user.id || user.user?.id
          if (String(userIdToCheck) === stringUserId) {
            return {
              ...user,
              is_blocked: false,
              unblocked_at: new Date().toISOString()
            }
          }
          return user
        })
        ElMessage.success('用户已取消拉黑')
      } else {
        ElMessage.error(err.response?.data?.error || '取消拉黑失败')
      }
    } finally {
      console.log('取消拉黑操作完成，设置isLoading为false')
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
    console.log('取消操作')
  })
}

// 重新拉黑用户
const reblockUser = (userId: string | number, userName: string) => {
  console.log('reblockUser 被调用:', { userId, userName })

  // 确保 userId 是字符串类型，避免大数字精度问题
  const stringUserId = String(userId)

  if (!stringUserId) {
    console.error('userId 为空，无法重新拉黑')
    ElMessage.error('用户ID无效')
    return
  }

  console.log('处理后的 userId:', stringUserId)

  ElMessageBox.confirm(`确定要重新拉黑用户 "${userName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true

      console.log('开始重新拉黑用户:', stringUserId)
      await blockApi.blockUser(stringUserId)

      ElMessage.success('重新拉黑成功')

      // 重新获取拉黑列表
      console.log('重新获取拉黑列表...')
      await fetchBlockedUsers()
    } catch (err: any) {
      console.error('重新拉黑错误:', err)
      console.error('错误响应:', err.response)

      ElMessage.error(err.response?.data?.error || '重新拉黑失败')
    } finally {
      console.log('重新拉黑操作完成，设置isLoading为false')
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
    console.log('取消重新拉黑操作')
  })
}

// 查看用户资料
const viewUserProfile = (userId: string | number) => {
  // 确保 userId 是字符串类型，避免大数字精度问题
  const stringUserId = String(userId)
  // 跳转到用户资料页面
  router.push(`/user/${stringUserId}`)
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchBlockedUsers()
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知时间'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取用户显示名
const getUserName = (user: any) => {
  if (user.nickname) return user.nickname
  if (user.email) return user.email.split('@')[0]
  return '未知用户'
}

// 检查用户是否已被取消拉黑
const isUserUnblocked = (user: any) => {
  // 后端现在只查询 unblocked_at 字段
  // 如果 unblocked_at 有值，表示已取消拉黑
  return user.unblocked_at !== null && user.unblocked_at !== undefined
}

// 获取用户状态文本
const getUserStatusText = (user: any) => {
  if (isUserUnblocked(user)) {
    return '已释放'
  }
  return '已拉黑'
}

// 获取拉黑时间或取消时间
const getBlockTime = (user: any) => {
  if (isUserUnblocked(user)) {
    return formatDate(user.unblocked_at)
  }
  return formatDate(user.created_at || user.blocked_at)
}
</script>

<template>
  <div class="blocked-users-container">
    <h1>黑名单管理</h1>
    
    <!-- 错误提示 -->
    <el-alert 
      v-if="error" 
      :title="error" 
      type="error" 
      show-icon 
      closable 
      style="margin-bottom: 1rem" 
    />
    
    <!-- 黑名单列表 -->
    <el-table
      v-loading="isLoading"
      :data="blockedUsers"
      style="width: 100%"
      stripe
    >
      <el-table-column prop="id" label="用户ID" width="180">
        <template #default="{ row }">
          {{ row.id || row.user?.id }}
        </template>
      </el-table-column>
      
      <el-table-column label="用户" min-width="200">
        <template #default="{ row }">
          <div class="user-info">
            <img 
              v-if="(row.avatar || row.user?.avatar)" 
              :src="row.avatar || row.user?.avatar" 
              :alt="getUserName(row.user || row)" 
              class="user-avatar"
            />
            <span>{{ getUserName(row.user || row) }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag 
            :type="isUserUnblocked(row) ? 'info' : 'danger'"
            size="small"
          >
            {{ getUserStatusText(row) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ getBlockTime(row) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            @click="viewUserProfile(row.id || row.user?.id)"
          >
            查看资料
          </el-button>
          <el-button 
            v-if="!isUserUnblocked(row)"
            type="success" 
            size="small" 
            @click="unblockUser(row.id || row.user?.id, getUserName(row.user || row))"
          >
            取消拉黑
          </el-button>
          <el-button 
            v-else
            type="warning" 
            size="small" 
            @click="reblockUser(row.id || row.user?.id, getUserName(row.user || row))"
          >
            重新拉黑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 空状态 -->
    <div v-if="blockedUsers.length === 0 && !isLoading" class="empty-blocked">
      <el-empty description="暂无拉黑记录" />
    </div>
    
    <!-- 分页 -->
    <div v-if="total > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.blocked-users-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
  min-height: 100vh;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
  color: #333;
}

h1 {
  color: #333;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
}

.empty-blocked {
  text-align: center;
  padding: 4rem 0;
}

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .blocked-users-container {
    padding: 0 1rem;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
