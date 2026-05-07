import client from './client'

export const getUsersApi = () =>
  client.get('/api/users')

export const getUserByIdApi = (id) =>
  client.get(`/api/users/${id}`)
