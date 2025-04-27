import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart2, 
  Settings, 
  LogOut, 
  LucideIcon,
  LayoutGrid
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function SidebarLink({ href, icon: Icon, children, active, onClick }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a 
        className={cn(
          "flex items-center px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 group transition-all duration-300",
          active && "bg-gray-100 text-gray-900"
        )}
        onClick={onClick}
      >
        <Icon className={cn(
          "h-5 w-5 mr-3 text-gray-500 group-hover:text-primary",
          active && "text-primary"
        )} />
        <span>{children}</span>
      </a>
    </Link>
  );
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getLinkClickHandler = () => {
    if (isMobile && onClose) {
      return onClose;
    }
    return undefined;
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr" || user?.role === "admin";

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-800">Sforger ERP</span>
        </div>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6 p-2 bg-gray-100 rounded-lg">
          <Avatar>
            <AvatarImage src={user?.profileImage || undefined} />
            <AvatarFallback className="bg-primary text-white">
              {getInitials(user?.fullName || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <SidebarLink 
            href="/" 
            icon={Home} 
            active={location === "/"} 
            onClick={getLinkClickHandler()}
          >
            Dashboard
          </SidebarLink>
          
          <SidebarLink 
            href="/attendance" 
            icon={Clock} 
            active={location === "/attendance"} 
            onClick={getLinkClickHandler()}
          >
            Attendance
          </SidebarLink>
          
          <SidebarLink 
            href="/leave-management" 
            icon={Calendar} 
            active={location === "/leave-management"} 
            onClick={getLinkClickHandler()}
          >
            Leave Management
          </SidebarLink>
          
          <SidebarLink 
            href="/payroll" 
            icon={DollarSign} 
            active={location === "/payroll"} 
            onClick={getLinkClickHandler()}
          >
            Payroll
          </SidebarLink>
          
          {isHR && (
            <SidebarLink 
              href="/employees" 
              icon={Users} 
              active={location === "/employees"} 
              onClick={getLinkClickHandler()}
            >
              Employees
            </SidebarLink>
          )}
          
          <SidebarLink 
            href="/reports" 
            icon={BarChart2} 
            active={location === "/reports"} 
            onClick={getLinkClickHandler()}
          >
            Reports
          </SidebarLink>
          
          <SidebarLink 
            href="/future-modules" 
            icon={LayoutGrid} 
            active={location === "/future-modules"} 
            onClick={getLinkClickHandler()}
          >
            Future Modules
          </SidebarLink>
          
          {isAdmin && (
            <SidebarLink 
              href="/settings" 
              icon={Settings} 
              active={location === "/settings"} 
              onClick={getLinkClickHandler()}
            >
              Settings
            </SidebarLink>
          )}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
