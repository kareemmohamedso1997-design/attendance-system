import axios from 'axios'
import client from './client'
import { getRefreshToken } from '../utils/authStorage'

const BASE_URL = 'https://attendance-system-1-02ay.onrender.com'

export const loginApi = (username, password) =>
  client.post('/api/auth/login', { username, password })

export const getMeApi = () =>
  client.get('/api/auth/me')

// Send the stored refresh token so the server can revoke it.
export const logoutApi = () =>
  client.post('/api/auth/logout', { refreshToken: getRefreshToken() })

export const addEmployeeApi    = (data) => client.post('/api/auth/employees', data)
export const getAllEmployeesApi = ()     => client.get('/api/auth/employees')
export const deleteEmployeeApi = (id)   => client.delete(`/api/auth/employees/${id}`)

// Raw axios (no interceptors) — only used by tokenRefresh.js internally.
// Exported here so tests can stub it without touching the main client.
export const refreshTokenApi = (refreshToken) =>
  axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
