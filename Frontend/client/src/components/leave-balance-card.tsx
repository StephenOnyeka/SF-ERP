import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaveTypeWithBalance {
  id: number;
  name: string;
  colorCode: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  percentRemaining: number;
}

export default function LeaveBalanceCard() {
  const { data: leaveQuotas, isLoading } = useQuery<any>({
    queryKey: ["/api/leave-quotas"],
  });
  
  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } = useQuery<any>({
    queryKey: ["/api/leave-types"],
  });
  
  if (isLoading || isLoadingLeaveTypes) {
    return (
      <Card>
        <CardHeader className="border-b px-6 py-3">
          <CardTitle className="text-base font-medium">Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Process leave quotas and types to get combined data
  const leaveBalances: LeaveTypeWithBalance[] = leaveQuotas?.map((quota: any) => {
    const leaveType = leaveTypes?.find((type: any) => type.id === quota.leaveTypeId);
    const remainingQuota = quota.totalQuota - quota.usedQuota;
    const percentRemaining = (remainingQuota / quota.totalQuota) * 100;
    
    return {
      id: quota.id,
      name: leaveType?.name || "Unknown Leave",
      colorCode: leaveType?.colorCode || "#3B82F6",
      totalQuota: quota.totalQuota,
      usedQuota: quota.usedQuota,
      remainingQuota,
      percentRemaining,
    };
  });
  
  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {leaveBalances?.map((leaveBalance) => (
            <div key={leaveBalance.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {leaveBalance.name}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {leaveBalance.remainingQuota} of {leaveBalance.totalQuota} days left
                </span>
              </div>
              <Progress
                value={leaveBalance.percentRemaining}
                className="h-2.5 bg-gray-200"
                indicatorClassName={`bg-[${leaveBalance.colorCode}]`}
              />
            </div>
          ))}
          
          <div className="mt-5 text-center">
            <a 
              href="/leave" 
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Apply for Leave
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
