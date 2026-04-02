<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { favoriteApi } from '../services/userApi'
import { tokenManager } from '../utils/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 状态管理
const folders = ref<any[]>([])
const selectedFolder = ref<number | null>(null)
const posts = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const error = ref('')
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const createFolderLoading = ref(false)

// 移动收藏相关状态
const showMoveFolderDialog = ref(false)
const moveFolderLoading = ref(false)
const targetFolderId = ref<number | null>(null)
const currentMovePostId = ref<string>('')

// 页面加载时检查登录状态
onMounted(async () => {
  console.log('FavoritesView onMounted 被调用')
  console.log('用户是否已认证:', tokenManager.isAuthenticated())
  
  if (!tokenManager.isAuthenticated()) {
    error.value = '请先登录后再查看收藏'
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else {
    console.log('开始获取收藏夹列表...')
    await fetchFolders()
  }
})

// 获取收藏夹列表
const fetchFolders = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('fetchFolders 被调用')
    console.log('开始调用 favoriteApi.getFolders()')
    
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
    
    // 默认选择第一个收藏夹
    if (folders.value.length > 0 && !selectedFolder.value) {
      selectedFolder.value = folders.value[0].id
      console.log('默认选择第一个收藏夹:', selectedFolder.value)
      if (selectedFolder.value) {
        await fetchFolderPosts(selectedFolder.value)
      }
    }
  } catch (err: any) {
    console.error('获取收藏夹列表错误:', err)
    console.error('错误详情:', err.response)
    error.value = err.response?.error || '获取收藏夹失败'
  } finally {
    isLoading.value = false
  }
}

