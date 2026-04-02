<template>
  <div class="about-container">
    <h1>关于</h1>
    <h2>站长社交平台账号</h2>
    <div class="social-links">
      <a 
        v-for="(item, index) in socialLinks" 
        :key="index"
        :href="item.link" 
        target="_blank"
        class="image-link"
      >
        <img :src="item.image" class="social-image" />
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import qqImage1 from '../assets/LinkPhoto/QQ_1773056555882.png'
import qqImage2 from '../assets/LinkPhoto/QQ_1773058031036.png'
import qqImage3 from '../assets/LinkPhoto/QQ_1773058090616.png'
import qqImage4 from '../assets/LinkPhoto/QQ_1773058232503.png'
import qqImage5 from '../assets/LinkPhoto/QQ_1773058273672.png'

const socialLinks = [
  {
    name: 'BILIBILI',
    image: qqImage1,
    link: 'https://space.bilibili.com/444943062' // 请在这里填写链接
  },
  {
    name: '社抖音',
    image: qqImage2,
    link: 'https://www.douyin.com/user/MS4wLjABAAAAlK-w0K6GoHT6CzVvfomyhJZoal1ljhvlJieh4u1CsBGAdM2dW_Z3h6SaFK4IanSm?from_tab_name=main' // 请在这里填写链接
  },
  {
    name: '喵御宅',
    image: qqImage3,
    link: 'https://www.mfuns.net/member/32698' // 请在这里填写链接
  },
  {
    name: 'Github',
    image: qqImage4,
    link: 'https://github.com/pooi-woop' // 请在这里填写链接
  },
  {
    name: 'GithubPages个人主页',
    image: qqImage5,
    link: 'https://pooi-woop.github.io/Woop.github.io/' // 请在这里填写链接
  }
]
</script>

<style scoped>
.about-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
  color: #333;
}

.about-container h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.about-container h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #666;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  max-width: 1200px;
}

.image-link {
  display: block;
  text-decoration: none;
  width: 100%;
}

.social-image {
  width: 100%;
  max-width: 1200px;
  height: auto;
  object-fit: contain;
}
</style>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>