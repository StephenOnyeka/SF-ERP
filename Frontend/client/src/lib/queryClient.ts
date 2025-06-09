import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api";

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

export const apiRequest = async (
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`[API] ${method} ${url} with data`, data);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include', // Include cookies in the request
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response;
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Prepend API_BASE_URL if the URL doesn't start with http
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    console.log(`[QUERY] Fetching ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      headers: {
        "Accept": "application/json",
      },
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
