import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Salary } from '../../../shared/schema';
import { v4 as uuid } from 'uuid';

export interface ExtendedSalary extends Salary {
  createdAt: Date;
}

export type NewSalaryData = Omit<ExtendedSalary, 'id' | 'paymentDate' | 'createdAt'>;

const getPreviousMonth = () => {
  const date = new Date();
  return { month: 6, year: date.getFullYear() };
};

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

  getSalariesByPeriod: (month: number, year: number) => ExtendedSalary[];

  getSalarySummaryByPeriod: (
    month: number,
    year: number,
    users: { id: string }[]
  ) => {
    employees: {
      userId: string;
      salary: ExtendedSalary | null;
    }[];
    totalSalaries: number;
    paidCount: number;
    pendingCount: number;
    noSalaryCount: number;
  };
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

      getSalariesByPeriod: (month, year) => {
        return get().salaryRecords.filter(
          (rec) => rec.month === month && rec.year === year
        );
      },

      getSalarySummaryByPeriod: (month, year, users) => {
        const records = get().salaryRecords.filter(
          (rec) => rec.month === month && rec.year === year
        );

        const recordMap = new Map<string, ExtendedSalary>();
        for (const record of records) {
          console.log(record,"record from getslarysummary");
          recordMap.set(record.userId, record);
        }
        console.log(users,"users from getslarysummary"); 
        const employees = users.map((user) => ({
          userId: user.id,
          salary: recordMap.get(user.id) || null,
        }));
        console.log(employees,"employees from getslarysummary");

        const totalSalaries = records.reduce((sum, rec) => sum + rec.netSalary, 0);
        const paidCount = records.filter((r) => r.paymentStatus === 'paid').length;
        const pendingCount = records.filter((r) => r.paymentStatus === 'pending').length;
        const noSalaryCount = users.length - recordMap.size;

        return {
          employees,
          totalSalaries,
          paidCount,
          pendingCount,
          noSalaryCount,
        };
      },
    }),
    {
      name: 'sforger-salary-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
