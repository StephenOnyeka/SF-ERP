import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useLeaveStore } from "@/stores/leave-store";
import { useLeaveMetadataStore } from "@/stores/leave-metadata-store";
import { useUserScopedData } from "@/hooks/useUserScopedData";

export default function LeaveApplicationsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const {leaves: leaveApplications} = useUserScopedData()
  const leaveTypes = useLeaveMetadataStore((state) => state.leaveTypes);

  const totalItems = leaveApplications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = leaveApplications
    .slice()
    .sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    )
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLeaveTypeName = (leaveTypeId: number) => {
    const leaveType = leaveTypes.find((type) => type.id === leaveTypeId);
    return leaveType ? leaveType.name : "Unknown";
  };

  const formatDateRange = (
    startDate: string | Date,
    endDate: string | Date,
    totalDays: number
  ) => {
    console.log(typeof startDate, startDate, "startDate");
    const start =
      typeof startDate === "string" ? parseISO(startDate) : new Date(startDate);
    const end =
      typeof endDate === "string" ? parseISO(endDate) : new Date(endDate);

    return (
      <>
        <span className="text-sm text-gray-600">
          {format(start, "MMM d")} - {format(end, "MMM d, yyyy")}
        </span>
        <span className="block text-xs text-gray-500">({totalDays} days)</span>
      </>
    );
  };

  if (!leaveApplications || !leaveTypes) {
    return (
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-800">
          Your Leave Requests
        </h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {paginatedData.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {getLeaveTypeName(application.leaveTypeId)}
                    </TableCell>
                    <TableCell>
                      {formatDateRange(
                        application.startDate,
                        application.endDate,
                        application.totalDays
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {application.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(
                        typeof application.appliedAt === "string"
                          ? parseISO(application.appliedAt)
                          : new Date(application.appliedAt),
                        "MMM d, yyyy"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-end mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      isActive={currentPage > 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 3) }).map(
                    (_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pageNumber === currentPage}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  )}

                  {totalPages > 3 && (
                    <PaginationItem>
                      <span className="px-4 py-2">...</span>
                    </PaginationItem>
                  )}

                  {totalPages > 3 && (
                    <PaginationItem>
                      <PaginationLink
                        isActive={totalPages === currentPage}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      isActive={currentPage < totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No leave applications found</p>
          <p className="text-sm mt-1">
            Apply for leave using the form on the right
          </p>
        </div>
      )}
    </div>
  );
}
