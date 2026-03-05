<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/vue-cropper.css'

// 使用 Pinia Store
const userStore = useUserStore()

// 编辑状态
const isEditingNickname = ref(false)
const isEditingBio = ref(false)
const editNickname = ref('')
const editBio = ref('')

// 头像上传 input 引用
const avatarInputRef = ref<HTMLInputElement | null>(null)

// 头像裁剪相关
const showCropper = ref(false)
const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null)
const cropperImage = ref('')
const cropperOptions = ref({
  viewMode: 1,
  aspectRatio: 1,
  autoCropArea: 0.8,
  dragMode: 'move',
  cropBoxMovable: true,
  cropBoxResizable: true
})

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
    }
    reader.readAsDataURL(input.files[0])
  }
}

// 确认裁剪
const confirmCrop = async () => {
  if (cropperRef.value) {
    cropperRef.value.getCropData(async (dataURL: string) => {
      // 将 base64 转换为 Blob
      const blob = dataURLToBlob(dataURL)
      if (blob) {
        await userStore.uploadUserAvatar(blob)
        showCropper.value = false
      }
    })
  }
}

// 取消裁剪
const cancelCrop = () => {
  showCropper.value = false
  cropperImage.value = ''
}

// base64 转 Blob
const dataURLToBlob = (dataURL: string) => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
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
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
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
        <vue-cropper
          ref="cropperRef"
          :img="cropperImage"
          :options="cropperOptions"
          style="width: 100%; height: 400px"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelCrop">取消</el-button>
          <el-button type="primary" @click="confirmCrop">确认</el-button>
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
