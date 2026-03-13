import axios from 'axios'
import { tokenManager } from '../utils/auth'

// 自定义JSON解析器，处理大数字精度问题
function parseJSON(jsonString: string): any {
  // 先解析原始JSON
  const originalData = JSON.parse(jsonString)
  
  // 递归处理数据
  function processData(data: any): any {
    if (data === null || typeof data !== 'object') {
      return data
    }
    
    if (Array.isArray(data)) {
      return data.map(processData)
    }
    
    const processed: any = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key]
        
        // 检查是否是收藏夹相关的id
        const isFolderId = key === 'id' && (data.name !== undefined) && (data.type === 'folder') // 收藏夹有name字段且type为folder
        const isFolderRelated = key === 'folder_id' || key === 'folderId'
        
        // 转换所有id字段为字符串，避免精度丢失
        if ((key === 'id' || key.endsWith('_id')) && typeof value === 'number' && !isFolderId && !isFolderRelated) {
          processed[key] = String(value)
        } else {
          processed[key] = processData(value)
        }
      }
    }
    return processed
  }
  
  return processData(originalData)
}

// 创建 axios 实例
const api = axios.create({
  // 使用相对路径，通过 Vite 代理转发到后端
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  transformResponse: [function (data) {
    try {
      return parseJSON(data)
    } catch (e) {
      return data
    }
  }]
})

// 请求拦截器
api.interceptors.request.use(
  (config: any) => {
    const token = tokenManager.getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('发送请求:', config.method?.toUpperCase(), config.url, config.data, config.params, '是否携带token:', !!token)
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 直接返回 response.data
api.interceptors.response.use(
  (response: any) => {
    const data = response.data
    
    // 如果响应中包含 token，自动保存
    if (data && data.token) {
      tokenManager.setToken(data.token)
    }
    
    console.log('收到响应:', response.config?.url, data)
    console.log('响应状态:', response.status)
    
    // 检查响应是否包含错误信息
    if (data && data.error) {
      console.error('响应包含错误:', data.error)
      return Promise.reject({
        response: {
          data: data,
          status: response.status
        }
      })
    }
    
    return data
  },
  (error: any) => {
    console.error('请求错误:', error.response?.status, error.response?.data || error.message)
    
    // 处理 401 未授权错误
    if (error.response && error.response.status === 401) {
      tokenManager.removeToken()
    }
    
    return Promise.reject(error)
  }
)

export default api
