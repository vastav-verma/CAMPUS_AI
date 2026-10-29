import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Join from "./pages/Join";
import Unauthorized from "./pages/Unauthorized";

import Chat from "./pages/Chat";
import StudentComplaints from "./pages/StudentComplaints";
import StaffDashboard from "./pages/StaffDashboard";
import Notifications from "./pages/Notifications";

import AdminOverview from "./pages/AdminOverview";
import AdminComplaints from "./pages/AdminComplaints";
import AdminPeople from "./pages/AdminPeople";
import AdminKnowledge from "./pages/AdminKnowledge";
import AdminSettings from "./pages/AdminSettings";
import AdminBilling from "./pages/AdminBilling";

import SuperAdminColleges from "./pages/SuperAdminColleges";

const guard = (roles, element) => (
    <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
);

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <ToastProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/join/:token" element={<Join />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Signed-in app (sidebar layout) */}
                    <Route element={guard(null, <AppLayout />)}>
                        {/* Everyone except the platform owner */}
                        <Route path="/chat" element={guard(["student", "staff", "college_admin"], <Chat />)} />
                        <Route path="/notifications" element={guard(["student", "staff", "college_admin"], <Notifications />)} />

                        {/* Student */}
                        <Route path="/complaints" element={guard(["student"], <StudentComplaints />)} />

                        {/* Staff */}
                        <Route path="/staff" element={guard(["staff"], <StaffDashboard />)} />

                        {/* College admin */}
                        <Route path="/admin" element={guard(["college_admin"], <AdminOverview />)} />
                        <Route path="/admin/complaints" element={guard(["college_admin"], <AdminComplaints />)} />
                        <Route path="/admin/people" element={guard(["college_admin"], <AdminPeople />)} />
                        <Route path="/admin/knowledge" element={guard(["college_admin"], <AdminKnowledge />)} />
                        <Route path="/admin/settings" element={guard(["college_admin"], <AdminSettings />)} />
                        <Route path="/admin/billing" element={guard(["college_admin"], <AdminBilling />)} />

                        {/* Platform owner */}
                        <Route path="/super-admin" element={guard(["super_admin"], <SuperAdminColleges />)} />
                    </Route>

                    {/* Legacy URLs */}
                    <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
                    <Route path="/admin/overview" element={<Navigate to="/admin" replace />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ToastProvider>
        </AuthProvider>
    </BrowserRouter>
);

export default App;
