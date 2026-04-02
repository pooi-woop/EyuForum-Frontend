<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, postApi, commentApi, adminApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 状态管理
const users = ref<any[]>([])
const posts = ref<any[]>([])
const comments = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')
const activeTab = ref('users')
const searchKeyword = ref('')

// 页面加载时检查登录状态和管理员权限
onMounted(async () => {
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    return
  }
  
  // 确保用户信息已加载
  if (!userStore.user) {
    await userStore.init()
  }
  
  // 检查是否为管理员
  if (!userStore.user?.is_admin) {
    error.value = '无管理员权限'
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
    return
  }
  
  // 加载用户列表
  await fetchUsers()
})

// 获取用户列表
const fetchUsers = async () => {
  console.log('fetchUsers 被调用，当前页:', currentPage.value)
  try {
    isLoading.value = true
    error.value = ''
    
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    // 如果有搜索关键词，添加到参数中
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    
    console.log('准备调用 adminApi.getUsers，参数:', params)
    const response = await adminApi.getUsers(params)
    console.log('adminApi.getUsers 响应:', response)
    
    users.value = response.users || response.data || response || []
    total.value = response.total || 0
  } catch (err: any) {
    console.error('获取用户列表错误:', err)
    error.value = err.response?.error || '获取用户列表失败'
  } finally {
    isLoading.value = false
  }
}

// 处理用户搜索
const handleUserSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

// 获取帖子列表
const fetchPosts = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    // 如果有搜索关键词，使用搜索接口
    if (searchKeyword.value.trim()) {
      const searchParams = {
        ...params,
        keyword: searchKeyword.value.trim()
      }
      const response = await postApi.searchPosts(searchParams)
      posts.value = response.posts || response || []
      total.value = response.total || 0
    } else {
      // 否则获取所有帖子
      const response = await postApi.getPosts(params)
      posts.value = response.posts || response || []
      total.value = response.total || 0
    }
  } catch (err: any) {
    console.error('获取帖子列表错误:', err)
    error.value = err.response?.error || '获取帖子列表失败'
  } finally {
    isLoading.value = false
  }
}

// 处理帖子搜索
const handlePostSearch = () => {
  currentPage.value = 1
  fetchPosts()
}

// 获取评论列表
const fetchComments = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    // 如果有搜索关键词，添加到参数中
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    
    // 使用新的评论搜索API
    const response = await commentApi.getComments('', params)
    
    comments.value = response.comments || response.data || response || []
    total.value = response.total || 0
  } catch (err: any) {
    console.error('获取评论列表错误:', err)
    error.value = err.response?.error || '获取评论列表失败'
  } finally {
    isLoading.value = false
  }
}

// 处理评论搜索
const handleCommentSearch = () => {
  currentPage.value = 1
  fetchComments()
}

// 处理标签切换
const handleTabChange = async (tabName: string) => {
  activeTab.value = tabName
  currentPage.value = 1
  
  if (tabName === 'users') {
    await fetchUsers()
  } else if (tabName === 'posts') {
    await fetchPosts()
  } else if (tabName === 'comments') {
    await fetchComments()
  }
}

