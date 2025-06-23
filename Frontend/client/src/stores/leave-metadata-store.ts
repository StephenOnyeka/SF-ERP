import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface LeaveTypeMetadata {
  id: number;
  name: string;
  colorCode: string;
  isAnnual?: boolean;
}

interface LeaveMetadataState {
  leaveTypes: LeaveTypeMetadata[];
  setLeaveTypes: (types: LeaveTypeMetadata[]) => void;
  getLeaveTypeById: (id: number) => LeaveTypeMetadata | undefined;
}

export const useLeaveMetadataStore = create<LeaveMetadataState>()(
  persist(
    (set, get) => ({
      leaveTypes:  [
    { id: 1, name: "Paid Leave", colorCode: "#3B82F6" },
    { id: 2, name: "Sick Leave", colorCode: "#10B981" },
    { id: 3, name: "Casual Leave", colorCode: "#F59E0B" },
  ],
      setLeaveTypes: (types) => set({ leaveTypes: types }),
      getLeaveTypeById: (id) =>
        get().leaveTypes.find((type) => type.id === id),
    }),
    {
      name: "sforger-leave-metadata",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
