import api from './api'

// 认证相关 API
export const authApi = {
  // 发送验证码
  sendCode: (data: { email: string; type: 'register' | 'reset' | 'delete' }): Promise<any> => {
    return api.post('/auth/send-code', data)
  },
  
  // 注册
  register: (data: { email: string; password: string; code: string }): Promise<any> => {
    return api.post('/auth/register', data)
  },
  
  // 登录
  login: (data: { email: string; password: string }): Promise<any> => {
    return api.post('/auth/login', data)
  },
  
  // 刷新令牌
  refreshToken: (data: { refresh_token: string }): Promise<any> => {
    return api.post('/auth/refresh', data)
  },
  
  // 登出
  logout: (data: { refresh_token: string }): Promise<any> => {
    return api.post('/logout', data)
  },
  
  // 登出所有设备
  logoutAll: (): Promise<any> => {
    return api.post('/logout-all')
  },
  
  // 重置密码
  resetPassword: (data: { email: string; password: string; code: string }): Promise<any> => {
    return api.post('/auth/reset-password', data)
  },
  
  // 删除账号
  deleteAccount: (data: { email: string; code: string }): Promise<any> => {
    return api.post('/auth/delete-account', data)
  }
}

// 用户相关 API
export const userApi = {
  // 获取用户信息
  getUserInfo: (): Promise<any> => {
    return api.get('/profile')
  },
  
  // 获取其他用户信息
  getUserProfile: (userId: string): Promise<any> => {
    return api.get(`/users/${userId}`)
  },
  
  // 更新昵称
  updateNickname: (data: { nickname: string }): Promise<any> => {
    return api.put('/profile/nickname', data)
  },
  
  // 更新简介
  updateBio: (data: { bio: string }): Promise<any> => {
    return api.put('/profile/bio', data)
  },
  
  // 上传头像
  uploadAvatar: (formData: FormData): Promise<any> => {
    return api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取用户列表（管理员）
  getUsers: (params: { page: number; page_size: number }): Promise<any> => {
    return api.get('/users', { params })
  }
}

// 综合搜索 API
export const searchApi = {
  // 综合搜索（用户和帖子）
  search: (params: { keyword: string; page: number; page_size: number }): Promise<any> => {
    return api.get('/search', { params })
  }
}

// 帖子相关 API
export const postApi = {
  // 获取帖子列表
  getPosts: (params: { page: number; page_size: number }): Promise<any> => {
    return api.get('/posts', { params })
  },
  
  // 搜索帖子
  searchPosts: (params: { keyword: string; page: number; page_size: number }): Promise<any> => {
    return api.get('/posts/search', { params })
  },
  
  // 获取帖子详情
  getPostDetail: (postId: string): Promise<any> => {
    return api.get(`/posts/${postId}`, {
      params: {
        t: Date.now() // 添加时间戳避免缓存
      }
    })
  },
  
  // 创建帖子
  createPost: (data: { title: string; content: string }): Promise<any> => {
    return api.post('/posts', data)
  },
  
  // 更新帖子
  updatePost: (postId: string, data: { title: string; content: string }): Promise<any> => {
    return api.put(`/posts/${postId}`, data)
  },
  
  // 删除帖子
  deletePost: (postId: string): Promise<any> => {
    return api.delete(`/posts/${postId}`)
  },
  
  // 获取我的帖子
  getMyPosts: (params: { page: number; page_size: number }): Promise<any> => {
    return api.get('/my/posts', { params })
  }
}

// 评论相关 API
export const commentApi = {
  // 获取评论列表
  getComments: (postId: string, params: { page: number; page_size: number; keyword?: string }): Promise<any> => {
    if (postId) {
      return api.get(`/posts/${postId}/comments`, { params })
    } else {
      // 新的评论搜索API
      return api.get('/comments', { params })
    }
  },
  
  // 获取评论的回复（楼中楼）
  getReplies: (commentId: string, params: { page: number; page_size: number }): Promise<any> => {
    return api.get(`/comments/${commentId}/replies`, { params })
  },
  
  // 创建评论
  createComment: (data: { post_id: string; content: string }): Promise<any> => {
    return api.post('/comments', data)
  },
  
  // 创建回复（楼中楼）
  createReply: (data: { comment_id: string; content: string }): Promise<any> => {
    return api.post('/comments', data)
  },
  
  // 更新评论
  updateComment: (commentId: string, data: { content: string }): Promise<any> => {
    return api.put(`/comments/${commentId}`, data)
  },
  
  // 删除评论
  deleteComment: (commentId: string): Promise<any> => {
    return api.delete(`/comments/${commentId}`)
  }
}

// 管理员相关 API
export const adminApi = {
  // 管理员删除帖子
  deletePost: (postId: string): Promise<any> => {
    return api.delete(`/admin/posts/${postId}`)
  },
  
  // 管理员删除评论
  deleteComment: (commentId: string): Promise<any> => {
    return api.delete(`/admin/comments/${commentId}`)
  },
  
  // 查看所有评论
  getComments: (params: { page: number; page_size: number }): Promise<any> => {
    return api.get('/admin/comments', { params })
  },
  
  // 禁言用户
  banUser: (userId: string): Promise<any> => {
    return api.put(`/admin/users/${userId}/ban`)
  },
  
  // 解除禁言
  unbanUser: (userId: string): Promise<any> => {
    return api.put(`/admin/users/${userId}/unban`)
  },
  
  // 查看所有用户
  getUsers: (params: { page: number; page_size: number; keyword?: string }): Promise<any> => {
    return api.get('/admin/users', { params })
  }
}

// 点赞相关 API
export const likeApi = {
  // 点赞帖子
  likePost: (postId: string): Promise<any> => {
    return api.post(`/posts/${postId}/like`)
  },
  
  // 取消点赞
  unlikePost: (postId: string): Promise<any> => {
    return api.delete(`/posts/${postId}/like`)
  },
  
  // 获取帖子点赞状态
  getLikeStatus: (postId: string): Promise<any> => {
    return api.get(`/posts/${postId}/like`)
  },
  
  // 点赞评论
  likeComment: (commentId: string): Promise<any> => {
    return api.post(`/comments/${commentId}/like`)
  },
  
  // 取消点赞评论
  unlikeComment: (commentId: string): Promise<any> => {
    return api.delete(`/comments/${commentId}/like`)
  }
}

// 收藏相关 API
export const favoriteApi = {
  // 获取收藏夹
  getFolders: (): Promise<any> => {
    return api.get('/folders')
  },
  
  // 创建收藏夹
  createFolder: (data: { name: string }): Promise<any> => {
    return api.post('/folders', data)
  },
  
  // 更新收藏夹
  updateFolder: (folderId: number, data: { name: string }): Promise<any> => {
    return api.put(`/folders/${folderId}`, data)
  },

  // 删除收藏夹
  deleteFolder: (folderId: number): Promise<any> => {
    return api.delete(`/folders/${folderId}`)
  },

  // 收藏帖子
  addFavorite: (data: { post_id: string; folder_id: number }): Promise<any> => {
    return api.post('/favorites', data)
  },
  
  // 取消收藏
  removeFavorite: (postId: string): Promise<any> => {
    console.log('removeFavorite API 被调用，postId:', postId, '类型:', typeof postId)
    const url = `/posts/${postId}/favorite`
    console.log('请求 URL:', url)
    return api.delete(url)
  },
  
  // 获取帖子收藏状态
  getFavoriteStatus: (postId: string): Promise<any> => {
    return api.get(`/posts/${postId}/favorite`)
  },
  
  // 移动收藏
  moveFavorite: (postId: string, data: { folder_id: number }): Promise<any> => {
    return api.put(`/posts/${postId}/favorite`, data)
  },

  // 获取收藏列表
  getFavorites: (params: { page: number; page_size: number }): Promise<any> => {
    return api.get('/my/favorites', { params })
  },

  // 按收藏夹获取
  getFolderPosts: (folderId: number, params: { page: number; page_size: number }): Promise<any> => {
    return api.get(`/folders/${folderId}/posts`, { params })
  }
}

// 拉黑相关 API
export const blockApi = {
  // 拉黑用户
  blockUser: (userId: string): Promise<any> => {
    return api.post(`/users/${userId}/block`)
  },
  
  // 取消拉黑
  unblockUser: (userId: string): Promise<any> => {
    return api.delete(`/users/${userId}/block`)
  },
  
  // 获取拉黑列表
  getBlockedUsers: (params: { page: number; page_size: number; t?: number }): Promise<any> => {
    return api.get('/my/blocked', { params })
  }
}
