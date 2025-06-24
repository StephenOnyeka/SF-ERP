import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAttendanceStore } from "@/stores/attendance-store"; // Adjust path if needed
import { useUserScopedData } from "@/hooks/useUserScopedData";

export default function AttendanceStatus() {
  const [currentTime, setCurrentTime] = useState<string>(
    format(new Date(), "h:mm a")
  );
  const { toast } = useToast();
  const { user } = useUserScopedData();

  const { checkIn, checkOut, getTodaysAttendance } = useAttendanceStore();
  const todayAttendance = user ? getTodaysAttendance(user.id!) : undefined;

  const hasCheckedIn = !!todayAttendance?.checkInTime;
  const hasCheckedOut = !!todayAttendance?.checkOutTime;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), "h:mm a"));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = () => {
    if (user) {
      checkIn(user.id!);
      toast({
        title: "Checked in successfully",
        description: `You clocked in at ${format(new Date(), "h:mm a")}`,
      });
    }
  };

  const handleCheckOut = () => {
    if (user) {
      checkOut(user.id!);

      toast({
        title: "Checked out successfully",
        description: `You clocked out at ${format(new Date(), "h:mm a")}`,
      });
    }
  };

  const formatTime = (isoString: string | undefined) => {
    if (!isoString) return "";
    return format(new Date(isoString), "h:mm a");
  };

  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Attendance</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary-100 flex items-center justify-center mb-4">
            <div className="text-center">
              <span className="block text-3xl font-semibold text-primary-600">
                {currentTime.split(" ")[0]}
              </span>
              <span className="text-sm text-gray-500">
                {currentTime.split(" ")[1]}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Status: {hasCheckedIn ? (
              hasCheckedOut ? (
                <span className="font-medium text-blue-600">
                  Checked Out ({formatTime(todayAttendance?.checkOutTime)})
                </span>
              ) : (
                <span className="font-medium text-green-600">
                  Checked In ({formatTime(todayAttendance?.checkInTime)})
                </span>
              )
            ) : (
              <span className="font-medium text-gray-600">Not Checked In</span>
            )}
          </p>

          <div className="flex space-x-4">
            <Button onClick={handleCheckIn} disabled={hasCheckedIn}>
              Check In
            </Button>
            <Button onClick={handleCheckOut} disabled={!hasCheckedIn || hasCheckedOut} variant="outline">
              Check Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
