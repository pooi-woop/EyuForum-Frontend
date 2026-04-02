<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inboxApi, commentApi, userApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 计算属性获取用户信息
const currentUser = computed(() => userStore.user)
const currentUserId = computed(() => userStore.user?.id)

interface Message {
  post_id: string
  comment_id?: string
  sender_id: string
  type: 'reply_post' | 'reply_comment'
  time: number
  sender?: any
  post?: any
}

const messages = ref<Message[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')

const replyDialogVisible = ref(false)
const replyContent = ref('')
const currentMessage = ref<Message | null>(null)
const isSubmitting = ref(false)

onMounted(async () => {
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录后再查看信箱'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else {
    // 直接调用API获取用户信息，确保能获取到最新的用户信息
    try {
      console.log('Calling userApi.getUserInfo()...')
      const userResponse = await userApi.getUserInfo()
      console.log('User info response:', userResponse)
      console.log('User ID:', userResponse.user?.id || userResponse.id)
    } catch (err) {
      console.error('获取用户信息错误:', err)
    }
    await fetchMessages()
  }
})

const fetchMessages = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('当前登录用户ID:', currentUserId.value)
    console.log('请求收信箱参数:', { page: currentPage.value, page_size: pageSize.value })
    
    const response = await inboxApi.getMessages({
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    console.log('收信箱响应:', response)
    
    if (response) {
      if (response.messages && Array.isArray(response.messages)) {
        messages.value = response.messages
        total.value = response.total || response.messages.length
        
        // 并行获取所有发送者信息
        await Promise.all(
          messages.value.map(async (msg) => {
            if (msg.sender_id) {
              try {
                const userResponse = await userApi.getUserProfile(msg.sender_id)
                msg.sender = userResponse.user || userResponse
              } catch (err) {
                console.error('获取发送者信息失败:', err)
              }
            }
          })
        )
      } else if (Array.isArray(response)) {
        messages.value = response
        total.value = response.length
      } else {
        messages.value = []
        total.value = response.total || 0
      }
    } else {
      messages.value = []
      total.value = 0
    }
  } catch (err: any) {
    console.error('获取信箱消息错误:', err)
    if (err.response?.status && err.response?.status !== 200) {
      error.value = err.response?.data?.error || err.response?.error || '获取信箱消息失败'
    }
    messages.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

const clearInbox = () => {
  ElMessageBox.confirm('确定要清空信箱吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      await inboxApi.clearInbox()
      ElMessage.success('信箱已清空')
      messages.value = []
      total.value = 0
    } catch (err: any) {
      console.error('清空信箱错误:', err)
      ElMessage.error(err.response?.data?.error || '清空信箱失败')
    } finally {
      isLoading.value = false
    }
  }).catch(() => {})
}

const viewPost = (message: Message) => {
  router.push(`/forum/${message.post_id}`)
}

const openReplyDialog = (message: Message) => {
  currentMessage.value = message
  replyContent.value = ''
  replyDialogVisible.value = true
}

const submitReply = async () => {
  if (!currentMessage.value || !replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  try {
    isSubmitting.value = true
    
    if (currentMessage.value.type === 'reply_post') {
      await commentApi.createComment({
        post_id: currentMessage.value.post_id,
        content: replyContent.value.trim()
      })
    } else if (currentMessage.value.type === 'reply_comment' && currentMessage.value.comment_id) {
      await commentApi.createReply({
        comment_id: currentMessage.value.comment_id,
        content: replyContent.value.trim()
      })
    }
    
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    replyContent.value = ''
    currentMessage.value = null
  } catch (err: any) {
    console.error('回复错误:', err)
    ElMessage.error(err.response?.data?.error || '回复失败')
  } finally {
    isSubmitting.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchMessages()
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '未知时间'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getMessageTypeText = (type: string) => {
  return type === 'reply_post' ? '回复了你的帖子' : '回复了你的评论'
}

const getSenderName = (message: Message) => {
  if (message.sender?.nickname) return message.sender.nickname
  if (message.sender?.email) return message.sender.email.split('@')[0]
  return `用户 ${message.sender_id}`
}
</script>

<template>
  <div class="inbox-container">
    <div class="inbox-header">
      <h1>信箱</h1>
      <el-button 
        type="danger" 
        :icon="'Delete'" 
        @click="clearInbox"
        :disabled="messages.length === 0"
        circle
        title="清空信箱"
      />
    </div>
    
    <el-alert 
      v-if="error" 
      :title="error" 
      type="error" 
      show-icon 
      closable 
      style="margin-bottom: 1rem" 
    />
    
    <el-table
      v-loading="isLoading"
      :data="messages"
      style="width: 100%"
      stripe
      @row-click="viewPost"
      class="message-table"
    >
      <el-table-column label="发送者" min-width="150">
        <template #default="{ row }">
          <div class="sender-info">
            <img 
              v-if="row.sender?.avatar" 
              :src="row.sender.avatar" 
              :alt="getSenderName(row)" 
              class="sender-avatar"
            />
            <div class="sender-avatar sender-avatar-default" v-else>
              {{ getSenderName(row).charAt(0).toUpperCase() }}
            </div>
            <span class="sender-name">{{ getSenderName(row) }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="消息类型" width="180" align="center">
        <template #default="{ row }">
          <el-tag 
            :type="row.type === 'reply_post' ? 'primary' : 'success'"
            size="small"
          >
            {{ getMessageTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.time) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            @click.stop="viewPost(row)"
          >
            查看
          </el-button>
          <el-button 
            type="success" 
            size="small" 
            @click.stop="openReplyDialog(row)"
          >
            回复
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div v-if="messages.length === 0 && !isLoading" class="empty-inbox">
      <el-empty description="暂无消息" />
    </div>
    
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
    
    <el-dialog 
      v-model="replyDialogVisible" 
      title="回复消息" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="replyContent"
        type="textarea"
        :rows="4"
        placeholder="请输入回复内容"
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitReply"
          :loading="isSubmitting"
          :disabled="!replyContent.trim()"
        >
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.inbox-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
  min-height: 100vh;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
  color: #333;
}

.inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.inbox-header h1 {
  color: #333;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.message-table {
  cursor: pointer;
}

.message-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
}

.sender-avatar-default {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409eff;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.sender-name {
  font-weight: 500;
}

.empty-inbox {
  text-align: center;
  padding: 4rem 0;
}

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .inbox-container {
    padding: 0 1rem;
  }
  
  .inbox-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .sender-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
