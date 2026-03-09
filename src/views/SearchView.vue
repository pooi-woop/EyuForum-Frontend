<template>
  <div class="search-container">
    <div class="search-header">
      <h1>搜索结果</h1>
      <p class="search-keyword">关键词: "{{ route.query.keyword }}"</p>
    </div>

    <div v-if="isLoading" class="loading-container">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
    </div>

    <div v-else-if="error" class="error-container">
      <el-alert :title="error" type="error" show-icon />
    </div>

    <div v-else class="search-results">
      <!-- 帖子搜索结果 -->
      <div v-if="posts.length > 0" class="result-section">
        <h2 class="section-title">帖子 ({{ total.posts }})</h2>
        <div class="posts-list">
          <div v-for="post in posts" :key="post.id" class="post-item" @click="goToPostDetail(post.id)">
            <div class="post-header">
              <el-avatar :src="post.user?.avatar" :size="32" class="author-avatar">
                {{ post.user?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="author-name">{{ post.user?.nickname }}</span>
              <span class="post-time">{{ formatDate(post.created_at) }}</span>
            </div>
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-content">{{ post.content }}</p>
            <div class="post-stats">
              <span><el-icon><View /></el-icon> {{ post.views }}</span>
              <span><el-icon><Star /></el-icon> {{ post.like_count }}</span>
              <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户搜索结果 -->
      <div v-if="users.length > 0" class="result-section">
        <h2 class="section-title">用户 ({{ total.users }})</h2>
        <div class="users-list">
          <div v-for="user in users" :key="user.id" class="user-item" @click="goToUserProfile(user.id)">
            <el-avatar :src="user.avatar" :size="60" class="user-avatar">
              {{ user.nickname?.charAt(0) }}
            </el-avatar>
            <div class="user-info">
              <h4 class="user-name">{{ user.nickname }}</h4>
              <p class="user-bio">{{ user.bio || '暂无简介' }}</p>
              <div class="user-meta">
                <el-tag v-if="user.is_admin" type="success" size="small">管理员</el-tag>
                <el-tag v-if="user.is_verified" type="primary" size="small">已认证</el-tag>
                <el-tag :type="user.status === 1 ? 'success' : 'danger'" size="small">
                  {{ user.status === 1 ? '正常' : '禁言' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无结果 -->
      <div v-if="posts.length === 0 && users.length === 0" class="no-results">
        <el-empty description="没有找到相关结果" />
      </div>

      <!-- 分页 -->
      <div v-if="posts.length > 0 || users.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total.posts + total.users"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchApi } from '@/services/userApi'
import { Loading, View, Star, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const posts = ref<any[]>([])
const users = ref<any[]>([])
const total = ref({ posts: 0, users: 0 })
const currentPage = ref(1)
const pageSize = ref(10)
const isLoading = ref(false)
const error = ref('')

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

const performSearch = async () => {
  const keyword = route.query.keyword as string
  if (!keyword || !keyword.trim()) {
    error.value = '搜索关键词不能为空'
    return
  }

  try {
    isLoading.value = true
    error.value = ''

    const response = await searchApi.search({
      keyword: keyword.trim(),
      page: currentPage.value,
      page_size: pageSize.value
    })

    posts.value = response.posts || []
    users.value = response.users || []
    total.value = response.total || { posts: 0, users: 0 }
  } catch (err: any) {
    console.error('搜索错误:', err)
    error.value = err.response?.error || '搜索失败'
  } finally {
    isLoading.value = false
  }
}

const goToPostDetail = (postId: string) => {
  router.push(`/forum/${postId}`)
}

const goToUserProfile = (userId: string) => {
  router.push(`/user/${userId}`)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  performSearch()
}

watch(() => route.query.keyword, () => {
  currentPage.value = 1
  performSearch()
})

onMounted(() => {
  performSearch()
})
</script>

<style scoped>
.search-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 60px;
}

.search-header {
  margin-bottom: 2rem;
}

.search-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.search-keyword {
  font-size: 1.1rem;
  color: #666;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
}

.error-container {
  margin-bottom: 2rem;
}

.search-results {
  min-height: 400px;
}

.result-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-item {
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.author-avatar {
  flex-shrink: 0;
}

.author-name {
  font-weight: 500;
  color: #333;
}

.post-time {
  margin-left: auto;
  font-size: 0.875rem;
  color: #999;
}

.post-title {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.post-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-stats {
  display: flex;
  gap: 1.5rem;
  color: #999;
  font-size: 0.875rem;
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.user-item {
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.user-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.user-bio {
  color: #666;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.no-results {
  padding: 4rem 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .search-container {
    padding: 1rem;
  }

  .users-list {
    grid-template-columns: 1fr;
  }

  .post-item,
  .user-item {
    padding: 1rem;
  }
}
</style>
