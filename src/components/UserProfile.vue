<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { authApi } from '@/services/userApi'
// 移除 vue-cropper 导入，改用原生实现

// 使用 Pinia Store
const userStore = useUserStore()
const router = useRouter()

// 编辑状态
const isEditingNickname = ref(false)
const isEditingBio = ref(false)
const editNickname = ref('')
const editBio = ref('')

// 头像上传 input 引用
const avatarInputRef = ref<HTMLInputElement | null>(null)

// 头像裁剪相关
const showCropper = ref(false)
const cropperCanvas = ref<HTMLCanvasElement | null>(null)
const cropperImage = ref('')
const cropperScale = ref(1)
const cropperPosition = ref({ x: 0, y: 0 })
const cropBox = ref({ x: 100, y: 100, width: 200, height: 200 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragType = ref<'move' | 'resize' | null>(null)
const resizeHandle = ref<number | null>(null)

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 开始编辑昵称
const startEditNickname = () => {
  editNickname.value = userStore.user?.nickname || ''
  isEditingNickname.value = true
}

// 保存昵称
const saveNickname = async () => {
  if (editNickname.value.trim()) {
    const success = await userStore.updateUserInfo({ nickname: editNickname.value })
    if (success) {
      isEditingNickname.value = false
    }
  }
}

// 取消编辑昵称
const cancelEditNickname = () => {
  isEditingNickname.value = false
}

// 开始编辑简介
const startEditBio = () => {
  editBio.value = userStore.user?.bio || ''
  isEditingBio.value = true
}

// 保存简介
const saveBio = async () => {
  const success = await userStore.updateUserInfo({ bio: editBio.value })
  if (success) {
    isEditingBio.value = false
  }
}

// 取消编辑简介
const cancelEditBio = () => {
  isEditingBio.value = false
}

// 处理头像上传
const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      cropperImage.value = e.target?.result as string
      showCropper.value = true
      // 延迟初始化 canvas，确保 DOM 已渲染
      setTimeout(initCropper, 100)
    }
    reader.readAsDataURL(input.files[0])
  }
}

// 初始化裁剪器
const initCropper = () => {
  if (!cropperCanvas.value) return
  
  const canvas = cropperCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 加载图片
  const img = new Image()
  img.onload = () => {
    // 计算缩放比例，让图片完全填满画布
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    
    // 居中显示
    const x = (canvas.width - scaledWidth) / 2
    const y = (canvas.height - scaledHeight) / 2
    
    cropperPosition.value = { x, y }
    cropperScale.value = scale
    
    // 绘制图片
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
    
    // 绘制裁剪框
    drawCropBox(ctx)
  }
  img.src = cropperImage.value
}

// 绘制裁剪框
const drawCropBox = (ctx: CanvasRenderingContext2D) => {
  const { x, y, width, height } = cropBox.value
  
  // 保存当前状态
  ctx.save()
  
  // 创建裁剪路径
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  
  // 恢复状态
  ctx.restore()
  
  // 绘制半透明遮罩（使用两个矩形实现）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  
  // 顶部遮罩
  ctx.fillRect(0, 0, ctx.canvas.width, y)
  // 左侧遮罩
  ctx.fillRect(0, y, x, height)
  // 右侧遮罩
  ctx.fillRect(x + width, y, ctx.canvas.width - (x + width), height)
  // 底部遮罩
  ctx.fillRect(0, y + height, ctx.canvas.width, ctx.canvas.height - (y + height))
  
  // 绘制裁剪框边框
  ctx.strokeStyle = '#409EFF'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, width, height)
  
  // 绘制调整手柄
  const handleSize = 8
  for (let i = 0; i < 4; i++) {
    const hx = x + (i % 2) * width
    const hy = y + Math.floor(i / 2) * height
    ctx.fillStyle = '#409EFF'
    ctx.fillRect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize)
  }
}

