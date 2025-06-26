import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Salary } from '../../../shared/schema';
import { v4 as uuid } from 'uuid';

// Extended salary type with timestamp
export interface ExtendedSalary extends Salary {
  createdAt: Date;
}

// Form input type
export type NewSalaryData = Omit<ExtendedSalary, 'id' | 'paymentDate' | 'createdAt'>;

const getPreviousMonth = () => {
  const date = new Date();
  return { month: 6, year: date.getFullYear() };
};

// Generate seeded salary data (optional)
const generateInitialSalaryData = (): ExtendedSalary[] => {
  const { month, year } = getPreviousMonth();
  return [
    {
      id: uuid(),
      userId: "test_employee",
      month,
      year,
      baseSalary: 5000,
      bonus: 200,
      deductions: 150,
      netSalary: 5050,
      paymentStatus: 'paid',
      paymentDate: new Date(),
      createdAt: new Date(),
    },
  ];
};

interface SalaryState {
  salaryRecords: ExtendedSalary[];
  addSalaryRecord: (newRecord: NewSalaryData) => void;
}

export const useSalaryStore = create<SalaryState>()(
  persist(
    (set, get) => ({
      salaryRecords: generateInitialSalaryData(),

      addSalaryRecord: (newData: NewSalaryData) => {
        const current = get().salaryRecords;

        const duplicate = current.some(
          (rec) =>
            rec.userId === newData.userId &&
            rec.month === newData.month &&
            rec.year === newData.year
        );

        if (duplicate) {
          throw new Error("A salary record for this employee for this month already exists.");
        }

        const newRecord: ExtendedSalary = {
          ...newData,
          id: uuid(),
          paymentDate: new Date(),
          createdAt: new Date(),
        };

        set({ salaryRecords: [...current, newRecord] });
      },
    }),
    {
      name: 'sforger-salary-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
