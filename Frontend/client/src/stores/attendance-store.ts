import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Attendance } from "../../../shared/schema";

// Helper to get today's date in 'YYYY-MM-DD' format
const getTodayDateString = () => new Date().toISOString().split("T")[0];

interface AttendanceState {
  attendanceRecords: Attendance[];
  checkIn: (userId: string) => void;
  checkOut: (userId: string) => void;
  getTodaysAttendance: (userId: string) => Attendance | undefined;
  getRecordsInRange: (userId: string, start: string, end: string) => Attendance[];
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      attendanceRecords: [],

      getRecordsInRange: (userId, start, end) => {
        return get().attendanceRecords.filter((rec) => {
          const dateStr = new Date(rec.date).toISOString().split("T")[0];
          return rec.userId === userId && dateStr >= start && dateStr <= end;
        });
      },

      checkIn: (userId: string) => {
        const todayStr = getTodayDateString();
        const now = new Date();

        const existingRecord = get().attendanceRecords.find(
          (rec) =>
            rec.userId === userId &&
            new Date(rec.date).toISOString().split("T")[0] === todayStr
        );

        if (existingRecord) {
          if (!existingRecord.checkInTime) {
            set((state) => ({
              attendanceRecords: state.attendanceRecords.map((rec) =>
                rec.id === existingRecord.id
                  ? {
                      ...rec,
                      checkInTime: now.toISOString(),
                      status: "present",
                    }
                  : rec
              ),
            }));
          }
        } else {
          const newRecord: Attendance = {
            id: uuid(),
            userId,
            date: now,
            checkInTime: now.toISOString(),
            status: "present",
          };
          set((state) => ({
            attendanceRecords: [...state.attendanceRecords, newRecord],
          }));
        }
      },

      checkOut: (userId: string) => {
        const todayStr = getTodayDateString();
        const now = new Date();

        set((state) => ({
          attendanceRecords: state.attendanceRecords.map((rec) => {
            if (
              rec.userId === userId &&
              new Date(rec.date).toISOString().split("T")[0] === todayStr &&
              rec.checkInTime &&
              !rec.checkOutTime
            ) {
              const checkInDate = new Date(rec.checkInTime);
              const durationMs = now.getTime() - checkInDate.getTime();
              const hours = Math.floor(durationMs / 3600000);
              const minutes = Math.floor((durationMs % 3600000) / 60000);
              const workingHours = `${hours}h ${minutes}m`;

              return { ...rec, checkOutTime: now.toISOString(), workingHours };
            }
            return rec;
          }),
        }));
      },

      getTodaysAttendance: (userId: string) => {
        const todayStr = getTodayDateString();
        return get().attendanceRecords.find(
          (rec) =>
            rec.userId === userId &&
            new Date(rec.date).toISOString().split("T")[0] === todayStr
        );
      },
    }),
    {
      name: "sforger-attendance-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
