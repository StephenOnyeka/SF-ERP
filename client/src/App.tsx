import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Attendance from "@/pages/attendance";
import LeaveManagement from "@/pages/leave-management";
import Payroll from "@/pages/payroll";
import Employees from "@/pages/employees";
import Settings from "@/pages/settings";
import Reports from "@/pages/reports";
import FutureModules from "@/pages/future-modules";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/leave-management" component={LeaveManagement} />
      <ProtectedRoute path="/payroll" component={Payroll} />
      <ProtectedRoute path="/employees" component={Employees} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/future-modules" component={FutureModules} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
