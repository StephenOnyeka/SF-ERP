import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Salary } from '../../../shared/schema';

// This is the shape of the data our form will provide.
export type NewSalaryData = Omit<Salary, 'id' | 'paymentDate'>;

const getPreviousMonth = () => { /* ... (unchanged) ... */ 
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
}

const generateInitialSalaryData = (): Salary[] => { /* ... (unchanged) ... */ 
    const { month, year } = getPreviousMonth();
    return [{ id: 1, userId: 3, month, year, baseSalary: 5000, bonus: 200, deductions: 150, netSalary: 5050, paymentStatus: 'paid', paymentDate: new Date() }];
};

interface SalaryState {
  salaryRecords: Salary[];
  // ADD a new action to create a salary record
  addSalaryRecord: (newRecord: NewSalaryData) => void;
}

export const useSalaryStore = create<SalaryState>()(
  persist(
    (set, get) => ({
      salaryRecords: generateInitialSalaryData(),

      // NEW Action implementation
      addSalaryRecord: (newRecordData: NewSalaryData) => {
        const currentRecords = get().salaryRecords;
        
        // Check for duplicates
        const recordExists = currentRecords.some(
          rec => rec.userId === newRecordData.userId &&
                 rec.month === newRecordData.month &&
                 rec.year === newRecordData.year
        );

        if (recordExists) {
            throw new Error('A salary record for this employee for this month already exists.');
        }

        const maxId = currentRecords.reduce((max, r) => (r.id! > max ? r.id! : max), 0);
        
        const newRecord: Salary = {
            ...newRecordData,
            id: maxId + 1,
        };

        set({ salaryRecords: [...currentRecords, newRecord] });
      },
    }),
    {
      name: 'sforger-salary-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);