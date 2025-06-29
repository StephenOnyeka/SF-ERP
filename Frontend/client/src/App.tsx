import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, Redirect } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/use-auth";

// Pages
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AttendancePage from "@/pages/attendance-page";
import LeavePage from "@/pages/leave-page";
import PayrollPage from "@/pages/payroll-page";
import ReportsPage from "@/pages/reports-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";

function RootRedirect() {
  const { user } = useAuth();
  return user ? <Redirect to="/dashboard" /> : <Redirect to="/auth" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/attendance" component={AttendancePage} />
      <ProtectedRoute path="/leave" component={LeavePage} />
      <ProtectedRoute path="/payroll" component={PayrollPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
