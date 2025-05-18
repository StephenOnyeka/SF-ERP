import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import UsersTable from "@/components/users-table";
import AddUserForm from "@/components/add-user-form";
import AddHolidayForm from "@/components/add-holiday-form";
import ManageLeaveApplications from "@/components/manage-leave-applications";

export default function AdminPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // If not admin, they should be redirected, but we'll handle that case anyway
  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="Admin Panel">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              You don't have permission to access this page. Only administrators can access the admin panel.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Admin Panel">
      <Tabs
        defaultValue="users"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-auto grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="leave-approval">Leave Approval</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <UsersTable />
            </div>
            <div>
              <AddUserForm />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="holidays">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <UsersTable />
            </div>
            <div>
              <AddHolidayForm />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="leave-approval">
          <ManageLeaveApplications />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">System Settings</h3>
            <p className="text-gray-600">
              System settings configuration will be implemented in a future update.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
