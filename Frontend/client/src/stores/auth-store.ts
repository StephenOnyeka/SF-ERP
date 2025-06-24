// auth-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { User, LoginData as BaseLoginData } from "../../../shared/schema";
import { z } from "zod";
import { useLeaveStore } from "@/stores/leave-store";
import { useSessionStore } from "./session-auth-store";

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "hr", "employee"]).default("employee"),
});
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = BaseLoginData & { rememberMe: boolean };

const seedUsers: Omit<User, "id" | "companyId" | "joinDate">[] = [ /* ... */ ];

const generateInitialUsers = (): User[] =>
  seedUsers.map((user, index) => ({
    ...user,
    id: uuid(),
    joinDate: new Date(),
    companyId: `SF-${String(index + 1).padStart(3, "0")}`,
  }));

interface AuthStoreState {
  users: User[];
  register: (data: RegisterData) => Promise<User>;
  login: (data: LoginData) => Promise<User>;
  updateProfile: (id: string, updates: Partial<User>) => void;
  updatePassword: (
    id: string,
    currentPassword: string,
    newPassword: string
  ) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      users: generateInitialUsers(),

      register: async (data) => {
        const { users } = get();
        if (users.some((u) => u.username === data.username)) throw new Error("Username exists");
        if (users.some((u) => u.email === data.email)) throw new Error("Email exists");

        const newUser: User = {
          ...data,
          id: uuid(),
          joinDate: new Date(),
          companyId: `SF-${String(users.length + 1).padStart(3, "0")}`,
        };

        useLeaveStore.getState().createDefaultQuotasForUser(newUser.id);

        set({ users: [...users, newUser] });
        const token = btoa(JSON.stringify({ sub: newUser.id, role: newUser.role }));

        useSessionStore.getState().setSession(newUser,token);

        return newUser;
      },

      login: async ({ username, password }) => {
        const foundUser = get().users.find(
          (u) => u.username === username && u.password === password
        );
        if (!foundUser) throw new Error("Invalid credentials");

        const token = btoa(JSON.stringify({ sub: foundUser.id, role: foundUser.role }));
        useSessionStore.getState().setSession(foundUser, token);

        return foundUser;
      },

      updateProfile: (id, updates) => {
        const { users } = get();
        const updatedUsers = users.map((u) =>
          u.id === id ? { ...u, ...updates } : u
        );
        set({ users: updatedUsers });
      },

      updatePassword: (id, currentPassword, newPassword) => {
        const { users } = get();
        const user = users.find((u) => u.id === id);
        if (!user || user.password !== currentPassword)
          throw new Error("Incorrect password");
        set({
          users: users.map((u) =>
            u.id === id ? { ...u, password: newPassword } : u
          ),
        });
      },
    }),
    {
      name: "sforger-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
