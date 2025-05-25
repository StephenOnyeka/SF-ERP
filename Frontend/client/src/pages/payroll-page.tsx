import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import PayrollTable from "@/components/payroll-table";

export default function PayrollPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect if not authorized (not admin or HR)
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "hr") {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // If employee, they should be redirected, but we'll handle that case anyway
  if (user?.role === "employee") {
    return (
      <DashboardLayout title="Payroll">
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
    <DashboardLayout title="Payroll Management">
      <PayrollTable />
    </DashboardLayout>
  );
}
