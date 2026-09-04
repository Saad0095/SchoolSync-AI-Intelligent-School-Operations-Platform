import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import StudentMarksheet from "./pages/marksheet/StudentMarksheet";
import AddScores from "./pages/exams/AddScores";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import { Toaster } from "@/components/ui/sonner";
import Campus from "./pages/campuses/Campus";
import CampusDetails from "./pages/campuses/CampusDetails";
import AddCampus from "./pages/campuses/AddCampus";
import Class from "./pages/classes/Class";
import ClassDetails from "./pages/classes/ClassDetails";
import Attendance from "./pages/attendance/Attendance";
import MyAttendance from "./pages/attendance/MyAttendance";
import TeacherAttendance from "./pages/attendance/TeacherAttendance";
import Users from "./pages/users/Users";
import Teachers from "./pages/teachers/Teachers";
import Students from "./pages/students/Students";
import Subjects from "./pages/subjects/Subjects";
import Exams from "./pages/exams/Exams";
import AIAssistant from "./pages/ai/AIAssistant";
import CommunicationCenter from "./pages/ai/CommunicationCenter";
import Profile from "./pages/profile/Profile";
import Notifications from "./pages/notifications/Notifications";
import FeeManagement from "./pages/fees/FeeManagement";
import StudentFees from "./pages/fees/StudentFees";
import ParentDashboard from "./pages/dashboard/ParentDashboard";

const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="school-mgmt-theme">
      <AuthProvider>
        <Toaster />
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Super & Campus Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["super-admin", "campus-admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="campuses" element={<Campus/>} />
          <Route path="campuses/add" element={<AddCampus />} />
          <Route path="campuses/:id" element={<CampusDetails/>} />
          <Route path="users" element={<Users />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="students" element={<Students />} />
          <Route path="classes" element={<Class />} />
          <Route path="classes/:id" element={<ClassDetails />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="exams" element={<Exams />} />
          <Route path="marksheets" element={<StudentMarksheet />} />
          <Route path="teacher-attendance" element={<TeacherAttendance />} />
          <Route path="communications" element={<CommunicationCenter />} />
          <Route
            path="fees"
            element={
              <ProtectedRoute allowedRoles={["campus-admin"]}>
                <FeeManagement />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Teacher */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<Attendance/>} />
          <Route path="my-attendance" element={<TeacherAttendance />} />
          <Route path="exams" element={<Exams />} />
          <Route path="marks" element={<AddScores/>} />
          <Route path="marksheets" element={<StudentMarksheet />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="my-marksheets" element={<StudentMarksheet />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Parent */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
