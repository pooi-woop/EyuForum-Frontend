<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { postApi } from '../services/userApi'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const posts = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')
const searchKeyword = ref('')

const fetchPosts = async () => {
  console.log('fetchPosts 被调用')
  try {
    isLoading.value = true
    error.value = ''
    
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    console.log('开始获取帖子列表...', params)
    
    const response = await postApi.getPosts(params)
    console.log('获取帖子列表响应:', response)
    // 后端返回格式: { posts: [...], total: ... }
    posts.value = response.posts || response || []
    total.value = response.total || 0
  } catch (err: any) {
    console.error('获取帖子列表错误:', err)
    error.value = err.response?.error || '获取帖子列表失败'
  } finally {
    isLoading.value = false
  }
}

// 搜索帖子
const searchPosts = async () => {
  if (!searchKeyword.value.trim()) {
    return fetchPosts()
  }
  
  console.log('searchPosts 被调用，关键词:', searchKeyword.value.trim())
  try {
    isLoading.value = true
    error.value = ''
    
    const params = {
      keyword: searchKeyword.value.trim(),
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    console.log('开始搜索帖子...', params)
    
    const response = await postApi.searchPosts(params)
    console.log('搜索帖子响应:', response)
    // 后端返回格式: { posts: [...], total: ..., keyword: ... }
    posts.value = response.posts || response || []
    total.value = response.total || 0
  } catch (err: any) {
    console.error('搜索帖子错误:', err)
    error.value = err.response?.error || '搜索帖子失败'
  } finally {
    isLoading.value = false
  }
}

const goToPostDetail = (postId: string | number) => {
  console.log('点击帖子，ID:', postId)
  const stringPostId = String(postId)
  if (!stringPostId) {
    error.value = '帖子ID无效'
    return
  }
  router.push(`/forum/${stringPostId}`)
}

// 删除帖子
const deletePost = (postId: string | number) => {
  const stringPostId = String(postId)
  ElMessageBox.confirm('确定要删除这个帖子吗？此操作不可撤销！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      await postApi.deletePost(stringPostId)
      ElMessage.success('帖子删除成功')
      // 重新获取帖子列表
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

const handlePageChange = () => {
  fetchPosts()
}

// 处理搜索
const handleSearch = async () => {
  if (searchKeyword.value.trim()) {
    console.log('执行搜索:', searchKeyword.value.trim())
    currentPage.value = 1 // 重置到第一页
    // 只搜索帖子
    await searchPosts()
  } else {
    console.log('清空搜索，获取所有帖子')
    searchKeyword.value = ''
    currentPage.value = 1
    fetchPosts()
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

// 获取作者显示名
const getAuthorName = (post: any) => {
  if (post.user?.nickname) return post.user.nickname
  if (post.user?.email) return post.user.email.split('@')[0]
  return '匿名用户'
}

// 监听路由查询参数变化
watch(() => route.query.search, (newSearch) => {
  console.log('搜索参数变化:', newSearch)
  if (newSearch !== undefined) {
    searchKeyword.value = newSearch as string
    currentPage.value = 1 // 重置到第一页
    fetchPosts()
  }
}, { immediate: true })

onMounted(() => {
  // 如果没有搜索参数，获取所有帖子
  if (!route.query.search) {
    fetchPosts()
  }
})
</script>

<template>
  <div class="forum-container">
    <div class="forum-header">
      <h1>论坛</h1>
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索帖子..."
          clearable
          @keyup.enter="handleSearch"
          class="search-input"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
      </div>
      <el-button type="primary" @click="router.push('/forum/create')">
        发布帖子
      </el-button>
    </div>

    <!-- 帖子列表 -->
    <h2 v-if="searchKeyword.trim()" class="section-title">相关帖子</h2>
    <el-table
      v-loading="isLoading"
      :data="posts"
      style="width: 100%"
      stripe
    >
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <div class="post-title-container">
            <el-link type="primary" @click="goToPostDetail(row.id)">
              {{ row.title || '无标题' }}
            </el-link>
            <el-button 
              type="danger" 
              size="small" 
              circle 
              class="delete-button"
              @click.stop="deletePost(row.id)"
            >
              <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5 0v3.75a.75.75 0 101.5 0V8.971zm5.48.056a.75.75 0 10-1.5 0v3.75a.75.75 0 101.5 0V8.971z" clip-rule="evenodd" /></svg></el-icon>
            </el-button>
          </div>
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
              {{ getAuthorName(row).charAt(0) }}
            </el-avatar>
            <span class="author-name">{{ getAuthorName(row) }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="发布时间" width="150">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="views" label="浏览" width="80" align="center" />
      
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="goToPostDetail(row.id)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty v-if="posts.length === 0 && !isLoading" description="暂无帖子" />

    <!-- 错误提示 -->
    <el-alert v-if="error" :title="error" type="error" show-icon closable style="margin-top: 1rem" />

    <!-- 分页 - 固定在底部 -->
    <div v-if="total > 0" class="pagination-fixed">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next"
        :total="total"
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>
    
    <!-- 底部占位，防止内容被分页遮挡 -->
    <div v-if="total > 0" class="pagination-placeholder"></div>
  </div>
</template>

<style scoped>
.forum-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 2rem;
  box-sizing: border-box;
}

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
  gap: 1rem;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.forum-header h1 {
  color: #333;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.pagination-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.pagination-placeholder {
  height: 60px;
}

/* 帖子标题容器 */
.post-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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

/* 删除按钮样式 */
.delete-button {
  flex-shrink: 0;
  margin-left: 1rem;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.delete-button:hover {
  opacity: 1;
}

.section-title {
  color: #333;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  padding-left: 1rem;
  border-left: 4px solid #409eff;
}

@media (max-width: 768px) {
  .forum-container {
    padding: 1rem;
  }

  .forum-header {
    flex-direction: column;
    gap: 1rem;
    padding: 0;
  }
}
</style>
