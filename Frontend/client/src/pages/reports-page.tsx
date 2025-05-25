import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import AttendanceReport from "@/components/attendance-report";
import LeaveReport from "@/components/leave-report";
import PayrollReport from "@/components/payroll-report";

export default function ReportsPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("attendance");
  
  // Redirect if not authorized (not admin or HR)
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "hr") {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // If employee, they should be redirected, but we'll handle that case anyway
  if (user?.role === "employee") {
    return (
      <DashboardLayout title="Reports">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              You don't have permission to access this page. Please contact your administrator for more information.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Reports & Analytics">
      <Tabs
        defaultValue="attendance"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Use TabsContent instead of custom positioning for better compatibility */}
        <TabsContent value="attendance" className="mt-2">
          <AttendanceReport />
        </TabsContent>
        
        <TabsContent value="leave" className="mt-2">
          <LeaveReport />
        </TabsContent>
        
        <TabsContent value="payroll" className="mt-2">
          <PayrollReport />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
