import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid"; // <-- Add this
import type { User, LoginData as BaseLoginData } from "../../../shared/schema";
import { z } from "zod";
import { useLeaveStore } from "@/stores/leave-store";

const setStorage = (remember: boolean) =>
  useAuthStore.persist.setOptions({
    storage: createJSONStorage(() => storageType(remember)),
  });

const resetToDefaultStorage = () =>
  useAuthStore.persist.setOptions({
    storage: createJSONStorage(() => localStorage),
  });

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "hr", "employee"]).default("employee"),
});
export type RegisterData = z.infer<typeof registerSchema>;

export type LoginData = BaseLoginData & {
  rememberMe: boolean;
};

const seedUsers: Omit<User, "id" | "companyId" | "joinDate">[] = [
  {
    username: "admin",
    password: "password123",
    firstName: "Admin",
    lastName: "User",
    email: "admin@sforger.com",
    role: "admin",
    department: "Management",
    position: "System Administrator",
    profileImage: "https://i.pravatar.cc/150?u=admin",
  },
  {
    username: "hr_manager",
    password: "password123",
    firstName: "Helen",
    lastName: "Resource",
    email: "hr@sforger.com",
    role: "hr",
    department: "Human Resources",
    position: "HR Manager",
    profileImage: "https://i.pravatar.cc/150?u=hr_manager",
  },
  {
    username: "test_employee",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    email: "employee@sforger.com",
    role: "employee",
    department: "Engineering",
    position: "Software Developer",
    profileImage: "https://i.pravatar.cc/150?u=test_employee",
  },
];

const generateInitialUsers = (): User[] =>
  seedUsers.map((user, index) => ({
    ...user,
    id: uuid(), // <-- Now using UUID
    joinDate: new Date(),
    companyId: `SF-${String(index + 1).padStart(3, "0")}`,
  }));

const storageType = (remember: boolean): StateStorage =>
  remember ? localStorage : sessionStorage;

interface AuthState {
  user: User | null;
  token: string | null;
  users: User[];
  login: (data: LoginData) => Promise<User>;
  logout: () => void;
  register: (data: RegisterData) => Promise<User>;
  _repersist: () => void;
  updateProfile: (
    id: string,
    updates: Partial<
      Omit<User, "id" | "username" | "companyId" | "joinDate" | "role">
    >
  ) => void;
  updatePassword: (
    id: string,
    currentPassword: string,
    newPassword: string
  ) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      users: generateInitialUsers(),

      login: async ({ username, password, rememberMe }: LoginData) => {
        setStorage(rememberMe);

        const foundUser = get().users.find(
          (u) => u.username === username && u.password === password
        );
        if (!foundUser) throw new Error("Invalid username or password");

        const mockToken = btoa(
          JSON.stringify({ sub: foundUser.id, role: foundUser.role })
        );
        set({ user: foundUser, token: mockToken });

        return foundUser;
      },

      logout: () => {
        set({ user: null, token: null });
        resetToDefaultStorage();
      },

      register: async (data: RegisterData) => {
        useAuthStore.persist.setOptions({
          storage: createJSONStorage(() => localStorage),
        });

        const { users } = get();
        if (users.some((u) => u.username === data.username)) {
          throw new Error("Username already exists");
        }
        if (users.some((u) => u.email === data.email)) {
          throw new Error("Email already exists");
        }

        const newUser: User = {
          ...data,
          id: uuid(),
          joinDate: new Date(),
          companyId: `SF-${String(users.length + 1).padStart(3, "0")}`,
        };

        const mockToken = btoa(
          JSON.stringify({ sub: newUser.id, role: newUser.role })
        );

        set({ users: [...users, newUser], user: newUser, token: mockToken });

        // leave quotas for this user
        useLeaveStore.getState().createDefaultQuotasForUser(newUser.id);

        return newUser;
      },

      _repersist: () => {
        useAuthStore.persist.rehydrate();
      },
      updateProfile: (id, updates) => {
        const { users } = get();
        const updatedUsers = users.map((u) =>
          u.id === id ? { ...u, ...updates } : u
        );
        const updatedUser = updatedUsers.find((u) => u.id === id) || null;
        set({ users: updatedUsers, user: updatedUser });
      },

      updatePassword: (id, currentPassword, newPassword) => {
        const { users } = get();
        const user = users.find((u) => u.id === id);
        if (!user || user.password !== currentPassword) {
          throw new Error("Current password is incorrect");
        }

        const updatedUsers = users.map((u) =>
          u.id === id ? { ...u, password: newPassword } : u
        );
        set({ users: updatedUsers });
      },
    }),
    {
      name: "sforger-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const sessionIsLocalStorage =
            window.localStorage.getItem("sforger-auth-storage") !== null;
          useAuthStore.persist.setOptions({
            storage: createJSONStorage(() =>
              storageType(sessionIsLocalStorage)
            ),
          });
        }
      },
    }
  )
);
