import axios from 'axios'

// API基础配置
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API请求错误:', error)
    
    // 统一错误处理
    if (error.response) {
      // 服务器响应错误
      const message = error.response.data?.error || '服务器响应错误'
      throw new Error(message)
    } else if (error.request) {
      // 网络错误
      throw new Error('网络连接失败，请检查网络设置')
    } else {
      // 其他错误
      throw new Error('请求配置错误')
    }
  }
)

// 星座相关API
export const horoscopeApi = {
  // 获取所有星座
  getSigns: () => api.get('/horoscope/signs'),
  
  // 获取星座基本信息
  getSignInfo: (sign: string) => api.get(`/horoscope/${sign}`),
  
  // 获取每日运势
  getDaily: (sign: string, date?: string) => 
    api.get(`/horoscope/${sign}/daily${date ? `?date=${date}` : ''}`),
  
  // 获取每周运势
  getWeekly: (sign: string, week?: number, year?: number) => 
    api.get(`/horoscope/${sign}/weekly${week ? `?week=${week}${year ? `&year=${year}` : ''}` : ''}`),
  
  // 获取每月运势
  getMonthly: (sign: string, month?: number, year?: number) => 
    api.get(`/horoscope/${sign}/monthly${month ? `?month=${month}${year ? `&year=${year}` : ''}` : ''}`),
  
  // 获取年度运势
  getYearly: (sign: string, year?: number) => 
    api.get(`/horoscope/${sign}/yearly${year ? `?year=${year}` : ''}`),
  
  // 获取星座AI分析
  getAnalysis: (sign: string, data: { question?: string; birthInfo?: any }) => 
    api.post(`/horoscope/${sign}/analysis`, data),
  
  // 获取星座兼容性
  getCompatibility: (sign1: string, sign2: string) => 
    api.get(`/horoscope/compatibility/${sign1}/${sign2}`),
}

// 健康检查API
export const healthApi = {
  getStatus: () => api.get('/health'),
  getServicesStatus: () => api.get('/health/services'),
}

export default api