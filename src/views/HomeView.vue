<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdCarousel from '../components/AdCarousel.vue'
import { ref, onMounted } from 'vue'
import { weatherApi } from '../services/userApi'
import { ElMessage } from 'element-plus'
import { InfoFilled, WarningFilled, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const weatherData = ref<any>(null)
const isLoading = ref(false)

onMounted(() => {
  fetchWeather()
})

const fetchWeather = async () => {
  try {
    isLoading.value = true
    // 使用后端接口获取客户端IP
    const ipResponse = await fetch('/api/ip')
    if (!ipResponse.ok) {
      throw new Error('获取IP地址失败')
    }
    const ipData = await ipResponse.json()
    const userIp = ipData.ip
    
    // 使用真实IP查询天气
    const response = await weatherApi.getWeatherByIp(userIp)
    weatherData.value = response
  } catch (err: any) {
    console.error('获取天气信息失败:', err)
    const errorMessage = err.response?.data?.error || '获取天气信息失败，请稍后重试'
    ElMessage.error(errorMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="home-container">
    <!-- 背景图片 -->
    <div class="bg-image"></div>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 广告轮播 -->
      <AdCarousel />

      <!-- Hero 区域 -->
      <div class="hero-section">
        <div class="hero-content">
          <h1>bbsDemo</h1>
          <p>你所热爱的,就是你的生活</p>
          <el-button type="primary" size="large" @click="router.push('/forum')">
            进入论坛
          </el-button>
        </div>
        
        <!-- 天气信息卡片 -->
        <div class="weather-card">
          <div class="weather-header">
            <h3 class="weather-title">当前天气</h3>
            <el-button type="text" size="small" @click="fetchWeather">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div v-if="isLoading" class="loading">
            <el-icon class="is-loading"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 480a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm144-144a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm-288 0a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm224 224a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm-112 112a32 32 0 1 0 0 64 32 32 0 1 0 0-64z"></path></svg></el-icon>
          </div>
          <div v-else-if="weatherData" class="weather-info">
            <div class="weather-main">
              <div class="weather-city">{{ weatherData.city }}, {{ weatherData.country }}</div>
              <div class="weather-temp">{{ weatherData.temperature }}°C</div>
              <div class="weather-desc">{{ weatherData.weather }}</div>
            </div>
            <div class="weather-details">
              <div class="weather-item">
                <el-icon><InfoFilled /></el-icon>
                <span>体感: {{ weatherData.feels_like }}°C</span>
              </div>
              <div class="weather-item">
                <el-icon><InfoFilled /></el-icon>
                <span>湿度: {{ weatherData.humidity }}%</span>
              </div>
              <div class="weather-item">
                <el-icon><InfoFilled /></el-icon>
                <span>风速: {{ weatherData.wind_speed }} km/h</span>
              </div>
            </div>
            <div class="weather-update">{{ weatherData.updated_at }}</div>
          </div>
          <div v-else class="weather-error">
            <el-icon><WarningFilled /></el-icon>
            <span>无法获取天气信息</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
  filter: brightness(0.6);
}

.main-content {
  position: relative;
  z-index: 1;
  padding: 2rem;
}

.hero-section {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 1rem;
  gap: 2rem;
}

.hero-content {
  color: #fff;
  max-width: 600px;
  text-align: center;
  flex: 1;
}

.weather-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  flex-shrink: 0;
  color: #333;
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.weather-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #409eff;
}

.weather-header :deep(.el-button) {
  color: #409eff;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.weather-main {
  text-align: center;
}

.weather-city {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.weather-temp {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.weather-desc {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 1rem;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.weather-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.weather-item :deep(el-icon) {
  color: #409eff;
}

.weather-update {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
  margin-top: 0.5rem;
}

.weather-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #999;
}

.weather-error :deep(el-icon) {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #ccc;
}

.hero-content h1 {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-content p {
  font-size: clamp(1rem, 3vw, 1.25rem);
  margin-bottom: 2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  opacity: 0.9;
}

:deep(.el-button--large) {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-content {
    padding: 0 0.5rem;
  }
  
  .weather-card {
    max-width: 100%;
    width: 100%;
  }
  
  :deep(.el-button--large) {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
