<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postApi, commentApi, likeApi, favoriteApi, blockApi, userApi, adminApi } from '../services/userApi'
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem, ElCheckboxGroup, ElCheckbox, ElAvatar, ElPopconfirm } from 'element-plus'

const route = useRoute()
const router = useRouter()

const postId = ref(route.params.id as string)
const post = ref<any>(null)
const comments = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalComments = ref(0)
const isLoading = ref(false)
const error = ref('')
const commentContent = ref('')



// 回复相关状态
const replyContent = ref('')
const replyToCommentId = ref<string | null>(null)
const isSubmittingReply = ref(false)

// 收藏相关状态
const folders = ref<any[]>([])
const selectedFolders = ref<string[]>([])
const originalFolders = ref<string[]>([]) // 记录帖子原本所在的收藏夹
const isFavoriting = ref(false)
const isBlocked = ref(false)
const isBlocking = ref(false)
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const createFolderLoading = ref(false)

// 获取帖子详情
const fetchPostDetail = async () => {
  console.log('fetchPostDetail 被调用，postId:', postId.value)
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('开始获取帖子详情...')
    const response = await postApi.getPostDetail(postId.value)
    console.log('获取帖子详情响应:', response)
    // 后端返回格式: { post: { id: ..., title: ..., ... } }
    post.value = response.post || response
    
    // 打印浏览量信息，检查多种可能的字段名
    console.log('完整的帖子数据:', post.value)
    console.log('views字段:', post.value.views)
    console.log('view_count字段:', post.value.view_count)
    console.log('visits字段:', post.value.visits)
    console.log('visit_count字段:', post.value.visit_count)
    
    // 延迟重新获取帖子详情，确保获取到最新的浏览量
    setTimeout(async () => {
      console.log('延迟重新获取帖子详情以更新浏览量...')
      try {
        // 确保postId仍然有效
        if (!postId.value) {
          console.error('postId无效，无法重新获取帖子详情')
          return
        }
        
        const refreshedResponse = await postApi.getPostDetail(postId.value)
        console.log('重新获取帖子详情响应:', refreshedResponse)
        post.value = refreshedResponse.post || refreshedResponse
        // 打印浏览量信息，检查多种可能的字段名
        console.log('完整的帖子数据:', post.value)
        console.log('views字段:', post.value.views)
        console.log('view_count字段:', post.value.view_count)
        console.log('visits字段:', post.value.visits)
        console.log('visit_count字段:', post.value.visit_count)
        // 重新获取点赞、收藏和评论状态，确保数据一致性
        await fetchLikeStatus()
        await fetchFavoriteStatus()
        await fetchComments()
      } catch (err) {
        console.error('重新获取帖子详情失败:', err)
      }
    }, 1000) // 延迟1秒后重新获取
  } catch (err: any) {
    console.error('获取帖子详情错误:', err)
    console.error('错误状态码:', err.response?.status)
    console.error('错误数据:', err.response?.data)
    error.value = err.response?.error || '获取帖子详情失败'
  }
}

// 获取浏览量（支持多种字段名）
const getPostViews = () => {
  if (!post.value) return 0
  
  // 尝试多种可能的字段名
  return post.value.views || 
         post.value.view_count || 
         post.value.visits || 
         post.value.visit_count || 0
}