// 处理分页
const handlePageChange = async (page: number) => {
  currentPage.value = page
  
  if (activeTab.value === 'users') {
    await fetchUsers()
  } else if (activeTab.value === 'posts') {
    await fetchPosts()
  } else if (activeTab.value === 'comments') {
    await fetchComments()
  }
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

// 查看用户资料
const viewUserProfile = (userId: string) => {
  // 这里可以跳转到用户资料页面
  ElMessage.info('用户资料页面开发中')
}

// 禁言用户
const banUser = (userId: string, userName: string) => {
  ElMessageBox.confirm(`确定要禁言用户 "${userName}" 吗？`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    title: '警告'
  }).then(async () => {
    try {
      isLoading.value = true
      await adminApi.banUser(userId)
      ElMessage.success('用户禁言成功')
      await fetchUsers()
    } catch (err: any) {
      console.error('禁言用户错误:', err)
      ElMessage.error(err.response?.error || '禁言用户失败')
    } finally {
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 解除禁言
const unbanUser = (userId: string, userName: string) => {
  ElMessageBox.confirm(`确定要解除禁言用户 "${userName}" 吗？`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
    title: '确认'
  }).then(async () => {
    try {
      isLoading.value = true
      await adminApi.unbanUser(userId)
      ElMessage.success('解除禁言成功')
      await fetchUsers()
    } catch (err: any) {
      console.error('解除禁言错误:', err)
      ElMessage.error(err.response?.error || '解除禁言失败')
    } finally {
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 删除帖子
const deletePost = (postId: string, postTitle: string) => {
  const stringPostId = String(postId)
  ElMessageBox.confirm(`确定要删除帖子 "${postTitle}" 吗？此操作不可撤销！`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      await adminApi.deletePost(stringPostId)
      ElMessage.success('帖子删除成功')
      await fetchPosts()
    } catch (err: any) {
      console.error('删除帖子错误:', err)
      ElMessage.error(err.response?.error || '删除帖子失败')
    } finally {
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 删除评论
const deleteComment = (commentId: string) => {
  const stringCommentId = String(commentId)
  ElMessageBox.confirm('确定要删除这条评论吗？此操作不可撤销！', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      await adminApi.deleteComment(stringCommentId)
      ElMessage.success('评论删除成功')
      await fetchComments()
    } catch (err: any) {
      console.error('删除评论错误:', err)
      ElMessage.error(err.response?.error || '删除评论失败')
    } finally {
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 查看帖子详情
const viewPostDetail = (postId: string) => {
  const stringPostId = String(postId)
  router.push(`/forum/${stringPostId}`)
}
</script>

<template>
  <div class="admin-container">
    <h1>管理员后台</h1>
    
    <!-- 错误提示 -->
    <el-alert 
      v-if="error" 
      :title="error" 
      type="error" 
      show-icon 
      closable 
      style="margin-bottom: 1rem" 
    />
    
    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="(tab: any) => handleTabChange(tab.paneName)">
      <el-tab-pane label="用户管理" name="users">
        <!-- 搜索框 -->
        <div class="search-container" style="margin-bottom: 1rem">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户..."
            clearable
            @keyup.enter="handleUserSearch"
            style="width: 300px"
          >
            <template #append>
              <el-button @click="handleUserSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <!-- 用户列表 -->
        <el-table
          v-loading="isLoading"
          :data="users"
          style="width: 100%"
          stripe
        >
          <el-table-column prop="id" label="用户ID" width="180" />
          <el-table-column label="用户" min-width="200">
            <template #default="{ row }">
              <div class="user-info">
                <img 
                  v-if="row.avatar" 
                  :src="row.avatar" 
                  :alt="getUserName(row)" 
                  class="user-avatar"
                />
                <span>{{ getUserName(row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="is_admin" label="管理员" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.is_admin" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="viewUserProfile(row.id)"
              >
                查看
              </el-button>
              <el-button 
                v-if="row.status === 1"
                type="warning" 
                size="small" 
                @click="banUser(row.id, getUserName(row))"
              >
                禁言
              </el-button>
              <el-button 
                v-else
                type="success" 
                size="small" 
                @click="unbanUser(row.id, getUserName(row))"
              >
                解除禁言
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="帖子管理" name="posts">
        <!-- 搜索框 -->
        <div class="search-container" style="margin-bottom: 1rem">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索帖子标题或内容..."
            clearable
            @keyup.enter="handlePostSearch"
            style="width: 300px"
          >
            <template #append>
              <el-button @click="handlePostSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <!-- 帖子列表 -->
        <el-table
          v-loading="isLoading"
          :data="posts"
          style="width: 100%"
          stripe
        >
          <el-table-column prop="id" label="帖子ID" width="180" />
          <el-table-column prop="title" label="标题" min-width="300">
            <template #default="{ row }">
              <el-link type="primary" @click="viewPostDetail(row.id)">
                {{ row.title || '无标题' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="作者" width="150">
            <template #default="{ row }">
              <div class="author-info">
                <el-avatar 
                  :src="row.user?.avatar" 
                  :size="24"
                  class="author-avatar"
                >
                  {{ getUserName(row.user || {}).charAt(0) }}
                </el-avatar>
                <span class="author-name">{{ getUserName(row.user || {}) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="views" label="浏览" width="80" align="center" />
          <el-table-column prop="created_at" label="发布时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="deletePost(row.id, row.title)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="评论管理" name="comments">
        <!-- 搜索框 -->
        <div class="search-container" style="margin-bottom: 1rem">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索评论内容..."
            clearable
            @keyup.enter="handleCommentSearch"
            style="width: 300px"
          >
            <template #append>
              <el-button @click="handleCommentSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <!-- 评论列表 -->
        <el-table
          v-loading="isLoading"
          :data="comments"
          style="width: 100%"
          stripe
        >
          <el-table-column prop="id" label="评论ID" width="180" />
          <el-table-column prop="content" label="内容" min-width="400" />
          <el-table-column label="作者" width="150">
            <template #default="{ row }">
              <div class="author-info">
                <el-avatar 
                  :src="row.user?.avatar" 
                  :size="24"
                  class="author-avatar"
                >
                  {{ getUserName(row.user || {}).charAt(0) }}
                </el-avatar>
                <span class="author-name">{{ getUserName(row.user || {}) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="发布时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteComment(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 空状态 -->
    <div 
      v-if="(
        (activeTab === 'users' && users.length === 0) ||
        (activeTab === 'posts' && posts.length === 0) ||
        (activeTab === 'comments' && comments.length === 0)
      ) && !isLoading" 
      class="empty-state"
    >
      <el-empty description="暂无数据" />
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
.admin-container {
  max-width: 1200px;
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

.empty-state {
  text-align: center;
  padding: 4rem 0;
  margin-top: 2rem;
}

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

/* 作者信息样式 */
.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  flex-shrink: 0;
}

.author-name {
  font-size: 0.9rem;
  color: #606266;
}

@media (max-width: 768px) {
  .admin-container {
    padding: 0 1rem;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
