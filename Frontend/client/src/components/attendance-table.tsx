import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { useAttendanceStore } from "@/stores/attendance-store";
import { useUserScopedData } from "@/hooks/useUserScopedData";
import { useAuth } from "@/hooks/use-auth";

export default function AttendanceTable() {
    const { user, users } = useAuth();
  const [period, setPeriod] = useState("7");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const getRecordsInRange = useAttendanceStore((s) => s.getRecordsInRange);

  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(period) - 1);
  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");

  const attendanceData = (user?.role === "admin" || user?.role === "hr")
    ? useAttendanceStore
        .getState()
        .attendanceRecords
        .filter(record =>
          new Date(record.date) >= startDate &&
          new Date(record.date) <= endDate
        )
    : getRecordsInRange(user?.id!, formattedStartDate, formattedEndDate);

  useEffect(() => {
    setCurrentPage(1);
  }, [period]);

  const totalItems = attendanceData?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = attendanceData
    ? attendanceData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case "half-day":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Half-day</Badge>;
      case "weekend":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Weekend</Badge>;
      case "holiday":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Holiday</Badge>;
      case "leave":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Leave</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--";
    return format(new Date(timeString), "h:mm a");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };
  const getUserFullName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}` : "Unknown";
  };
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let pages: number[] = [];
    if (totalPages <= 3) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage === 1) {
      pages = [1, 2, 3];
    } else if (currentPage === totalPages) {
      pages = [totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [currentPage - 1, currentPage, currentPage + 1];
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} aria-disabled={currentPage <= 1} />
          </PaginationItem>
          {pages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                aria-current={pageNumber === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(pageNumber)}
                className={pageNumber === currentPage ? "font-bold" : ""}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {pages[pages.length - 1] < totalPages && (
            <>
              <PaginationItem>
                <span className="px-4 py-2">...</span>
              </PaginationItem>
              <PaginationItem key={totalPages}>
                <PaginationLink
                  onClick={() => setCurrentPage(totalPages)}
                  className={totalPages === currentPage ? "font-bold" : ""}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} aria-disabled={currentPage >= totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Attendance Log</CardTitle>
            <CardDescription>View your attendance history and status</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No attendance data available for this period.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((record) => (
                    <TableRow key={record.id}>
                       {(user?.role === "admin" || user?.role === "hr") && (
                        <TableCell>{getUserFullName(record.userId)}</TableCell>
                      )}
                      <TableCell>{formatDate(record.date.toString())}</TableCell>
                      <TableCell>{record.checkInTime ? formatTime(record.checkInTime) : "--"}</TableCell>
                      <TableCell>{record.checkOutTime ? formatTime(record.checkOutTime) : "--"}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.workingHours || "--"}</TableCell>
                      <TableCell>{record.notes || "--"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {renderPagination()}
          </>
        )}
      </CardContent>
    </Card>
  );
}