// 处理鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  const canvas = cropperCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // 检查是否点击了调整手柄
  const { x: cx, y: cy, width, height } = cropBox.value
  const handleSize = 10
  
  for (let i = 0; i < 4; i++) {
    const hx = cx + (i % 2) * width
    const hy = cy + Math.floor(i / 2) * height
    if (Math.abs(x - hx) <= handleSize && Math.abs(y - hy) <= handleSize) {
      isDragging.value = true
      dragType.value = 'resize'
      resizeHandle.value = i
      dragStart.value = { x, y }
      return
    }
  }
  
  // 检查是否点击了裁剪框内部
  if (x >= cx && x <= cx + width && y >= cy && y <= cy + height) {
    isDragging.value = true
    dragType.value = 'move'
    dragStart.value = { x, y }
  }
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  
  const canvas = cropperCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const dx = x - dragStart.value.x
  const dy = y - dragStart.value.y
  
  if (dragType.value === 'move') {
    // 移动裁剪框
    cropBox.value = {
      ...cropBox.value,
      x: Math.max(0, Math.min(cropBox.value.x + dx, canvas.width - cropBox.value.width)),
      y: Math.max(0, Math.min(cropBox.value.y + dy, canvas.height - cropBox.value.height))
    }
  } else if (dragType.value === 'resize' && resizeHandle.value !== null) {
    // 调整裁剪框大小
    const { x: cx, y: cy, width, height } = cropBox.value
    const minSize = 50
    
    if (resizeHandle.value === 0) { // 左上角
      const newWidth = Math.max(minSize, width - dx)
      const newHeight = Math.max(minSize, height - dy)
      cropBox.value = {
        x: cx + dx,
        y: cy + dy,
        width: newWidth,
        height: newHeight
      }
    } else if (resizeHandle.value === 1) { // 右上角
      const newWidth = Math.max(minSize, width + dx)
      const newHeight = Math.max(minSize, height - dy)
      cropBox.value = {
        x: cx,
        y: cy + dy,
        width: newWidth,
        height: newHeight
      }
    } else if (resizeHandle.value === 2) { // 左下角
      const newWidth = Math.max(minSize, width - dx)
      const newHeight = Math.max(minSize, height + dy)
      cropBox.value = {
        x: cx + dx,
        y: cy,
        width: newWidth,
        height: newHeight
      }
    } else if (resizeHandle.value === 3) { // 右下角
      const newWidth = Math.max(minSize, width + dx)
      const newHeight = Math.max(minSize, height + dy)
      cropBox.value = {
        x: cx,
        y: cy,
        width: newWidth,
        height: newHeight
      }
    }
  }
  
  dragStart.value = { x, y }
  
  // 重绘
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const img = new Image()
    img.onload = () => {
      const { x: px, y: py } = cropperPosition.value
      const scaledWidth = img.width * cropperScale.value
      const scaledHeight = img.height * cropperScale.value
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 绘制图片
      ctx.drawImage(img, px, py, scaledWidth, scaledHeight)
      
      // 绘制裁剪框和遮罩
      drawCropBox(ctx)
    }
    img.src = cropperImage.value
  }
}

// 处理鼠标释放
const handleMouseUp = () => {
  isDragging.value = false
  dragType.value = null
  resizeHandle.value = null
}

// 确认裁剪
const confirmCrop = async () => {
  const canvas = cropperCanvas.value
  if (!canvas) return
  
  // 创建临时 canvas 用于裁剪
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = cropBox.value.width
  tempCanvas.height = cropBox.value.height
  
  const ctx = tempCanvas.getContext('2d')
  if (!ctx) return
  
  // 加载原图
  const img = new Image()
  img.onload = async () => {
    // 计算实际裁剪位置和大小
    const { x, y, width, height } = cropBox.value
    const { x: px, y: py } = cropperPosition.value
    
    // 绘制裁剪区域
    ctx.drawImage(
      img,
      (x - px) / cropperScale.value,
      (y - py) / cropperScale.value,
      width / cropperScale.value,
      height / cropperScale.value,
      0, 0, width, height
    )
    
    // 转换为 Blob
    tempCanvas.toBlob(async (blob) => {
      if (blob) {
        // 将 Blob 转换为 File 对象，添加文件名和类型信息
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        await userStore.uploadUserAvatar(file)
        showCropper.value = false
      }
    }, 'image/jpeg', 0.9)
  }
  img.src = cropperImage.value
}

// 取消裁剪
const cancelCrop = () => {
  showCropper.value = false
  cropperImage.value = ''
}

