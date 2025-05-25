import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ClipboardList, 
  FileText, 
  Settings 
} from "lucide-react";
import { Link } from "wouter";

interface QuickLink {
  href: string;
  icon: React.ReactNode;
  label: string;
  requiresRole?: string[];
}

export default function QuickLinks() {
  const { user } = useAuth();
  
  const quickLinks: QuickLink[] = [
    {
      href: "/leave",
      icon: <Calendar className="h-6 w-6 text-primary-500 mb-2" />,
      label: "Apply Leave"
    },
    {
      href: "/attendance",
      icon: <ClipboardList className="h-6 w-6 text-primary-500 mb-2" />,
      label: "Attendance Log"
    },
    {
      href: "/payroll",
      icon: <FileText className="h-6 w-6 text-primary-500 mb-2" />,
      label: "Salary Slip",
      requiresRole: ["employee", "admin", "hr"]
    },
    {
      href: "/admin",
      icon: <Settings className="h-6 w-6 text-primary-500 mb-2" />,
      label: "Settings",
      requiresRole: ["admin", "hr"]
    }
  ];
  
  // Filter links based on user role
  const filteredLinks = quickLinks.filter(link => 
    !link.requiresRole || (user?.role && link.requiresRole.includes(user.role))
  );

  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Quick Links</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredLinks.map((link, index) => (
            <Link key={index} href={link.href}>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 w-full border rounded-md hover:bg-gray-50 transition-colors"
              >
                {link.icon}
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Import useAuth at the top
import { useAuth } from "@/hooks/use-auth";
