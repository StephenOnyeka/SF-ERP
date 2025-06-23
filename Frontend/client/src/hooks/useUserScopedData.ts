import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';
import { useLeaveStore } from '@/stores/leave-store';
import { useSalaryStore } from '@/stores/salary-store';

export const useUserScopedData = () => {
  const user = useAuthStore((s) => s.user)!;
  const attendance = useAttendanceStore((s) => s.attendanceRecords);
  const leaves = useLeaveStore((s) => s.leaveApplications);
  const quotas = useLeaveStore((s) => s.leaveQuotas);
  const salary =  useSalaryStore((s) => s.salaryRecords)

  const userAttendance = attendance.filter((rec) => rec.userId === user.id);
  const userLeaves = leaves.filter((rec) => rec.userId === user.id);
  const userQuotas = quotas.filter((rec) => rec.userId === user.id);
  const salaryRecords = salary.filter((rec) => rec.userId === user.id)

  return {
    user,
    attendance: userAttendance,
    leaves: userLeaves,
    quotas: userQuotas,
    salary: salaryRecords
  };
};