// base64 转 Blob
const dataURLToBlob = (dataURL: string) => {
  const arr = dataURL.split(',')
  const mime = arr[0]?.match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1] || '')
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

// 处理登出
const handleLogout = async () => {
  await userStore.logout()
  // 刷新页面或跳转到首页
  window.location.href = '/'
}

// 处理注销账号
const deleteAccountForm = ref({
  email: '',
  code: ''
})
const showDeleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteError = ref('')

// 发送注销验证码
const sendDeleteCode = async () => {
  if (!deleteAccountForm.value.email) {
    deleteError.value = '请输入邮箱地址'
    return
  }
  
  try {
    deleteLoading.value = true
    deleteError.value = ''
    
    console.log('开始发送注销验证码，邮箱:', deleteAccountForm.value.email)
    
    const response = await authApi.sendCode({
      email: deleteAccountForm.value.email,
      type: 'delete' // 使用 delete 类型的验证码
    })
    
    console.log('注销验证码发送成功，响应:', response)
    ElMessage.success('验证码已发送到您的邮箱，请查收')
  } catch (err: any) {
    console.error('发送注销验证码错误:', err)
    console.error('错误状态码:', err.response?.status)
    console.error('错误数据:', err.response?.data)
    deleteError.value = err.response?.data?.error || '发送验证码失败'
  } finally {
    deleteLoading.value = false
  }
}

// 处理注销账号
const handleDeleteAccount = () => {
  // 显示确认对话框
  ElMessageBox.confirm('确定要注销账号吗？此操作不可撤销！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 显示验证码输入对话框
    showDeleteDialog.value = true
    // 自动填充当前用户邮箱
    if (userStore.user?.email) {
      deleteAccountForm.value.email = userStore.user.email
    }
  }).catch(() => {
    // 取消操作
  })
}

// 确认注销账号
const confirmDeleteAccount = async () => {
  if (!deleteAccountForm.value.email || !deleteAccountForm.value.code) {
    deleteError.value = '请填写邮箱和验证码'
    return
  }
  
  try {
    deleteLoading.value = true
    deleteError.value = ''
    
    const success = await userStore.deleteAccount(deleteAccountForm.value.email, deleteAccountForm.value.code)
    if (success) {
      ElMessage.success('账号注销成功')
      showDeleteDialog.value = false
      // 跳转到登录页
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    }
  } catch (err: any) {
    deleteError.value = err.response?.data?.error || '注销账号失败'
    console.error('注销账号错误:', err)
  } finally {
    deleteLoading.value = false
  }
}

// 跳转到收藏夹
const goToFavorites = () => {
  router.push('/favorites')
}

// 跳转到黑名单管理
const goToBlocked = () => {
  router.push('/blocked')
}

// 跳转到管理员后台
const goToAdmin = () => {
  router.push('/admin')
}

// 跳转到我的帖子
const goToMyPosts = () => {
  router.push('/my-posts')
}

// 组件挂载时初始化
onMounted(() => {
  userStore.init()
})
</script>

