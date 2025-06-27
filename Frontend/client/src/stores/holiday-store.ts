import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { parseISO, isAfter } from "date-fns";
import { v4 as uuid } from "uuid";
import { z } from "zod";

export const holidaySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  date: z.date(),
  description: z.string().optional(),
  type: z.enum(["national", "company"]).default("national"),
});
export type Holiday = z.infer<typeof holidaySchema>;

interface HolidayState {
  holidays: Holiday[];
  setHolidays: (holidays: Holiday[]) => void;
  getUpcomingHolidays: (limit?: number) => Holiday[];
  addHoliday: (holiday: Omit<Holiday, "id">) => void;
  deleteHoliday: (id: string) => void;
}

// Test Data
const seedHolidays: Holiday[] = [
  {
    id: uuid(),
    name: "Founders' Day",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    type: "national",
  },
  {
    id: uuid(),
    name: "Eid al-Adha",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    type: "company",
  },
  {
    id: uuid(),
    name: "Republic Day",
    date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    type: "national",
  },
];

export const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      holidays: seedHolidays,

      setHolidays: (holidays) => {
        set({
          holidays: holidays.map((h) => ({
            ...h,
            date: h.date instanceof Date ? h.date : parseISO(h.date as unknown as string),
          })),
        });
      },

      getUpcomingHolidays: (limit = 3) => {
        const today = new Date();
        return get()
          .holidays
          .filter((h) => isAfter(h.date, today))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, limit);
      },

      addHoliday: (holiday) =>
        set((state) => ({
          holidays: [
            ...state.holidays,
            { ...holiday, id: uuid(), date: new Date(holiday.date) },
          ],
        })),

      deleteHoliday: (id) =>
        set((state) => ({
          holidays: state.holidays.filter((h) => h.id !== id),
        })),
    }),
    {
      name: "sforger-holiday-storage",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        holidays: state.holidays.map((h) => ({
          ...h,
          date: h.date.toISOString(),
        })),
      }),

      merge: (persisted, current) => ({
        ...current,
        holidays: (persisted as any).holidays.map((h: any) => ({
          ...h,
          date: parseISO(h.date),
        })),
      }),
    }
  )
);
