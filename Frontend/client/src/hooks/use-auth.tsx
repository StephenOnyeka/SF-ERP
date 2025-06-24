import { useAuthStore } from '@/stores/auth-store';
import { useSessionStore } from '@/stores/session-auth-store';
import { useShallow } from 'zustand/react/shallow';

export const useAuth = () => {
  const { user, token,  logout } = useSessionStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      logout: state.clearSession,
    }))
  );

  const { users, register, login, updateProfile, updatePassword } =
    useAuthStore(
      useShallow((state) => ({
        users: state.users,
        register: state.register,
        login: state.login,
        updateProfile: state.updateProfile,
        updatePassword: state.updatePassword,
      }))
    );

  const isAuthenticated = !!user;

  return {
    user,
    token,
    isAuthenticated,
    users,
    login,
    logout,
    register,
    updateProfile,
    updatePassword,
  };
};
