// src/stores/holiday-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { parseISO, isAfter } from "date-fns";

export interface Holiday {
  id: number;
  name: string;
  date: string; // ISO string
  type: "public" | "religious" | "observance";
}

interface HolidayState {
  holidays: Holiday[];
  setHolidays: (holidays: Holiday[]) => void;
  getUpcomingHolidays: (limit?: number) => Holiday[];
}

// Optional mock data
const seedHolidays: Holiday[] = [
  {
    id: 1,
    name: "Founders' Day",
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    type: "public",
  },
  {
    id: 2,
    name: "Eid al-Adha",
    date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    type: "religious",
  },
  {
    id: 3,
    name: "Republic Day",
    date: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
    type: "public",
  },
];

export const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      holidays: seedHolidays,
      setHolidays: (holidays) => set({ holidays }),
      getUpcomingHolidays: (limit = 3) => {
        const today = new Date();
        return get()
          .holidays
          .filter(h => isAfter(parseISO(h.date), today))
          .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: "sforger-holiday-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
