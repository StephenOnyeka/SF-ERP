import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default function AttendanceStats() {
  // Get current month date range
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(today);
  
  // Query attendance data for current month
  const { data: attendanceData, isLoading } = useQuery<any[]>({
    queryKey: [
      "/api/attendance", 
      `startDate=${startDate.toISOString()}`,
      `endDate=${endDate.toISOString()}`
    ],
  });
  
  // Calculate statistics
  const calculateStats = () => {
    if (!attendanceData) return null;
    
    const totalWorkingDays = 22; // Assuming 22 working days in a month
    const presentDays = attendanceData.filter(a => a.status === "present").length;
    const halfDays = attendanceData.filter(a => a.status === "half-day").length;
    const leaveDays = attendanceData.filter(a => a.status === "leave").length;
    const lateDays = attendanceData.filter(a => {
      if (!a.checkInTime) return false;
      
      const [hours, minutes] = a.checkInTime.split(":");
      const checkInHour = parseInt(hours);
      const checkInMinute = parseInt(minutes);
      
      // Consider late if checked in after 9:30 AM
      return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);
    }).length;
    
    // Calculate total working hours
    let totalMinutes = 0;
    attendanceData.forEach(a => {
      if (a.workingHours) {
        // Parse working hours format "Xh Ym"
        const match = a.workingHours.match(/(\d+)h\s+(\d+)m/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          totalMinutes += (hours * 60) + minutes;
        }
      }
    });
    
    const avgHoursPerDay = presentDays > 0 
      ? Math.floor(totalMinutes / presentDays / 60) 
      : 0;
      
    const avgMinutesPerDay = presentDays > 0 
      ? Math.floor((totalMinutes / presentDays) % 60) 
      : 0;
    
    // Calculate attendance ratio
    const attendanceRatio = Math.round((presentDays / totalWorkingDays) * 100);
    
    return {
      presentDays,
      leaveDays,
      lateDays,
      avgWorkingHours: `${avgHoursPerDay}h ${avgMinutesPerDay}m`,
      attendanceRatio,
      totalWorkingDays
    };
  };
  
  const stats = calculateStats();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border rounded-md p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-2.5 w-full mb-1" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview - {format(today, 'MMMM yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Present Days</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.presentDays || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                / {stats?.totalWorkingDays || 22} days
              </span>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Leave Days</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.leaveDays || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                / {stats?.totalWorkingDays || 22} days
              </span>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Late Arrivals</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.lateDays || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">days</span>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Average Work Hours</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.avgWorkingHours || "0h 0m"}
              </span>
              <span className="ml-2 text-sm text-gray-500">hours/day</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Ratio</h4>
          <Progress 
            value={stats?.attendanceRatio || 0} 
            className="h-2.5 bg-gray-200 mb-1" 
          />
          <div className="flex text-xs justify-between">
            <span className="text-gray-500">
              Present: {stats?.attendanceRatio || 0}%
            </span>
            <span className="text-gray-500">Target: 90%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
