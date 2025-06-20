import { QueryClient, QueryFunction } from "@tanstack/react-query";
// import { API_BASE_URL } from "@/config/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        errorMsg = text;
        // Try to parse JSON error
        try {
          const jsonError = JSON.parse(text);
          if (jsonError.message) {
            errorMsg = jsonError.message;
          }
        } catch (e) {
          // Use text as is if not JSON
        }
      }
    } catch (e) {
      console.error("Error parsing response:", e);
    }
    
    throw new Error(`${res.status}: ${errorMsg}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Always use relative URLs; Vite proxy will handle routing
  // const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const fullUrl = url;
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    "Accept": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  console.log(`[API] ${method} ${fullUrl}`, data ? 'with data' : '');
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  console.log(`[API] ${method} ${fullUrl} response:`, res.status);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Always use relative URLs; Vite proxy will handle routing
    // const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const fullUrl = url;
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    console.log(`[QUERY] Fetching ${fullUrl}`);
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
      // Add random query param to prevent caching
      cache: "no-store",
    });
    console.log(`[QUERY] ${fullUrl} response:`, res.status);
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`[QUERY] Returning null for 401 at ${fullUrl}`);
      return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
  };

// Create a fresh query client that will be re-created on HMR in development
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 10000, // 10 seconds instead of infinity for better development experience
      retry: 1,         // One retry for better error handling
    },
    mutations: {
      retry: 1,         // One retry for better error handling
    },
  },
});
