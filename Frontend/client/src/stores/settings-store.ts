import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the shape of the settings object
interface SystemSettings {
  workingHours: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "17:00"
  };
  // We can add other system-wide settings here in the future
}

// Define the state and actions for the store
interface SettingsState {
  settings: SystemSettings;
  updateSettings: (newSettings: SystemSettings) => void;
}

// Create the Zustand store
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial default state for the settings
      settings: {
        workingHours: {
          start: '09:00',
          end: '17:00',
        },
      },

      // Action to update the settings
      updateSettings: (newSettings) => {
        set({ settings: newSettings });
      },
    }),
    {
      name: 'sforger-settings-storage', // Key for localStorage
      storage: createJSONStorage(() => localStorage), // Persist to localStorage
    }
  )
);