// 获取评论列表
const fetchComments = async () => {
  try {
    // 检查postId是否有效
    if (!postId.value) {
      console.error('postId无效:', postId.value)
      return
    }
    
    console.log('开始获取评论列表，postId:', postId.value)
    const response = await commentApi.getComments(postId.value, {
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    console.log('获取评论列表响应:', response)
    // 后端返回格式: { comments: [...], total: ... }
    let fetchedComments = response.comments || response.data || []
    totalComments.value = response.total || 0
    
    // 分离主评论和回复
    const mainComments = []
    const repliesMap = new Map()
    
    // 首先将所有评论分类
    for (const comment of fetchedComments) {
      if (comment.comment_id) {
        // 这是一个回复
        if (!repliesMap.has(comment.comment_id)) {
          repliesMap.set(comment.comment_id, [])
        }
        repliesMap.get(comment.comment_id).push(comment)
      } else {
        // 这是一个主评论
        mainComments.push({
          ...comment,
          replies: []
        })
      }
    }
    
    // 为每个主评论添加回复
    for (const comment of mainComments) {
      if (repliesMap.has(comment.id)) {
        comment.replies = repliesMap.get(comment.id)
      }
    }
    
    comments.value = mainComments
    console.log('解析后的评论列表（含回复）:', comments.value)
  } catch (err: any) {
    console.error('获取评论列表错误', err)
  }
}

// 点赞帖子
const handleLikePost = async () => {
  try {
    if (post.value.is_liked) {
      await likeApi.unlikePost(postId.value)
    } else {
      await likeApi.likePost(postId.value)
    }
    // 操作成功后重新获取状态
    await fetchLikeStatus()
  } catch (err: any) {
    console.error('点赞操作错误', err)
    // 操作失败后重新获取状态
    await fetchLikeStatus()
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) return
  
  try {
    const response = await commentApi.createComment({
      post_id: postId.value,
      content: commentContent.value
    })
    
    console.log('提交评论成功:', response)
    
    // 清空评论内容并重新获取评论列表
    commentContent.value = ''
    currentPage.value = 1
    await fetchComments()
    // 更新帖子评论数
    post.value.comment_count = (post.value.comment_count || 0) + 1
  } catch (err: any) {
    console.error('提交评论错误详情:', err)
    console.error('错误状态码:', err.response?.status)
    console.error('错误数据:', err.response?.data)
    error.value = err.response?.data?.error || err.response?.error || '提交评论失败'
  }
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchComments()
}

// 显示回复输入框
const showReplyInput = (commentId: string) => {
  replyToCommentId.value = commentId
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyToCommentId.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (parentCommentId: string) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  isSubmittingReply.value = true
  try {
    const response = await commentApi.createReply({
      comment_id: parentCommentId,
      content: replyContent.value
    })
    
    console.log('提交回复成功:', response)
    ElMessage.success('回复成功')
    
    // 清空回复内容并重新获取评论列表
    replyContent.value = ''
    replyToCommentId.value = null
    await fetchComments()
    // 更新帖子评论数
    post.value.comment_count = (post.value.comment_count || 0) + 1
  } catch (err: any) {
    console.error('提交回复错误:', err)
    ElMessage.error(err.response?.data?.error || '回复失败')
  } finally {
    isSubmittingReply.value = false
  }
}

// 获取收藏夹列表
const fetchFolders = async () => {
  try {
    console.log('开始获取收藏夹列表...')
    const response = await favoriteApi.getFolders()
    console.log('获取收藏夹列表响应:', response)
    
    // 处理不同的响应格式
    if (response && Array.isArray(response)) {
      folders.value = response
    } else if (response && typeof response === 'object') {
      folders.value = response.data || response.folders || []
    } else {
      folders.value = []
    }
    
    console.log('解析后的收藏夹列表:', folders.value)
    
    // 获取帖子已收藏的收藏夹
    await fetchPostFolders()
  } catch (err: any) {
    console.error('获取收藏夹列表错误:', err)
    console.error('错误详情:', err.response)
    folders.value = []
  }
}

// 获取帖子已收藏的收藏夹
const fetchPostFolders = async () => {
  // 直接调用获取收藏状态的接口，因为它包含了帖子所在的收藏夹信息
  await fetchFavoriteStatus()
}

// 收藏帖子
const handleFavorite = async () => {
  // 检查 postId 是否有效
  if (!postId.value) {
    ElMessage.error('帖子ID无效')
    return
  }
  
  const stringPostId = String(postId.value)
  
  try {
    isFavoriting.value = true
    
    console.log('开始处理收藏，postId:', stringPostId)
    console.log('当前选择的收藏夹:', selectedFolders.value)
    console.log('原本所在的收藏夹:', originalFolders.value)
    
    // 计算需要添加的收藏夹（新勾选但未收藏的）
    const foldersToAdd = selectedFolders.value.filter(folderId => !originalFolders.value.includes(folderId))
    
    // 计算需要移除的收藏夹（未勾选但原本收藏的）
    const foldersToRemove = originalFolders.value.filter(folderId => !selectedFolders.value.includes(folderId))
    
    console.log('需要添加的收藏夹:', foldersToAdd)
    console.log('需要移除的收藏夹:', foldersToRemove)
    
    // 添加新的收藏
    for (const folderId of foldersToAdd) {
      try {
        console.log('正在添加到收藏夹:', folderId)
        const response = await favoriteApi.addFavorite({
          post_id: stringPostId,
          folder_id: folderId
        })
        console.log('添加到收藏夹', folderId, '成功:', response)
      } catch (err: any) {
        console.error('添加到收藏夹', folderId, '失败:', err)
        throw err
      }
    }
    
    // 移除取消的收藏
    for (const folderId of foldersToRemove) {
      try {
        console.log('正在从收藏夹移除:', folderId)
        // 使用 moveFavorite 接口将帖子移出收藏夹
        // 或者使用 removeFavorite 接口
        const response = await favoriteApi.removeFavorite(stringPostId)
        console.log('从收藏夹移除成功:', response)
      } catch (err: any) {
        console.error('从收藏夹移除失败:', err)
        // 不移除失败不抛出错误，继续处理其他收藏夹
      }
    }
    
    ElMessage.success('收藏更新成功')
    
    // 更新原始收藏夹记录
    originalFolders.value = [...selectedFolders.value]
    
    // 操作成功后重新获取收藏状态
    await fetchFavoriteStatus()
    
  } catch (err: any) {
    console.error('收藏帖子错误:', err)
    console.error('错误详情:', err.response)
    console.error('错误消息:', err.message)
    console.error('错误状态码:', err.response?.status)
    console.error('错误数据:', err.response?.data)
    
    // 更详细的错误提示
    let errorMsg = '收藏失败'
    if (err.response?.data?.error) {
      errorMsg = err.response.data.error
    } else if (err.response?.error) {
      errorMsg = err.response.error
    } else if (err.message) {
      errorMsg = err.message
    }
    ElMessage.error(errorMsg)
    
    // 操作失败后重新获取状态
    await fetchFavoriteStatus()
  } finally {
    isFavoriting.value = false
    // 操作完成后重新获取收藏状态
    await fetchFavoriteStatus()
  }
}

// 处理拉黑用户
const handleBlockUser = async (userId: string) => {
  try {
    isBlocking.value = true
    
    if (isBlocked.value) {
      // 取消拉黑
      await blockApi.unblockUser(userId)
      isBlocked.value = false
      ElMessage.success('已取消拉黑')
    } else {
      // 拉黑用户
      await blockApi.blockUser(userId)
      isBlocked.value = true
      ElMessage.success('已拉黑用户')
    }
  } catch (err: any) {
    console.error('拉黑操作错误:', err)
    ElMessage.error(err.response?.error || '操作失败')
  } finally {
    isBlocking.value = false
  }
}

// 创建收藏夹
const createFolder = async () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }
  
  try {
    createFolderLoading.value = true
    
    console.log('开始创建收藏夹，名称:', newFolderName.value.trim())
    
    const response = await favoriteApi.createFolder({ name: newFolderName.value.trim() })
    
    console.log('创建收藏夹响应:', response)
    
    ElMessage.success('收藏夹创建成功')
    showCreateFolderDialog.value = false
    newFolderName.value = ''
    
    // 重新获取收藏夹列表
    await fetchFolders()
  } catch (err: any) {
    console.error('创建收藏夹错误:', err)
    console.error('错误响应:', err.response)
    console.error('错误消息:', err.message)
    ElMessage.error(err.response?.error || '创建收藏夹失败')
  } finally {
    console.log('创建收藏夹操作完成，设置createFolderLoading为false')
    createFolderLoading.value = false
  }
}

