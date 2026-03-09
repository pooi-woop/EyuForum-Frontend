import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/forum',
      name: 'forum',
      component: () => import('../views/ForumView.vue')//懒加载（按需加载）：只有当用户访问该路由时，才会去加载对应的组件文件，而不是在应用初始化时就全部加载。
    },
    {
      path: '/forum/create',
      name: 'create-post',
      component: () => import('../views/CreatePostView.vue')
    },
    {
      path: '/forum/:id',
      name: 'post-detail',
      component: () => import('../views/PostDetailView.vue')
    },
    {
      path: '/news',
      name: 'news',
      component: () => import('../views/NewsView.vue')
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('../views/CommunityView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../components/UserProfile.vue')
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritesView.vue')
    },
    {
      path: '/blocked',
      name: 'blocked',
      component: () => import('../views/BlockedUsersView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue')
    },
    {
      path: '/my-posts',
      name: 'my-posts',
      component: () => import('../views/MyPostsView.vue')
    },
    {
      path: '/user/:id',
      name: 'user-profile',
      component: () => import('../views/UserProfileView.vue')
    }
  ]
})

export default router
