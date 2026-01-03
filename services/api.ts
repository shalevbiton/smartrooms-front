const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Users API
export const usersApi = {
  getAll: () => apiRequest('/api/users'),
  getById: (id: string) => apiRequest(`/api/users/${id}`),
  create: (user: any) => apiRequest('/api/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id: string, data: any) => apiRequest(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
};

// Rooms API
export const roomsApi = {
  getAll: () => apiRequest('/api/rooms'),
  getById: (id: string) => apiRequest(`/api/rooms/${id}`),
  create: (room: any) => apiRequest('/api/rooms', { method: 'POST', body: JSON.stringify(room) }),
  update: (id: string, data: any) => apiRequest(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/api/rooms/${id}`, { method: 'DELETE' }),
};

// Bookings API
export const bookingsApi = {
  getAll: () => apiRequest('/api/bookings'),
  getById: (id: string) => apiRequest(`/api/bookings/${id}`),
  create: (booking: any) => apiRequest('/api/bookings', { method: 'POST', body: JSON.stringify(booking) }),
  update: (id: string, data: any) => apiRequest(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/api/bookings/${id}`, { method: 'DELETE' }),
};

