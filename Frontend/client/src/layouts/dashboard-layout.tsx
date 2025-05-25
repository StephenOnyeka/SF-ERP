import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("");
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  useEffect(() => {
    // Set current date
    setCurrentDate(format(new Date(), "MMMM d, yyyy"));
  }, []);
  
  // Close mobile sidebar when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  if (!user) {
    setLocation("/auth");
    return null;
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-gray-900/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 z-20 ${
          isMobileSidebarOpen ? "transform-none" : "-translate-x-full md:translate-x-0"
        } transition-transform duration-300 ease-in-out w-64 h-screen flex-shrink-0 bg-white shadow-md md:relative`}
      >
        <Sidebar closeMobileSidebar={() => setIsMobileSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <Button
                onClick={() => setIsMobileSidebarOpen(true)}
                size="icon"
                variant="ghost"
                className="md:hidden mr-2"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button size="icon" variant="ghost">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute top-0 right-0 h-2 w-2 p-0" variant="destructive" />
                </Button>
              </div>
              
              <div className="text-sm text-gray-800">
                <span>{currentDate}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
