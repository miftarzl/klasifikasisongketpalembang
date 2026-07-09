import { api } from './api';

export const explorerApi = {
  list: (params = {}) => api.get('/explorer', { params }),
  adminList: () => api.get('/explorer/admin'),
  get: (id) => api.get(`/explorer/${id}`),
  create: (payload) => api.post('/explorer', payload),
  update: (id, payload) => api.put(`/explorer/${id}`, payload),
  delete: (id) => api.delete(`/explorer/${id}`),
  uploadThumbnail: (formData, config = {}) => api.post('/explorer/upload/thumbnail', formData, config),
  uploadGallery: (songketId, formData, config = {}) => api.post(`/explorer/${songketId}/gallery`, formData, config),
  getGallery: (songketId) => api.get(`/explorer/${songketId}/gallery`),
  deleteGalleryImage: (imageId) => api.delete(`/explorer/gallery/${imageId}`),
  reorderGallery: (order) => api.put('/explorer/gallery/reorder', { order }),
};

export default explorerApi;