// 获取收藏夹中的帖子
const fetchFolderPosts = async (folderId: number) => {
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('fetchFolderPosts 被调用，folderId:', folderId)
    console.log('当前页码:', currentPage.value, '每页数量:', pageSize.value)
    
    const response = await favoriteApi.getFolderPosts(folderId, {
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    console.log('获取收藏帖子响应:', response)

    // 处理不同的响应格式
    // 后端返回格式: { favorites: [{ post: {...}, folder_id: ..., folder_name: ..., created_at: ... }], total: ... }
    let favorites: any[] = []
    if (response && Array.isArray(response)) {
      favorites = response
    } else if (response && typeof response === 'object') {
      favorites = response.favorites || response.data || response.posts || []
    }

    // 将 favorites 转换为 posts 格式，提取 post 数据并添加收藏相关信息
    console.log('favorites 数据:', favorites)
    posts.value = favorites.map((fav: any, index: number) => {
      console.log(`处理第 ${index} 个 favorite:`, fav)
      
      // 检查 fav 是否是 post 对象（直接返回 posts 数组的情况）
      // 还是包含 post 属性的对象（返回 favorites 数组的情况）
      if (fav.id) {
        // fav 是 post 对象
        console.log(`fav 是 post 对象，id:`, fav.id)
        return {
          ...fav,
          folder_id: fav.folder_id,
          folder_name: fav.folder_name,
          favorited_at: fav.created_at
        }
      } else if (fav.post) {
        // fav 包含 post 属性
        console.log(`fav.post:`, fav.post)
        console.log(`fav.post.id:`, fav.post?.id)
        return {
          ...fav.post,
          folder_id: fav.folder_id,
          folder_name: fav.folder_name,
          favorited_at: fav.created_at
        }
      } else {
        console.error(`第 ${index} 个 favorite 数据格式错误:`, fav)
        return null
      }
    }).filter(post => post !== null)
    total.value = response.total || posts.value.length

    console.log('解析后的帖子列表:', posts.value)
    console.log('第一个帖子的 id:', posts.value[0]?.id)
    console.log('总数量:', total.value)
  } catch (err: any) {
    console.error('获取收藏帖子错误:', err)
    console.error('错误详情:', err.response)
    error.value = err.response?.error || '获取收藏帖子失败'
  } finally {
    isLoading.value = false
  }
}

// 切换收藏夹
const handleFolderChange = async (folderId: number) => {
  selectedFolder.value = folderId
  currentPage.value = 1
  await fetchFolderPosts(folderId)
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

// 删除收藏夹
const deleteFolder = async (folderId: number, folderName: string) => {
  ElMessageBox.confirm(`确定要删除收藏夹 "${folderName}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      isLoading.value = true
      
      await favoriteApi.deleteFolder(folderId)
      
      ElMessage.success('收藏夹删除成功')
      
      // 重新获取收藏夹列表
      await fetchFolders()
    } catch (err: any) {
      console.error('删除收藏夹错误:', err)
      ElMessage.error(err.response?.error || '删除收藏夹失败')
    } finally {
      isLoading.value = false
    }
  }).catch(() => {
    // 取消操作
  })
}

// 取消收藏
const removeFavorite = async (postId: string) => {
  console.log('removeFavorite 被调用，postId:', postId, '类型:', typeof postId)
  const stringPostId = String(postId)
  console.log('转换后的 stringPostId:', stringPostId)
  try {
    isLoading.value = true
    
    await favoriteApi.removeFavorite(stringPostId)
    
    ElMessage.success('取消收藏成功')
    
    // 重新获取当前收藏夹的帖子
    if (selectedFolder.value) {
      await fetchFolderPosts(selectedFolder.value)
    }
  } catch (err: any) {
    console.error('取消收藏错误:', err)
    ElMessage.error(err.response?.error || '取消收藏失败')
  } finally {
    isLoading.value = false
  }
}

// 打开移动收藏对话框
const openMoveFolderDialog = (postId: string) => {
  // 过滤掉当前收藏夹，只显示其他收藏夹
  const otherFolders = folders.value.filter(f => f.id !== selectedFolder.value)
  
  if (otherFolders.length === 0) {
    ElMessage.warning('没有其他收藏夹可以移动')
    return
  }
  
  currentMovePostId.value = String(postId)
  targetFolderId.value = otherFolders[0]?.id || null
  showMoveFolderDialog.value = true
}

// 执行移动收藏
const handleMoveFavorite = async () => {
  if (!targetFolderId.value || !currentMovePostId.value) {
    ElMessage.warning('请选择目标收藏夹')
    return
  }
  
  try {
    moveFolderLoading.value = true
    
    await favoriteApi.moveFavorite(currentMovePostId.value, { folder_id: targetFolderId.value })
    
    ElMessage.success('移动收藏成功')
    showMoveFolderDialog.value = false
    targetFolderId.value = null
    currentMovePostId.value = ''
    
    // 重新获取当前收藏夹的帖子
    if (selectedFolder.value) {
      await fetchFolderPosts(selectedFolder.value)
    }
  } catch (err: any) {
    console.error('移动收藏错误:', err)
    ElMessage.error(err.response?.error || '移动收藏失败')
  } finally {
    moveFolderLoading.value = false
  }
}

// 跳转到帖子详情
const goToPostDetail = (postId: string) => {
  const stringPostId = String(postId)
  router.push(`/forum/${stringPostId}`)
}

// 处理分页
const handlePageChange = (page: number) => {
  currentPage.value = page
  if (selectedFolder.value) {
    fetchFolderPosts(selectedFolder.value)
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
</script>

<template>
  <div class="favorites-container">
    <h1>我的收藏</h1>
    
    <!-- 错误提示 -->
    <el-alert 
      v-if="error" 
      :title="error" 
      type="error" 
      show-icon 
      closable 
      style="margin-bottom: 1rem" 
    />
    
    <!-- 收藏夹操作 -->
    <div class="folder-actions">
      <el-button type="primary" @click="showCreateFolderDialog = true">
        <el-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg></el-icon>
        新建收藏夹
      </el-button>
    </div>
    
    <div class="favorites-content">
      <!-- 收藏夹列表 -->
      <div class="folders-sidebar">
        <h2>收藏夹</h2>
        <el-menu
          :default-active="selectedFolder"
          @select="handleFolderChange"
          class="folder-menu"
        >
          <el-menu-item 
            v-for="folder in folders" 
            :key="folder.id" 
            :index="folder.id"
          >
            <div class="folder-item">
              <span>{{ folder.name }}</span>
              <el-button 
                size="small" 
                type="danger" 
                plain 
                @click.stop="deleteFolder(folder.id, folder.name)"
              >
                删除
              </el-button>
            </div>
          </el-menu-item>
        </el-menu>
        
        <div v-if="folders.length === 0 && !isLoading" class="empty-folders">
          <el-empty description="暂无收藏夹" />
          <p>点击上方按钮创建第一个收藏夹</p>
        </div>
      </div>
      
      <!-- 收藏帖子列表 -->
      <div class="posts-content">
        <h2 v-if="selectedFolder">
          {{ folders.find(f => f.id === selectedFolder)?.name }} ({{ total }})
        </h2>
        
        <el-table
          v-loading="isLoading"
          :data="posts"
          style="width: 100%"
          stripe
        >
          <el-table-column prop="title" label="标题" min-width="300">
            <template #default="{ row }">
              <el-link type="primary" @click="goToPostDetail(row.id)">
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
                  {{ (row.user?.nickname || row.user?.email?.split('@')[0] || '匿').charAt(0) }}
                </el-avatar>
                <span class="author-name">{{ row.user?.nickname || row.user?.email?.split('@')[0] || '匿名用户' }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="收藏时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.favorited_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="openMoveFolderDialog(row.id)"
              >
                移动
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="removeFavorite(row.id)"
              >
                取消收藏
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空状态 -->
        <div v-if="posts.length === 0 && !isLoading && selectedFolder" class="empty-posts">
          <el-empty description="该收藏夹暂无内容" />
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
    
    <!-- 移动收藏对话框 -->
    <el-dialog
      v-model="showMoveFolderDialog"
      title="移动收藏"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item label="目标收藏夹">
          <el-select
            v-model="targetFolderId"
            placeholder="请选择目标收藏夹"
            style="width: 100%"
          >
            <el-option
              v-for="folder in folders.filter(f => f.id !== selectedFolder)"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMoveFolderDialog = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleMoveFavorite"
            :loading="moveFolderLoading"
            :disabled="!targetFolderId"
          >
            移动
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.favorites-container {
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

h2 {
  color: #333;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.folder-actions {
  margin-bottom: 2rem;
  text-align: right;
}

.favorites-content {
  display: flex;
  gap: 2rem;
}

.folders-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
}

.folder-menu :deep(.el-menu-item) {
  height: auto;
  padding: 0.75rem 1rem;
  line-height: 1.5;
}

.folder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.empty-folders {
  text-align: center;
  padding: 2rem 0;
}

.empty-folders p {
  margin-top: 1rem;
  color: #999;
}

.posts-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  .favorites-container {
    padding: 0 1rem;
  }
  
  .favorites-content {
    flex-direction: column;
  }
  
  .folders-sidebar {
    width: 100%;
  }
  
  .posts-content {
    padding: 1rem;
  }
}
</style>
