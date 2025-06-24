import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { LeaveApplication, LeaveQuota } from "../../../shared/schema";

export type NewLeaveApplicationData = Omit<
  LeaveApplication,
  "id" | "userId" | "status" | "appliedAt"
>;

interface LeaveStoreState {
  leaveApplications: LeaveApplication[];
  leaveQuotas: LeaveQuota[];

  addLeaveApplication: (application: Omit<LeaveApplication, "id">) => void;
  updateLeaveStatus: (id: string, status: LeaveApplication["status"]) => void;
  getLeavesByUserId: (userId: string) => LeaveApplication[];
  createDefaultQuotasForUser: (userId: string) => void;
  applyForLeave: (userId: string, data: NewLeaveApplicationData,approve?: boolean) => void;
  getLeaveQuotasForUser: (userId: string) => LeaveQuota[];
  getUsedQuotaByTypeForUser: (
    userId: string
  ) => { leaveTypeId: number; usedQuota: number }[];
}

export const useLeaveStore = create<LeaveStoreState>()(
  persist(
    (set, get) => ({
      leaveApplications: [],
      leaveQuotas: [],

      addLeaveApplication: (application) => {
        const newApp: LeaveApplication = {
          ...application,
          id: uuid(), // Use UUID instead of numeric ID
        };
        set((state) => ({
          leaveApplications: [...state.leaveApplications, newApp],
        }));
      },

      createDefaultQuotasForUser: (userId: string) => {
        const defaultQuotaTemplates = [
          { leaveTypeId: 1, totalQuota: 20 },
          { leaveTypeId: 2, totalQuota: 10 },
          { leaveTypeId: 3, totalQuota: 5 },
        ];

        const currentYear = new Date().getFullYear();
        const { leaveQuotas } = get();

        const newQuotas = defaultQuotaTemplates.map((template) => ({
          id: uuid(), // UUID for LeaveQuota ID
          userId,
          leaveTypeId: template.leaveTypeId,
          totalQuota: template.totalQuota,
          usedQuota: 0,
          year: currentYear,
        }));

        set({
          leaveQuotas: [...leaveQuotas, ...newQuotas],
        });
      },

      updateLeaveStatus: (id, status) => {
        set((state) => ({
          leaveApplications: state.leaveApplications.map((app) =>
            app.id === id ? { ...app, status } : app
          ),
        }));
      },

      getLeavesByUserId: (userId) => {
        return get().leaveApplications.filter((app) => app.userId === userId);
      },

      applyForLeave: (userId, data,approve) => {
        const { leaveQuotas, leaveApplications } = get();

        const relevantQuota = leaveQuotas.find(
          (q) => q.userId === userId && q.leaveTypeId === data.leaveTypeId
        );

        if (!relevantQuota) {
          throw new Error("You do not have a quota for this leave type.");
        }

        const remainingQuota =
          relevantQuota.totalQuota - relevantQuota.usedQuota;

        if (data.totalDays > remainingQuota) {
          throw new Error(
            `Insufficient leave balance. You only have ${remainingQuota} days remaining.`
          );
        }

        const newApplication: LeaveApplication = {
          ...data,
          id: uuid(), // UUID for application ID
          userId,
          status: approve ? "approved" : "pending",
          appliedAt: new Date(),
        };

        const updatedQuotas = leaveQuotas.map((q) =>
          q.id === relevantQuota.id
            ? { ...q, usedQuota: q.usedQuota + data.totalDays }
            : q
        );

        set({
          leaveApplications: [...leaveApplications, newApplication],
          leaveQuotas: updatedQuotas,
        });
      },

      getLeaveQuotasForUser: (userId) => {
        return get().leaveQuotas.filter((quota) => quota.userId === userId);
      },

      getUsedQuotaByTypeForUser: (userId) => {
        const userApps = get().leaveApplications.filter(
          (app) => app.userId === userId && app.status === "approved"
        );
        const usage: Record<number, number> = {};

        userApps.forEach((app) => {
          if (!usage[app.leaveTypeId]) usage[app.leaveTypeId] = 0;
          usage[app.leaveTypeId] += app.totalDays;
        });

        return Object.entries(usage).map(([leaveTypeId, usedQuota]) => ({
          leaveTypeId: parseInt(leaveTypeId),
          usedQuota,
        }));
      },
    }),
    {
      name: "sforger-leave-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
