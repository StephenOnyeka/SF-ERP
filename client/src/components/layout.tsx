import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "./sidebar";
import Header from "./header";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute, Redirect } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Close sidebar on route change on mobile devices
    setIsSidebarOpen(false);
  }, [location]);

  // Check page access based on user role
  const canAccessEmployees = user?.role === "admin" || user?.role === "hr";
  const canAccessSettings = user?.role === "admin";
  
  // Handle restricted page access
  const [isEmployeesPage] = useRoute("/employees");
  const [isSettingsPage] = useRoute("/settings");
  
  if ((isEmployeesPage && !canAccessEmployees) || (isSettingsPage && !canAccessSettings)) {
    toast({
      title: "Access Restricted",
      description: "You don't have permission to access this page",
      variant: "destructive"
    });
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-0`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-300">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
