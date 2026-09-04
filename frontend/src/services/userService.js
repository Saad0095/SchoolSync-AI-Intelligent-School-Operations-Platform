import api from "@/utils/api";

export const getUsers = (params) => api.get("/auth/users", { params });
export const getUserById = (id) => api.get(`/auth/users/${id}`);
export const createCampusAdmin = (data) => api.post("/auth/register-admin", data);
export const createUser = (data) => api.post("/auth/add-user", data);
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
export const adminResetPassword = (id, newPassword) => api.put(`/auth/admin-reset-password/${id}`, { newPassword });
