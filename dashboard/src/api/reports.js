import client from './client'

export const getSummaryApi = () =>
  client.get('/api/reports/summary')

export const getUserReportApi = (id) =>
  client.get(`/api/reports/user/${id}`)
