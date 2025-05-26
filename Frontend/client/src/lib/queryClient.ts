import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  console.log(`[API] ${method} ${url}`, data ? 'with data' : '');
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`[API] ${method} ${url} response:`, res.status);
  
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
    console.log(`[QUERY] Fetching ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
      // Add random query param to prevent caching
      cache: "no-store",
    });

    console.log(`[QUERY] ${url} response:`, res.status);
    
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`[QUERY] Returning null for 401 at ${url}`);
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
