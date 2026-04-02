<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 状态管理
const posts = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')

// 页面加载时检查登录状态
onMounted(async () => {
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录后再查看我的帖子'
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else {
    await fetchMyPosts()
  }
})

// 获取我的帖子
const fetchMyPosts = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const response = await postApi.getMyPosts({
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    posts.value = response.posts || response.data || []
    total.value = response.total || 0
  } catch (err: any) {
    console.error('获取我的帖子错误:', err)
    error.value = err.response?.error || '获取帖子失败'
  } finally {
    isLoading.value = false
  }
}

// 删除帖子
const deletePost = (postId: string | number, postTitle: string) => {
  const stringPostId = String(postId)
  ElMessageBox.confirm(`确定要删除帖子 "${postTitle}" 吗？此操作不可撤销！`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      await postApi.deletePost(stringPostId)
      ElMessage.success('帖子删除成功')
      // 重新获取帖子列表
      await fetchMyPosts()
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

// 跳转到帖子详情
const goToPostDetail = (postId: string | number) => {
  const stringPostId = String(postId)
  router.push(`/forum/${stringPostId}`)
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchMyPosts()
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
</script>

<template>
  <div class="my-posts-container">
    <h1>我的帖子</h1>
    
    <!-- 错误提示 -->
    <el-alert 
      v-if="error" 
      :title="error" 
      type="error" 
      show-icon 
      closable 
      style="margin-bottom: 1rem" 
    />
    
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
          <div class="post-title-container">
            <el-link type="primary" @click="goToPostDetail(row.id)">
              {{ row.title || '无标题' }}
            </el-link>
            <el-button 
              type="danger" 
              size="small" 
              circle 
              class="delete-button"
              @click.stop="deletePost(row.id, row.title)"
            >
              <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5 0v3.75a.75.75 0 101.5 0V8.971zm5.48.056a.75.75 0 10-1.5 0v3.75a.75.75 0 101.5 0V8.971z" clip-rule="evenodd" /></svg></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="views" label="浏览" width="80" align="center" />
      <el-table-column prop="comment_count" label="评论" width="80" align="center" />
      <el-table-column prop="like_count" label="点赞" width="80" align="center" />
      <el-table-column prop="created_at" label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            @click="goToPostDetail(row.id)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 空状态 -->
    <div v-if="posts.length === 0 && !isLoading" class="empty-posts">
      <el-empty description="暂无帖子" />
      <el-button type="primary" @click="router.push('/forum/create')" style="margin-top: 1rem;">
        发布帖子
      </el-button>
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
.my-posts-container {
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

/* 帖子标题容器 */
.post-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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

.empty-posts {
  text-align: center;
  padding: 4rem 0;
}

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .my-posts-container {
    padding: 0 1rem;
  }
  
  .post-title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .delete-button {
    margin-left: 0;
  }
}
</style>
