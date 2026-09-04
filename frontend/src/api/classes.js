import api from '../utils/api'


export const getClasses = () => api.get('/classes?limit=10')
export const getClassById = (id) => api.get(`/classes/${id}`)
export const createClass = (payload) => api.post('/classes', payload)
export const updateClass = (id, payload) => api.put(`/classes/${id}`, payload)