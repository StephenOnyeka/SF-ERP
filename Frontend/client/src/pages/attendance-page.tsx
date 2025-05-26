import DashboardLayout from "@/layouts/dashboard-layout";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceTable from "@/components/attendance-table";
import AttendanceStats from "@/components/attendance-stats";
import AttendanceRegularizeForm from "@/components/attendance-regularize-form";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("log");

  return (
    <DashboardLayout title="Attendance">
      <Tabs
        defaultValue="log"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="log">Attendance Log</TabsTrigger>
            <TabsTrigger value="stats">Monthly Overview</TabsTrigger>
            <TabsTrigger value="regularize">Regularize Attendance</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="log" className="space-y-6">
          <AttendanceTable />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <AttendanceStats />
        </TabsContent>

        <TabsContent value="regularize" className="space-y-6">
          <AttendanceRegularizeForm />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
