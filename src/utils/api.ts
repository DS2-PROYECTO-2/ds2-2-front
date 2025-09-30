const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = {
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify(errorData))
    }
    
    return response.json()
  }
}