// 获取点赞状态
const fetchLikeStatus = async () => {
  try {
    console.log('开始获取点赞状态，postId:', postId.value)
    const response = await likeApi.getLikeStatus(postId.value)
    console.log('获取点赞状态响应:', response)
    if (post.value) {
      post.value.is_liked = response.is_liked || false
      post.value.like_count = response.like_count || 0
    }
  } catch (err: any) {
    console.error('获取点赞状态错误:', err)
  }
}

// 获取收藏状态
const fetchFavoriteStatus = async () => {
  try {
    console.log('开始获取收藏状态，postId:', postId.value)
    const response = await favoriteApi.getFavoriteStatus(postId.value)
    console.log('获取收藏状态响应:', response)
    if (post.value) {
      post.value.is_favorited = response.is_favorited || false
    }
    // 更新收藏夹勾选状态
    if (response.folders && Array.isArray(response.folders)) {
      selectedFolders.value = response.folders.map((folder: any) => folder.id.toString())
      originalFolders.value = [...selectedFolders.value]
      console.log('更新收藏夹勾选状态:', selectedFolders.value)
    }
  } catch (err: any) {
    console.error('获取收藏状态错误:', err)
  }
}



// 禁言用户
const handleBanUser = async (userId: string) => {
  try {
    await adminApi.banUser(userId)
    ElMessage.success('用户已被禁言')
  } catch (err: any) {
    console.error('禁言用户错误:', err)
    ElMessage.error(err.response?.error || '禁言失败')
  }
}

