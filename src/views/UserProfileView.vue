<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi, postApi } from '../services/userApi'
import { ElMessage, ElAvatar } from 'element-plus'
import { Calendar, Timer, CircleCheck, View, Star, ChatDotRound, Clock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 用户ID
const userId = computed(() => route.params.id as string)

// 状态管理
const user = ref<any>(null)
const posts = ref<any[]>([])
const isLoading = ref(false)
const isPostsLoading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPosts = ref(0)

// 获取用户信息
const fetchUserInfo = async () => {
  if (!userId.value) {
    error.value = '用户ID无效'
    return
  }

  try {
    isLoading.value = true
    error.value = ''

    console.log('开始获取用户信息，userId:', userId.value)
    const response = await userApi.getUserProfile(userId.value)
    console.log('获取用户信息响应:', response)

    user.value = response.user || response
    console.log('解析后的用户信息:', user.value)
  } catch (err: any) {
    console.error('获取用户信息错误:', err)
    console.error('错误详情:', err.response)

    if (err.response?.status === 404) {
      error.value = '用户不存在'
    } else if (err.response?.status === 400) {
      error.value = '用户ID格式错误'
    } else {
      error.value = err.response?.data?.error || '获取用户信息失败'
    }
  } finally {
    isLoading.value = false
  }
}

// 获取用户帖子列表
const fetchUserPosts = async () => {
  if (!userId.value) return

  try {
    isPostsLoading.value = true

    console.log('开始获取用户帖子，userId:', userId.value)

    // 使用获取所有帖子接口，然后在前端过滤该用户的帖子
    const response = await postApi.getPosts({
      page: currentPage.value,
      page_size: pageSize.value
    })

    console.log('获取帖子响应:', response)

    // 过滤出该用户的帖子
    const allPosts = response.posts || response.data || []
    posts.value = allPosts.filter((post: any) => String(post.user_id) === userId.value)
    totalPosts.value = posts.value.length

    console.log('解析后的帖子列表:', posts.value)
  } catch (err: any) {
    console.error('获取用户帖子错误:', err)
    ElMessage.error(err.response?.data?.error || '获取帖子失败')
  } finally {
    isPostsLoading.value = false
  }
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUserPosts()
}

// 跳转到帖子详情
const goToPostDetail = (postId: string) => {
  router.push(`/forum/${postId}`)
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

// 获取用户头像显示文字
const getAvatarText = (user: any) => {
  if (!user) return '匿'
  return (user.nickname || user.email?.split('@')[0] || '匿').charAt(0)
}

// 页面加载时获取数据
onMounted(() => {
  console.log('UserProfileView onMounted 被调用，userId:', userId.value)
  fetchUserInfo()
  fetchUserPosts()
})
</script>

<template>
  <div class="user-profile-container">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-empty :description="error" />
      <el-button type="primary" @click="router.push('/forum')">
        返回论坛
      </el-button>
    </div>

    <!-- 用户主页内容 -->
    <div v-else-if="user" class="profile-content">
      <!-- 用户基本信息卡片 -->
      <el-card class="user-info-card">
        <div class="user-header">
          <el-avatar
            :src="user.avatar"
            :size="100"
            class="user-avatar"
          >
            {{ getAvatarText(user) }}
          </el-avatar>

          <div class="user-details">
            <h1 class="user-nickname">
              {{ user.nickname || user.email?.split('@')[0] || '匿名用户' }}
            </h1>
            <p class="user-email">{{ user.email }}</p>
            <p v-if="user.bio" class="user-bio">{{ user.bio }}</p>

            <div class="user-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                注册于 {{ formatDate(user.created_at) }}
              </span>
              <span v-if="user.last_login_at" class="meta-item">
                <el-icon><Timer /></el-icon>
                最后登录 {{ formatDate(user.last_login_at) }}
              </span>
              <span v-if="user.is_verified" class="meta-item verified">
                <el-icon><CircleCheck /></el-icon>
                已验证
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 用户帖子列表 -->
      <el-card class="user-posts-card">
        <template #header>
          <div class="posts-header">
            <h2>TA的帖子</h2>
            <span class="posts-count">共 {{ totalPosts }} 篇</span>
          </div>
        </template>

        <div v-if="isPostsLoading" class="posts-loading">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="posts.length === 0" class="empty-posts">
          <el-empty description="该用户还没有发布帖子" />
        </div>

        <div v-else class="posts-list">
          <div
            v-for="post in posts"
            :key="post.id"
            class="post-item"
            @click="goToPostDetail(post.id)"
          >
            <h3 class="post-title">{{ post.title || '无标题' }}</h3>
            <p class="post-content">{{ post.content?.substring(0, 200) }}...</p>
            <div class="post-meta">
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ post.views || 0 }} 浏览
              </span>
              <span class="meta-item">
                <el-icon><Star /></el-icon>
                {{ post.like_count || 0 }} 点赞
              </span>
              <span class="meta-item">
                <el-icon><ChatDotRound /></el-icon>
                {{ post.comment_count || 0 }} 评论
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatDate(post.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPosts > pageSize" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalPosts"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.user-profile-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
}

.error-state .el-button {
  margin-top: 1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-info-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 1rem;
}

.user-avatar {
  flex-shrink: 0;
  border: 3px solid #e0e0e0;
}

.user-details {
  flex: 1;
}

.user-nickname {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.user-email {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1rem 0;
}

.user-bio {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #666;
}

.meta-item.verified {
  color: #67c23a;
}

.user-posts-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.posts-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.posts-count {
  font-size: 0.9rem;
  color: #666;
}

.posts-loading {
  padding: 2rem;
}

.empty-posts {
  padding: 3rem 0;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.post-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.post-content {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile-container {
    padding: 0 1rem;
  }

  .user-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-meta {
    justify-content: center;
  }

  .post-meta {
    font-size: 0.8rem;
  }
}
</style>
