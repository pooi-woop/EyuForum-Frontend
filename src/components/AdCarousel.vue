<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Picture, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

// 广告图片配置 - 实际使用时将图片放入 public/images/ads/ 目录
// 命名格式: ad-1.jpg, ad-2.jpg, ad-3.jpg, ad-4.jpg, ad-5.jpg
const adImages = ref<string[]>([])
const currentIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// 检查图片是否存在
const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

// 加载广告图片
const loadAdImages = async () => {
  const images: string[] = []

  // 检查5张广告图片
  for (let i = 1; i <= 5; i++) {
    const imageUrl = `/images/ads/ad-${i}.jpg`
    const exists = await checkImageExists(imageUrl)
    if (exists) {
      images.push(imageUrl)
    }
  }

  // 如果不足5张，用占位图补齐
  while (images.length < 5) {
    images.push('placeholder')
  }

  adImages.value = images
}

// 下一张
const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % adImages.value.length
}

// 上一张
const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + adImages.value.length) % adImages.value.length
}

// 跳转到指定张
const goToSlide = (index: number) => {
  currentIndex.value = index
}

// 开始自动轮播
const startAutoplay = () => {
  timer = setInterval(() => {
    nextSlide()
  }, 3000) // 3秒切换一次
}

// 停止自动轮播
const stopAutoplay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  loadAdImages()
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<template>
  <div class="ad-carousel">
    <div class="carousel-container" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
      <!-- 图片列表 -->
      <div
        class="carousel-track"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <div
          v-for="(image, index) in adImages"
          :key="index"
          class="carousel-slide"
        >
          <template v-if="image === 'placeholder'">
            <div class="placeholder-slide">
              <div class="placeholder-content">
                <el-icon :size="48"><Picture /></el-icon>
                <span class="placeholder-text">广告招租中</span>
                <span class="placeholder-subtext">联系管理员投放广告</span>
              </div>
            </div>
          </template>
          <template v-else>
            <img :src="image" :alt="`广告${index + 1}`" class="ad-image" />
          </template>
        </div>
      </div>

      <!-- 左右切换按钮 -->
      <button class="carousel-btn prev" @click="prevSlide">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <button class="carousel-btn next" @click="nextSlide">
        <el-icon><ArrowRight /></el-icon>
      </button>

      <!-- 指示器 -->
      <div class="carousel-indicators">
        <span
          v-for="(_, index) in adImages"
          :key="index"
          class="indicator"
          :class="{ active: currentIndex === index }"
          @click="goToSlide(index)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ad-carousel {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
}

.carousel-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  height: 300px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.carousel-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease-in-out;
}

.carousel-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-slide {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.placeholder-text {
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.placeholder-subtext {
  font-size: 1rem;
  opacity: 0.9;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}

.carousel-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-50%) scale(1.1);
}

.carousel-btn.prev {
  left: 1rem;
}

.carousel-btn.next {
  right: 1rem;
}

.carousel-indicators {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.2);
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.8);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .carousel-container {
    height: 200px;
  }

  .placeholder-text {
    font-size: 1.5rem;
  }

  .carousel-btn {
    width: 32px;
    height: 32px;
  }
}
</style>
