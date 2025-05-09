import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getGreeting, formatDate, formatTime } from "@/lib/utils";
import Layout from "@/components/layout";
import StatCard from "@/components/stat-card";
import ActivityTable from "@/components/activity-table";
import ClockButton from "@/components/clock-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CalendarDays, FileText, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clockStatus, setClockStatus] = useState<"in" | "out" | null>(null);
  
  // Fetch today's attendance status
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ["/api/attendance", { userId: user?.id, date: new Date().toISOString().split('T')[0] }],
    enabled: !!user,
  });
  
  // Fetch leave balances
  const { data: leaveBalances, isLoading: leaveBalancesLoading } = useQuery({
    queryKey: ["/api/leave-balances", { userId: user?.id }],
    enabled: !!user,
  });
  
  // Fetch leave types for display names
  const { data: leaveTypes } = useQuery({
    queryKey: ["/api/leave-types"],
    enabled: !!user,
  });
  
  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities", { userId: user?.id, limit: 10 }],
    enabled: !!user,
  });
  
  // Fetch announcements
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ["/api/announcements"],
    enabled: !!user,
  });
  
  // Update clock status based on attendance data
  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      const todayRecord = attendanceData[0];
      if (todayRecord.timeIn && !todayRecord.timeOut) {
        setClockStatus("in");
      } else if (todayRecord.timeIn && todayRecord.timeOut) {
        setClockStatus("out");
      } else {
        setClockStatus(null);
      }
    } else {
      setClockStatus(null);
    }
  }, [attendanceData]);
  
  // Update current date/time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Get leave type name by ID
  const getLeaveTypeName = (id: number) => {
    return leaveTypes?.find(type => type.id === id)?.name || "Unknown";
  };
  
  return (
    <Layout>
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
        <div className="md:flex">
          <div className="p-6 md:flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {user?.fullName?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600 mb-4">
              {formatDate(currentDate)}
            </p>
            
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className={`w-2 h-2 ${clockStatus === "in" ? "bg-green-500" : "bg-red-500"} rounded-full mr-2`}></span>
                {clockStatus === "in" ? "Clocked In" : clockStatus === "out" ? "Clocked Out" : "Not Clocked In"}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 md:w-2/3">
              <ClockButton 
                type="in" 
                disabled={clockStatus === "in"} 
                onSuccess={() => {
                  refetchAttendance();
                  setClockStatus("in");
                }} 
              />
              <ClockButton 
                type="out" 
                disabled={clockStatus !== "in"} 
                onSuccess={() => {
                  refetchAttendance();
                  setClockStatus("out");
                }} 
              />
            </div>
            
            <div className="text-sm text-gray-500">
              {attendanceData && attendanceData.length > 0 && attendanceData[0].timeIn && (
                <span>
                  Last activity: <span className="font-medium">
                    {clockStatus === "in" 
                      ? `Clocked in at ${formatTime(attendanceData[0].timeIn)}`
                      : `Clocked out at ${formatTime(attendanceData[0].timeOut)}`
                    }
                  </span>
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-primary-50 p-6 md:w-96 flex flex-col justify-center">
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <CalendarDays className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Leave Balance</h3>
            </div>
            
            {leaveBalancesLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-center">
                {leaveBalances?.map((balance) => (
                  <div key={balance.id} className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="block text-lg font-bold text-primary-700">
                      {balance.totalDays - balance.usedDays}
                    </span>
                    <span className="text-sm text-gray-500">{getLeaveTypeName(balance.leaveTypeId)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Work Hours" 
          value="142" 
          subtitle="hours this month" 
          trend="+12%" 
          trendText="from last month" 
          icon={<Clock className="h-5 w-5 text-primary-700" />} 
          iconBg="bg-blue-100" 
        />
        
        <StatCard 
          title="Attendance" 
          value="95%" 
          subtitle="on-time rate" 
          trend="+3%" 
          trendText="from last month" 
          icon={<CheckCircle2 className="h-5 w-5 text-green-700" />} 
          iconBg="bg-green-100" 
        />
        
        <StatCard 
          title="Pending Tasks" 
          value="5" 
          subtitle="tasks pending" 
          trend="+2" 
          trendText="from yesterday" 
          trendColor="text-red-600"
          icon={<FileText className="h-5 w-5 text-yellow-700" />} 
          iconBg="bg-yellow-100" 
        />
        
        <StatCard 
          title="Leave Requests" 
          value="2" 
          subtitle="pending approval" 
          trend="No change" 
          trendText="from last week" 
          trendColor="text-gray-600"
          icon={<CalendarDays className="h-5 w-5 text-pink-700" />} 
          iconBg="bg-pink-100" 
        />
      </div>
      
      {/* Today's Schedule & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Today's Schedule</CardTitle>
              <Button variant="link" className="p-0 h-auto text-primary">View all</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="min-w-[50px] text-center">
                    <span className="block text-sm font-medium text-gray-900">9:30</span>
                    <span className="block text-xs text-gray-500">AM</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="bg-primary-50 p-3 rounded-lg border-l-4 border-primary-500">
                      <p className="text-sm font-medium text-gray-900">Team Standup Meeting</p>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="inline-flex items-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Development Team
                        </span>
                        <span className="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Conference Room A
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="min-w-[50px] text-center">
                    <span className="block text-sm font-medium text-gray-900">2:00</span>
                    <span className="block text-xs text-gray-500">PM</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
                      <p className="text-sm font-medium text-gray-900">Project Review with Client</p>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="inline-flex items-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Client Success Team
                        </span>
                        <span className="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Zoom Meeting
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Announcements</CardTitle>
              <Button variant="link" className="p-0 h-auto text-primary">View all</Button>
            </CardHeader>
            <CardContent>
              {announcementsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : announcements && announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-primary-500 pl-4 py-1">
                      <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{announcement.content}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(announcement.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No announcements at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recent Activity */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="link" className="p-0 h-auto text-primary">View all</Button>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ActivityTable activities={activities || []} />
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
