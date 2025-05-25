import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import LeaveApplicationForm from "@/components/leave-application-form";
import LeaveApplicationsTable from "@/components/leave-applications-table";
import HolidaysList from "@/components/holidays-list";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState("applications");
  
  // Get leave quotas for balance display
  const { data: leaveQuotas, isLoading: isLoadingQuotas } = useQuery<any[]>({
    queryKey: ["/api/leave-quotas"],
  });
  
  // Get leave types
  const { data: leaveTypes, isLoading: isLoadingTypes } = useQuery<any[]>({
    queryKey: ["/api/leave-types"],
  });
  
  // Process leave quotas and types to get combined data
  const leaveBalances = !isLoadingQuotas && !isLoadingTypes
    ? leaveQuotas?.map((quota: any) => {
        const leaveType = leaveTypes?.find((type: any) => type.id === quota.leaveTypeId);
        return {
          id: quota.id,
          name: leaveType?.name || "Unknown Leave",
          colorCode: leaveType?.colorCode || "#3B82F6",
          totalQuota: quota.totalQuota,
          usedQuota: quota.usedQuota,
          remainingQuota: quota.totalQuota - quota.usedQuota,
        };
      })
    : [];
  
  return (
    <DashboardLayout title="Leave Management">
      {/* Leave Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {leaveBalances?.map((balance) => (
          <Card key={balance.id} className="overflow-hidden">
            <div 
              className="px-6 py-4 border-b"
              style={{ 
                backgroundColor: `${balance.colorCode}10`,
                borderColor: `${balance.colorCode}30`
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium" style={{ color: balance.colorCode }}>
                  {balance.name}
                </h3>
                <Badge
                  style={{ 
                    backgroundColor: `${balance.colorCode}20`,
                    color: balance.colorCode
                  }}
                >
                  Annual
                </Badge>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-semibold text-gray-800">
                    {balance.remainingQuota}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">days left</span>
                </div>
                <div className="text-sm text-gray-500">
                  of <span className="font-medium">{balance.totalQuota}</span> days
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${(balance.remainingQuota / balance.totalQuota) * 100}%`,
                      backgroundColor: balance.colorCode
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Leave Applications and Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          <Card>
            <CardContent className="p-0">
              <Tabs
                defaultValue="applications"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="border-b px-6 py-3">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="applications">Leave Applications</TabsTrigger>
                    <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="applications" className="p-0">
                  <LeaveApplicationsTable />
                </TabsContent>
                
                <TabsContent value="calendar" className="p-6">
                  <div className="text-center py-20 text-gray-500">
                    Leave calendar will be implemented in a future update.
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-5 space-y-6">
          <LeaveApplicationForm />
          <HolidaysList />
        </div>
      </div>
    </DashboardLayout>
  );
}
