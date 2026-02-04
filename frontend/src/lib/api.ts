const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080/backend' : '/backend')
const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lerumos'
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
      mode: 'cors', // Explicitly set CORS mode
    })
    
    // Debug: Log request details
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    })

    const data = await response.json()
    
    // Debug: Log response details
    console.log('API Response:', {
      url,
      status: response.status,
      ok: response.ok,
      success: data.success,
      error: data.error,
      hasData: !!data.data,
      dataType: data.data ? (Array.isArray(data.data) ? `Array(${data.data.length})` : typeof data.data) : 'None'
    })

    if (!response.ok || !data.success) {
      console.error('API Error:', data.error || data.message || 'Request failed')
      throw new Error(data.error || data.message || 'Request failed')
    }

    // Handle different response formats
    // For content.php?action=list, backend returns: {success: true, data: [...], posts: [...]}
    // Check data.posts first (explicit posts array)
    if (data.posts !== undefined && Array.isArray(data.posts)) {
      return data.posts as T
    }
    // Check data.data if it's an array (for list endpoints)
    if (data.data !== undefined && Array.isArray(data.data)) {
      return data.data as T
    }
    // Check for nested data.user structure (backend returns data: { user: {...} })
    if (data.data?.user !== undefined) {
      return data.data.user as T
    }
    // Check for single data object
    if (data.data !== undefined && !Array.isArray(data.data)) {
      return data.data as T
    }
    if (data.user !== undefined) {
      return data.user as T
    }
    if (data.post !== undefined) {
      return data.post as T
    }
    
    return data as T
  }

  // Auth endpoints
  async signup(userData: {
    username: string
    email: string
    password: string
    displayName: string
    party: string
    bio?: string
  }) {
    const response = await this.request<any>(
      '/auth.php?action=signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.displayName,
          username: userData.username,
          party: userData.party,
          bio: userData.bio,
        }),
      }
    )
    // Response is already the user object after request() processing
    return response
  }

  async login(email: string, password: string) {
    const response = await this.request<any>(
      '/auth.php?action=login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )
    // Response is already the user object after request() processing
    return response
  }

  async logout() {
    return this.request('/auth.php?action=logout', { method: 'POST' })
  }

  async getCurrentUser() {
    const response = await this.request<any>('/auth.php?action=me')
    // Response is already the user object after request() processing
    return response
  }

  // Content endpoints
  async getPosts(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams()
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.offset) query.append('offset', params.offset.toString())
    
    return this.request<any[]>(
      `/content.php?action=list${query.toString() ? '&' + query.toString() : ''}`
    )
  }

  async getPost(id: number) {
    return this.request<any>(`/content.php?action=get&id=${id}`)
  }

  async createPost(postData: {
    content: string
    media_url?: string
    media_type?: string
    type?: string
    party?: string
  }) {
    return this.request<any>('/content.php?action=create', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  async likePost(postId: number) {
    return this.request<any>(`/content.php?action=like&id=${postId}`, {
      method: 'POST',
    })
  }

  async commentPost(postId: number, content: string) {
    return this.request<any>(`/content.php?action=comment&id=${postId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  // Social endpoints
  async followUser(userId: number) {
    return this.request<any>(`/social.php?action=follow&user_id=${userId}`, {
      method: 'POST',
    })
  }

  async unfollowUser(userId: number) {
    return this.request<any>(`/social.php?action=unfollow&user_id=${userId}`, {
      method: 'POST',
    })
  }

  async getFollowers(userId?: number) {
    const url = userId 
      ? `/social.php?action=followers&user_id=${userId}`
      : `/social.php?action=followers`
    return this.request<any[]>(url)
  }

  async getFollowing(userId?: number) {
    const url = userId 
      ? `/social.php?action=following&user_id=${userId}`
      : `/social.php?action=following`
    return this.request<any[]>(url)
  }

  // Messages endpoints
  async getMessages(userId?: number) {
    const query = userId ? `?user_id=${userId}` : ''
    return this.request<any[]>(`/messages.php?action=list${query}`)
  }

  async sendMessage(userId: number, content: string) {
    return this.request<any>('/messages.php?action=send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, content }),
    })
  }

  // Search endpoints
  async search(query: string, type?: string) {
    const params = new URLSearchParams({ q: query })
    if (type) params.append('type', type)
    return this.request<any[]>(`/search.php?${params.toString()}`)
  }

  // Upload endpoints
  async uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/upload.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  }

  // Payments endpoints
  async processPayment(paymentData: {
    amount: number
    payment_method: string
    description?: string
  }) {
    return this.request<any>('/payments.php', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  // Admin endpoints
  async getAnalytics() {
    return this.request<any>('/analytics.php')
  }

  async getAdminData() {
    return this.request<any>('/admin.php')
  }

  // Settings endpoints
  async getSiteSettings() {
    return this.request<any>('/settings.php?action=get')
  }

  async saveSiteSettings(settings: any) {
    return this.request<any>('/settings.php?action=set', {
      method: 'POST',
      body: JSON.stringify({
        key: 'siteSettings',
        value: settings
      }),
    })
  }

  async isSetupComplete() {
    const response = await this.request<{ isSetupComplete: boolean }>('/settings.php?action=isSetupComplete')
    return response.isSetupComplete || false
  }
}

export const api = new ApiService()
export default api

