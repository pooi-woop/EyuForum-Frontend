<template>
  <div class="link-container">
    <h1>友站</h1>
    <p class="subtitle">优质站点推荐</p>
    
    <div class="link-list">
      <a 
        v-for="(item, index) in friendLinks" 
        :key="index"
        :href="item.link" 
        target="_blank"
        class="link-card"
      >
        <div class="card-header">
          <img :src="item.avatar" :alt="item.name" class="avatar" />
          <div class="info">
            <h3 class="name">{{ item.name }}</h3>
            <p class="url">{{ item.link }}</p>
          </div>
        </div>
        <p class="description">{{ item.description }}</p>
        <div class="tags">
          <span v-for="(tag, tagIndex) in item.tags" :key="tagIndex" class="tag">
            {{ tag }}
          </span>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface FriendLink {
  name: string
  link: string
  avatar: string
  description: string
  tags: string[]
}

const friendLinks: FriendLink[] = [
  {
    name: '皖月清风的个人博客',
    link: 'https://pooiwoop-github-io.pages.dev/',
    avatar: 'https://pooiwoop-github-io.pages.dev/img/butterfly-icon.jpg',
    description: '一个专注于技术分享的个人博客，包含后端开发、项目经验等内容。作者为重庆邮电大学计算机科学与技术学院学生。',
    tags: ['博客', 'Golang', '技术分享']
  }
]
</script>

<style scoped>
.link-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: url('../assets/LinkPhoto/7ff84c885b2fdb45d7faee23e82371261035330202.png') no-repeat center center fixed;
  background-size: cover;
  color: #333;
}

.link-container h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #333;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.link-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.link-card {
  display: block;
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #eee;
}

.link-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #667eea;
}

.info {
  flex: 1;
  overflow: hidden;
}

.name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.3rem 0;
}

.url {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 0.8rem;
}
</style>
