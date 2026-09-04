import api from "@/utils/api";

export const getOverviewStats = (params) => api.get("/dashboard/getOverview", { params });
export const getTopPerformers = (params) => api.get("/dashboard/getTopPerformers", { params });
export const getDropRatio = (params) => api.get("/dashboard/getDropRatio", { params });
export const getCampusComparison = () => api.get("/dashboard/super-admin/getCampusComparison");

export const getTeacherOverview = () => api.get("/dashboard/teacher/overview");
export const getTeacherClassPerformance = (params) => api.get("/dashboard/teacher/class-performance", { params });
export const getTeacherAttendanceOverview = (params) => api.get("/dashboard/teacher/attendance-overview", { params });
export const getTeacherQuickStats = () => api.get("/dashboard/teacher/quick-stats");
