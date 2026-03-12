<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  src?: string
  size?: number
  fallbackText?: string
  shape?: 'circle' | 'square'
}

const props = withDefaults(defineProps<Props>(), {
  size: 36,
  fallbackText: '匿',
  shape: 'circle'
})

const DEFAULT_AVATAR = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const avatarUrl = computed(() => {
  const avatar = props.src
  if (!avatar || avatar.trim() === '') {
    return DEFAULT_AVATAR
  }
  if (avatar.startsWith('/')) {
    return `http://localhost:8080${avatar}`
  }
  return avatar
})

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = DEFAULT_AVATAR
}
</script>

<template>
  <div 
    class="avatar-container" 
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: shape === 'circle' ? '50%' : '8px'
    }"
  >
    <img 
      :src="avatarUrl" 
      @error="handleImageError"
      class="avatar"
      :alt="fallbackText"
    />
  </div>
</template>

<style scoped>
.avatar-container {
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
