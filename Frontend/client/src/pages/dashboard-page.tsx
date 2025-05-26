import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Building2, Clock, CalendarDays, FileText, Settings } from "lucide-react";

import AttendanceStatus from "@/components/attendance-status";
import LeaveBalanceCard from "@/components/leave-balance-card";
import ActivityFeed from "@/components/activity-feed";
import QuickLinks from "@/components/quick-links";

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
    
    // Update date and time every minute
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Welcome, {user?.firstName}!
              </h2>
              <p className="text-gray-600 mt-1">{greeting}! Have a productive day!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today is</p>
              <p className="text-base font-medium text-gray-800">
                {format(currentDateTime, "EEEE, MMMM d")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Attendance Card */}
        <div className="lg:col-span-1">
          <AttendanceStatus />
        </div>

        {/* Leave Balance Card */}
        <div className="lg:col-span-1">
          <LeaveBalanceCard />
        </div>

        {/* Recent Activity Card */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>

        {/* Quick Links Card */}
        <div className="lg:col-span-1">
          <QuickLinks />
        </div>
      </div>
    </DashboardLayout>
  );
}
