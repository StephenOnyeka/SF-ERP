import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveStore } from "@/stores/leave-store"; // adjust the path as needed
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useLeaveMetadataStore } from "@/stores/leave-metadata-store";

export default function LeaveBalanceCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const getQuotas = useLeaveStore((state) => state.getLeaveQuotasForUser);
  const getUsed = useLeaveStore((state) => state.getUsedQuotaByTypeForUser);

  const { getLeaveTypeById } = useLeaveMetadataStore();

  const [balances, setBalances] = useState<
    {
      id: string;
      name: string;
      colorCode: string;
      totalQuota: number;
      usedQuota: number;
      remainingQuota: number;
      percentRemaining: number;
    }[]
  >([]);

  useEffect(() => {
    if (!user?.id) return;

    const quotas = getQuotas(user.id);
    const used = getUsed(user.id);

    const merged = quotas.map((quota) => {
      const leaveType = getLeaveTypeById(quota.leaveTypeId);
      const usedAmount =
        used.find((u) => u.leaveTypeId === quota.leaveTypeId)?.usedQuota || 0;
      const remaining = quota.totalQuota - usedAmount;
      const percentRemaining = (remaining / quota.totalQuota) * 100;

      return {
        id: quota.id!,
        name: leaveType?.name || "Unknown Leave",
        colorCode: leaveType?.colorCode || "#3B82F6",
        totalQuota: quota.totalQuota,
        usedQuota: usedAmount,
        remainingQuota: remaining,
        percentRemaining,
      };
    });

    setBalances(merged);
    setLoading(false);
  }, [user?.id, getQuotas, getUsed, getLeaveTypeById]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="border-b px-6 py-3">
          <CardTitle className="text-base font-medium">Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {balances.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {item.name}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {item.remainingQuota} of {item.totalQuota} days left
                </span>
              </div>
              <Progress
                value={item.percentRemaining}
                className="h-2.5 bg-gray-200"
                // indicatorClassName=""
                style={
                  {
                    // override Tailwind class with inline style
                    "--tw-bg-opacity": "1",
                    backgroundColor: item.colorCode,
                  } as React.CSSProperties
                }
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
