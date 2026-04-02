<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'

const router = useRouter()

const postForm = ref({
  title: '',
  content: ''
})

const isLoading = ref(false)
const error = ref('')
const success = ref('')

// 页面加载时检查登录状态
onMounted(() => {
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录后再发布帖子'
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
})

const handleSubmit = async () => {
  // 检查登录状态
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录'
    router.push('/login')
    return
  }
  // 表单验证
  if (!postForm.value.title.trim()) {
    error.value = '请输入标题'
    return
  }
  if (!postForm.value.content.trim()) {
    error.value = '请输入内容'
    return
  }
  if (postForm.value.title.length > 100) {
    error.value = '标题不能超过100字'
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    const response = await postApi.createPost({
      title: postForm.value.title.trim(),
      content: postForm.value.content.trim()
    })
    
    console.log('创建帖子成功:', response)
    
    // 创建成功后跳转到帖子详情
    // 后端返回格式: { post: { id: ..., title: ..., ... } }
    const postId = response.post?.id || response.id
    if (postId) {
      success.value = '帖子发布成功！'
      setTimeout(() => {
        router.push(`/forum/${postId}`)
      }, 1000)
    } else {
      error.value = '发布失败：无法获取帖子ID'
    }
  } catch (err: any) {
    console.error('发布帖子错误:', err)
    error.value = err.response?.error || err.message || '发布失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="create-post-container">
    <div class="create-post-box">
      <h1>发布新帖子</h1>
      
      <el-form :model="postForm" label-position="top" class="post-form">
        <el-form-item label="标题">
          <el-input 
            v-model="postForm.title" 
            placeholder="请输入标题（最多100字）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="内容">
          <el-input 
            v-model="postForm.content" 
            type="textarea" 
            :rows="10"
            placeholder="请输入帖子内容..."
          />
        </el-form-item>
        
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="isLoading">
              发布
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-post-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  box-sizing: border-box;
  min-height: 100vh;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
  color: #333;
}

.create-post-box {
  background: #fff;
  border-radius: 8px;
  padding: clamp(1.5rem, 4vw, 2rem);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: bold;
  margin-bottom: clamp(1.5rem, 4vw, 2rem);
  text-align: center;
}

.post-form :deep(.el-form-item__label) {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  text-align: center;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0f9eb;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  color: #67c23a;
  text-align: center;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}
</style>
