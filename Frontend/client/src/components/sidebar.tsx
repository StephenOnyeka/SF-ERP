import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import UserProfile from "@/components/user-profile";
import {
  Building2,
  Clock,
  Calendar,
  DollarSign,
  BarChart2,
  Settings,
  X,
} from "lucide-react";

interface SidebarProps {
  closeMobileSidebar: () => void;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  requiresRole?: string[];
  currentRole?: string;
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  onClick,
  requiresRole,
  currentRole,
}: SidebarLinkProps) {
  // If requiresRole is specified, check if currentRole is included
  const hasAccess = !requiresRole || 
    (currentRole && requiresRole.includes(currentRole));
  
  if (!hasAccess) return null;
  
  return (
    <a
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-50",
        active
          ? "border-l-3 border-primary-600 bg-primary-50 text-primary-700"
          : "text-gray-700"
      )}
      onClick={onClick}
    >
      <span className="mr-3 text-gray-500">{icon}</span>
      {label}
    </a>
  );
}

export default function Sidebar({ closeMobileSidebar }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Handle navigation with wouter
  const handleNavigation = (path: string) => {
    setLocation(path);
    closeMobileSidebar(); // Close mobile sidebar after navigation
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-primary-600" />
          <span className="font-bold text-xl text-gray-800">Sforger ERP</span>
        </div>
        <button
          onClick={closeMobileSidebar}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <nav className="p-4 space-y-1">
          <div className="pb-2 mb-2 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Main
            </p>
          </div>
          
          <SidebarLink
            href="/"
            icon={<Building2 className="h-5 w-5" />}
            label="Dashboard"
            active={location === "/" || location === ""}
            onClick={() => handleNavigation("/")}
          />
          
          <SidebarLink
            href="/attendance"
            icon={<Clock className="h-5 w-5" />}
            label="Attendance"
            active={location === "/attendance"}
            onClick={() => handleNavigation("/attendance")}
          />
          
          <SidebarLink
            href="/leave"
            icon={<Calendar className="h-5 w-5" />}
            label="Leave Management"
            active={location === "/leave"}
            onClick={() => handleNavigation("/leave")}
          />
          
          <SidebarLink
            href="/payroll"
            icon={<DollarSign className="h-5 w-5" />}
            label="Payroll"
            active={location === "/payroll"}
            onClick={() => handleNavigation("/payroll")}
            requiresRole={["admin", "hr"]}
            currentRole={user?.role}
          />
          
          <SidebarLink
            href="/reports"
            icon={<BarChart2 className="h-5 w-5" />}
            label="Reports"
            active={location === "/reports"}
            onClick={() => handleNavigation("/reports")}
            requiresRole={["admin", "hr"]}
            currentRole={user?.role}
          />
          
          <SidebarLink
            href="/admin"
            icon={<Settings className="h-5 w-5" />}
            label="Admin Panel"
            active={location === "/admin"}
            onClick={() => handleNavigation("/admin")}
            requiresRole={["admin"]}
            currentRole={user?.role}
          />
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <UserProfile />
      </div>
    </div>
  );
}
