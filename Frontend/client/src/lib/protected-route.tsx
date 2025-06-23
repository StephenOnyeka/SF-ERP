import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const user = useAuthStore((state) => state.user);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Debug
  useEffect(() => {
    console.log(`Protected route (${path}) check:`, { user });
  }, [user, path]);

  // Handle page transitions
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [path]);

  // Loading state simulation (optional): add loading if needed
  if (user === undefined) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Unauthenticated state
  if (!user) {
    console.log(`No user found, redirecting to /auth from ${path}`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Authenticated state
  return (
    <Route path={path}>
      <div className={`transition-opacity duration-300 ${isPageTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <Component />
      </div>
    </Route>
  );
}
