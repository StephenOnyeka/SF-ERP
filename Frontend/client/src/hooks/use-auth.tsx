import { useAuthStore } from '@/stores/auth-store';
import type { LoginData, RegisterData } from '@/stores/auth-store';
import { useShallow } from 'zustand/react/shallow';
/**
 * A custom hook to access authentication state and actions.
 * This hook is a lightweight wrapper around the `useAuthStore` (Zustand store)
 * and replaces the previous context-based implementation.
 */
export const useAuth = () => {
  // Select state and actions from the Zustand store
  const { user, login, logout, register } = useAuthStore(useShallow(state => ({
    user: state.user,
    login: state.login,
    logout: state.logout,
    register: state.register,
  })));

  // For convenient checking of authentication status in components
  const isAuthenticated = !!user;

  return {
    /** The currently authenticated user object, or null if not logged in. */
    user,
    /** A boolean flag indicating if a user is currently authenticated. */
    isAuthenticated,
    /**
     * An async function to log in a user.
     * @param data - { username, password }
     * @returns A promise that resolves with the user object on success.
     * @throws An error on failure.
     * 
     * @example
     * try {
     *   await login(data);
     *   // navigate to dashboard
     * } catch (error) {
     *   // show error toast
     * }
     */
    login,
    /**
     * A function to log out the current user.
     */
    logout,
    /**
     * An async function to register a new user.
     * @param data - { username, password, email, ... }
     * @returns A promise that resolves with the new user object on success.
     * @throws An error if the username already exists.
     */
    register,
  };
};

// NOTE: The AuthProvider and AuthContext have been removed.
// They are no longer needed as Zustand provides global state management.
// You will need to remove the <AuthProvider> wrapper from your application's
// component tree (likely in App.tsx or main.tsx).