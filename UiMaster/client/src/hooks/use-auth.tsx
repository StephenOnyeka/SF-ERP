import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // For debugging
  useEffect(() => {
    console.log("Auth state:", { user, isLoading, error });
  }, [user, isLoading, error]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login attempt with:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        const userData = await res.json();
        console.log("Login success, received user data:", userData);
        return userData;
      } catch (err) {
        console.error("Login error:", err);
        throw err;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Login mutation success, setting user data");
      queryClient.setQueryData(["/api/user"], user);
      refetch(); // Refetch user data to ensure consistency
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Register attempt with:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        const userData = await res.json();
        console.log("Registration success, received user data:", userData);
        return userData;
      } catch (err) {
        console.error("Registration error:", err);
        throw err;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Registration mutation success, setting user data");
      queryClient.setQueryData(["/api/user"], user);
      refetch(); // Refetch user data to ensure consistency
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logout attempt");
      try {
        await apiRequest("POST", "/api/logout");
        console.log("Logout success");
      } catch (err) {
        console.error("Logout error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("Logout mutation success, clearing user data");
      queryClient.setQueryData(["/api/user"], null);
      refetch(); // Refetch to ensure user state is cleared
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
