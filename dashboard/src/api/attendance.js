import client from './client'

export const getTodayAttendanceApi = () =>
  client.get('/api/attendance/today')

export const getUserAttendanceApi = (id, limit = 20, offset = 0) =>
  client.get(`/api/attendance/user/${id}?limit=${limit}&offset=${offset}`)

export const getAttendanceListApi = (params = {}) =>
  client.get('/api/attendance', { params })

export const getAttendanceEmployeesApi = () =>
  client.get('/api/attendance/employees')

export const getAttendanceStatusApi = (employeeId) =>
  client.get(`/api/attendance/status/${employeeId}`)