<template>
  <div class="user-profile">
    <!-- 加载状态 -->
    <div v-if="userStore.isLoading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 未登录状态 -->
    <div v-else-if="!userStore.isLoggedIn" class="not-logged-in">
      <el-empty description="请先登录">
        <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
      </el-empty>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="profile-content">
      <!-- 头像区域 -->
      <div class="avatar-section">
        <el-avatar :size="100" :src="userStore.avatarUrl" />
        <div class="avatar-upload">
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            @change="handleAvatarChange"
            style="display: none"
          />
          <el-button type="primary" size="small" @click="avatarInputRef?.click()">
            更换头像
          </el-button>
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="user-info">
        <!-- 昵称 -->
        <div class="info-item">
          <span class="label">昵称：</span>
          <div v-if="!isEditingNickname" class="value">
            {{ userStore.displayName }}
            <el-button type="primary" link size="small" @click="startEditNickname">
              编辑
            </el-button>
          </div>
          <div v-else class="edit-form">
            <el-input v-model="editNickname" size="small" style="width: 200px" />
            <el-button type="primary" size="small" @click="saveNickname">保存</el-button>
            <el-button size="small" @click="cancelEditNickname">取消</el-button>
          </div>
        </div>

        <!-- 邮箱 -->
        <div class="info-item">
          <span class="label">邮箱：</span>
          <span class="value">{{ userStore.user?.email }}</span>
        </div>

        <!-- 简介 -->
        <div class="info-item">
          <span class="label">简介：</span>
          <div v-if="!isEditingBio" class="value">
            {{ userStore.user?.bio || '暂无简介' }}
            <el-button type="primary" link size="small" @click="startEditBio">
              编辑
            </el-button>
          </div>
          <div v-else class="edit-form">
            <el-input
              v-model="editBio"
              type="textarea"
              :rows="3"
              size="small"
              style="width: 300px"
              maxlength="500"
              show-word-limit
            />
            <div class="edit-buttons">
              <el-button type="primary" size="small" @click="saveBio">保存</el-button>
              <el-button size="small" @click="cancelEditBio">取消</el-button>
            </div>
          </div>
        </div>

        <!-- 注册时间 -->
        <div class="info-item">
          <span class="label">注册时间：</span>
          <span class="value">
            {{ formatDate(userStore.user?.created_at) }}
          </span>
        </div>

        <!-- 用户 ID -->
        <div class="info-item">
          <span class="label">用户 ID：</span>
          <span class="value">{{ userStore.user?.id }}</span>
        </div>

        <!-- 账号状态 -->
        <div class="info-item">
          <span class="label">账号状态：</span>
          <span class="value">
            {{ userStore.user?.status === 1 ? '正常' : userStore.user?.status === 0 ? '禁用' : '未知' }}
          </span>
        </div>

        <!-- 管理员权限 -->
        <div class="info-item">
          <span class="label">管理员权限：</span>
          <span class="value">{{ userStore.user?.is_admin ? '是' : '否' }}</span>
        </div>

        <!-- 邮箱验证 -->
        <div class="info-item">
          <span class="label">邮箱验证：</span>
          <span class="value">{{ userStore.user?.is_verified ? '已验证' : '未验证' }}</span>
        </div>

      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button type="primary" @click="goToFavorites">我的收藏</el-button>
        <el-button type="warning" @click="goToBlocked">黑名单管理</el-button>
        <el-button type="success" @click="goToMyPosts">我的帖子</el-button>
        <el-button 
          v-if="userStore.user?.is_admin" 
          type="info" 
          @click="goToAdmin"
        >
          管理员后台
        </el-button>
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
        <el-button type="danger" plain @click="handleDeleteAccount">注销账号</el-button>
      </div>

      <!-- 错误提示 -->
      <el-alert
        v-if="userStore.error"
        :title="userStore.error"
        type="error"
        show-icon
        closable
        style="margin-top: 1rem"
      />
    </div>

    <!-- 头像裁剪对话框 -->
    <el-dialog
      v-model="showCropper"
      title="裁剪头像"
      width="600px"
    >
      <div class="cropper-container">
        <canvas
          ref="cropperCanvas"
          width="500"
          height="400"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          style="border: 1px solid #ddd; cursor: crosshair"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelCrop">取消</el-button>
          <el-button type="primary" @click="confirmCrop">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 注销账号对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="注销账号"
      width="400px"
    >
      <div class="delete-account-form">
        <el-form :model="deleteAccountForm" label-width="80px">
          <el-form-item label="邮箱">
            <el-input v-model="deleteAccountForm.email" placeholder="请输入邮箱" type="email" />
          </el-form-item>
          
          <el-form-item label="验证码">
            <el-input v-model="deleteAccountForm.code" placeholder="请输入验证码">
              <template #append>
                <el-button @click="sendDeleteCode" :loading="deleteLoading">
                  发送验证码
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          
          <div v-if="deleteError" class="error-message">
            {{ deleteError }}
          </div>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteAccount" :loading="deleteLoading">
            确认注销
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-profile {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  padding: 2rem;
}

.not-logged-in {
  padding: 4rem 0;
}

.profile-content {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.avatar-section {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar-upload {
  margin-top: 1rem;
}

.user-info {
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.label {
  font-weight: bold;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.value {
  flex: 1;
  color: #333;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.edit-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.cropper-container {
  margin-bottom: 1rem;
}

.actions {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}
</style>
