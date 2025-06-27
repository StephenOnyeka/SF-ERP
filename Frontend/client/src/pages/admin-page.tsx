import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTable from "@/components/users-table";
import AddUserForm from "@/components/add-user-form";
import AddHolidayForm from "@/components/add-holiday-form";
import ManageLeaveApplications from "@/components/manage-leave-applications";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import HolidayTable from "@/components/holidays-table";

export default function AdminPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await adminApi.getSettings();
        setSettings(response.data);
      } catch (error) {
        toast.error("Failed to load system settings");
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchSettings();
    }
  }, [user]);

  // If not admin, they should be redirected, but we'll handle that case anyway
  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="Admin Panel">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              You don't have permission to access this page. Only administrators
              can access the admin panel.
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
              <HolidayTable />
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
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">System Settings</h3>
              {settings && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Working Hours</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={settings.workingHours.start}
                          onChange={(e) => {
                            const newSettings = {
                              ...settings,
                              workingHours: {
                                ...settings.workingHours,
                                start: e.target.value,
                              },
                            };
                            setSettings(newSettings);
                            adminApi
                              .updateSettings(newSettings)
                              .then(() => toast.success("Settings updated"))
                              .catch(() =>
                                toast.error("Failed to update settings")
                              );
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={settings.workingHours.end}
                          onChange={(e) => {
                            const newSettings = {
                              ...settings,
                              workingHours: {
                                ...settings.workingHours,
                                end: e.target.value,
                              },
                            };
                            setSettings(newSettings);
                            adminApi
                              .updateSettings(newSettings)
                              .then(() => toast.success("Settings updated"))
                              .catch(() =>
                                toast.error("Failed to update settings")
                              );
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
