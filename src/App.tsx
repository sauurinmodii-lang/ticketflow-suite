import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { seedIfNeeded } from "@/store/seedData";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TicketsPage from "@/pages/TicketsPage";
import UsersPage from "@/pages/UsersPage";
import SitesPage from "@/pages/SitesPage";
import CategoriesPage from "@/pages/CategoriesPage";
import CompanyPage from "@/pages/CompanyPage";
import RoleAccessPage from "@/pages/RoleAccessPage";
import AuditPage from "@/pages/AuditPage";
import ReportsPage from "@/pages/ReportsPage";
import GroupMasterPage from "@/pages/GroupMasterPage";
import GroupAssignPage from "@/pages/GroupAssignPage";
import NotFound from "@/pages/NotFound";

seedIfNeeded();

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function LoginGuard() {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/groups" element={<GroupMasterPage />} />
              <Route path="/group-assign" element={<GroupAssignPage />} />
              <Route path="/company" element={<CompanyPage />} />
              <Route path="/role-access" element={<RoleAccessPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
