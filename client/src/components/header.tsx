import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [pageTitle, setPageTitle] = useState<string>("Dashboard");

  useEffect(() => {
    // Set page title based on current location
    switch (location) {
      case "/":
        setPageTitle("Dashboard");
        break;
      case "/attendance":
        setPageTitle("Attendance");
        break;
      case "/leave-management":
        setPageTitle("Leave Management");
        break;
      case "/payroll":
        setPageTitle("Payroll");
        break;
      case "/employees":
        setPageTitle("Employees");
        break;
      case "/reports":
        setPageTitle("Reports");
        break;
      case "/settings":
        setPageTitle("Settings");
        break;
      case "/future-modules":
        setPageTitle("Future Modules");
        break;
      default:
        setPageTitle("Dashboard");
    }
  }, [location]);

  return (
    <header className="bg-white shadow-sm z-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onOpenSidebar} 
            className="mr-2 lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          
          <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback className="bg-primary text-white text-xs">
                {user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{user?.fullName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