// 解除禁言
const handleUnbanUser = async (userId: string) => {
  try {
    await adminApi.unbanUser(userId)
    ElMessage.success('用户已解除禁言')
  } catch (err: any) {
    console.error('解除禁言错误:', err)
    ElMessage.error(err.response?.error || '解除禁言失败')
  }
}

// 初始加载
onMounted(async () => {
  try {
    isLoading.value = true
    // 确保postId有效
    if (!postId.value) {
      console.error('postId无效，无法获取帖子详情')
      error.value = '帖子ID无效'
      return
    }
    
    await fetchPostDetail()
    await fetchComments()
    await fetchFolders()
    // 获取点赞和收藏状态
    await fetchLikeStatus()
    await fetchFavoriteStatus()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="post-detail-container">
    <!-- 帖子详情 -->
    <div v-if="post" class="post-detail">
      <h1 class="post-title">{{ post.title }}</h1>
      <div class="post-meta">
        <div class="author-info">
          <router-link :to="`/user/${post.user?.id}`" class="author-link">
            <el-avatar :src="post.user?.avatar" :size="32" class="author-avatar">
              {{ post.user?.nickname?.charAt(0) || '匿' }}
            </el-avatar>
            <span class="post-author">{{ post.user?.nickname || '匿名用户' }}</span>
          </router-link>
          <el-popconfirm
            v-if="post.user?.id"
            :title="isBlocked ? '确定要取消拉黑吗？' : '确定要拉黑该用户吗？'"
            @confirm="handleBlockUser(post.user.id)"
          >
            <template #reference>
              <el-button 
                :type="isBlocked ? 'warning' : 'default'" 
                size="small" 
                :loading="isBlocking"
                class="block-button"
              >
                {{ isBlocked ? '已拉黑' : '拉黑' }}
              </el-button>
            </template>
          </el-popconfirm>
          
          <!-- 禁言按钮 -->
          <el-popconfirm
            v-if="post.user?.id"
            :title="post.user?.status === 0 ? '确定要解除禁言吗？' : '确定要禁言该用户吗？'"
            @confirm="post.user?.status === 0 ? handleUnbanUser(post.user.id) : handleBanUser(post.user.id)"
          >
            <template #reference>
              <el-button 
                :type="post.user?.status === 0 ? 'success' : 'danger'" 
                size="small"
                class="ban-button"
              >
                {{ post.user?.status === 0 ? '已禁言' : '禁言' }}
              </el-button>
            </template>
          </el-popconfirm>
        </div>
        <div class="post-stats">
          <span class="post-time">{{ new Date(post.created_at).toLocaleString() }}</span>
          <span class="post-views">浏览: {{ getPostViews() }}</span>
        </div>
      </div>
      <div class="post-content">
        {{ post.content }}
      </div>
      <div class="post-actions">
        <el-button 
          :type="post.is_liked ? 'primary' : 'default'"
          @click="handleLikePost"
        >
          <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777Z" clip-rule="evenodd" /></svg></el-icon>
          {{ post.like_count || 0 }}
        </el-button>
        <el-dropdown trigger="click" @visible-change="async (visible) => { if (visible) await fetchFavoriteStatus() }" placement="bottom">
          <el-button :type="post.is_favorited ? 'primary' : 'default'">
            <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" /></svg></el-icon>
            收藏
          </el-button>
          <template #dropdown>
            <div class="favorite-panel">
              <div class="favorite-header">
                <h3>收藏到</h3>
              </div>
              <div class="favorite-folders">
                <!-- 有收藏夹时显示可勾选框 -->
                <el-checkbox-group v-if="folders.length > 0" v-model="selectedFolders">
                  <el-checkbox 
                    v-for="folder in folders" 
                    :key="folder.id" 
                    :label="folder.id"
                    class="folder-checkbox"
                  >
                    {{ folder.name }}
                  </el-checkbox>
                </el-checkbox-group>
                
                <!-- 没有收藏夹时显示提示 -->
                <div v-else class="no-folders">
                  <el-empty description="暂无收藏夹" :image-size="60" />
                </div>
                
                <el-divider />
                <el-button 
                  type="text" 
                  @click="showCreateFolderDialog = true"
                  class="create-folder-button"
                >
                  <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg></el-icon>
                  新建收藏夹
                </el-button>
              </div>
              <div class="favorite-actions">
                <el-button 
                  type="primary" 
                  @click="handleFavorite"
                  :loading="isFavoriting"
                  class="confirm-button"
                >
                  确认收藏
                </el-button>
              </div>
            </div>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- 评论区 -->
    <div v-if="post" class="comments-section">
      <h2>评论 ({{ post.comment_count || 0 }})</h2>
      
      <!-- 评论输入框 -->
      <div class="comment-input">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
        />
        <el-button type="primary" @click="submitComment" style="margin-top: 1rem;">
          提交评论
        </el-button>
      </div>
      
      <!-- 评论列表 -->
      <div class="comments-list">
        <el-card v-for="comment in comments" :key="comment.id" class="comment-card">
          <div class="comment-header">
            <span class="comment-author">{{ comment.user?.nickname || '匿名用户' }}</span>
            <span class="comment-time">{{ new Date(comment.created_at).toLocaleString() }}</span>
          </div>
          <div class="comment-content">
            {{ comment.content }}
          </div>
          <!-- 回复按钮 -->
          <div class="comment-actions">
            <el-button type="primary" link size="small" @click="showReplyInput(comment.id)">
              回复
            </el-button>
          </div>
          <!-- 回复输入框 -->
          <div v-if="replyToCommentId === comment.id" class="reply-input-section">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              placeholder="写下你的回复..."
            />
            <div class="reply-actions">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button type="primary" size="small" @click="submitReply(comment.id)" :loading="isSubmittingReply">
                提交回复
              </el-button>
            </div>
          </div>
          <!-- 楼中楼回复 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
            <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <span class="reply-author">{{ reply.user?.nickname || '匿名用户' }}</span>
                <span class="reply-time">{{ new Date(reply.created_at).toLocaleString() }}</span>
              </div>
              <div class="reply-content">
                {{ reply.content }}
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 空状态 -->
      <div v-if="comments.length === 0 && !isLoading" class="empty-state">
        <el-empty description="暂无评论" />
      </div>
      
      <!-- 评论分页 -->
      <div v-if="totalComments > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalComments"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 创建收藏夹对话框 -->
    <el-dialog
      v-model="showCreateFolderDialog"
      title="新建收藏夹"
      width="400px"
    >
      <el-form :model="{ name: newFolderName }" label-width="80px">
        <el-form-item label="收藏夹名称">
          <el-input 
            v-model="newFolderName" 
            placeholder="请输入收藏夹名称" 
            maxlength="50" 
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateFolderDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="createFolder" 
            :loading="createFolderLoading"
          >
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.post-detail-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.post-detail {
  margin-bottom: 3rem;
}

.post-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 1rem 0;
  line-height: 1.3;
}

.post-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.author-avatar {
  flex-shrink: 0;
}

.post-author {
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
}

.author-link {
  display: flex;
  align-items: center;
  color: #333;
  text-decoration: none;
}

.author-link:hover {
  color: #409EFF;
}

.block-button {
  margin-left: auto;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #999;
}

.post-views {
  color: #666;
  font-weight: 500;
}

/* 收藏面板样式 */
.favorite-panel {
  min-width: 300px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.favorite-header {
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.favorite-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.favorite-folders {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.no-folders {
  padding: 16px 0;
}

.folder-checkbox {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.favorite-actions {
  text-align: right;
}

.confirm-button {
  width: 100%;
}

.create-folder-button {
  width: 100%;
  justify-content: flex-start;
  padding-left: 0;
  color: #666;
}

.create-folder-button:hover {
  color: #409EFF;
}

.post-content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 2rem;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.comments-section {
  margin-top: 3rem;
}

.comments-section h2 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
}

.comment-input {
  margin-bottom: 2rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.comment-card {
  transition: box-shadow 0.3s ease;
}

.comment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-weight: bold;
  color: #333;
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
}

.comment-content {
  color: #666;
  line-height: 1.5;
}

/* 评论操作按钮样式 */
.comment-actions {
  margin-top: 0.5rem;
}

/* 回复输入框样式 */
.reply-input-section {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.reply-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* 楼中楼回复样式 */
.replies-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e0e0e0;
  background: #f9f9f9;
  border-radius: 4px;
  padding: 0.75rem;
}

.reply-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.reply-author {
  font-weight: 500;
  color: #409EFF;
  font-size: 0.9rem;
}

.reply-time {
  font-size: 0.75rem;
  color: #999;
}

.reply-content {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.loading-state {
  margin: 2rem 0;
}

.error-message {
  margin: 2rem 0;
  padding: 1rem;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  text-align: center;
}

.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .post-detail-container {
    padding: 0 1rem;
  }
  
  .post-title {
    font-size: 1.5rem;
  }
}
</style>
