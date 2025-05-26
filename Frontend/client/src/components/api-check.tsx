import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function ApiCheck() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkApi = async () => {
    setStatus("loading");
    setError(null);
    
    try {
      console.log("Checking API health...");
      const res = await fetch("/api/health", {
        cache: "no-store",
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      
      console.log("API response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API health check failed: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log("API health check response:", data);
      setResponse(data);
      setStatus("success");
    } catch (err) {
      console.error("API health check error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <span>API Connection Test</span>
          {status === "success" && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Connected
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Failed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={checkApi} 
            disabled={status === "loading"}
            variant="outline"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check API Connection"
            )}
          </Button>
          
          {status === "success" && response && (
            <div className="text-sm">
              <div className="font-medium">Response:</div>
              <pre className="bg-slate-100 p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
          
          {status === "error" && error && (
            <div className="text-sm text-red-600">
              <div className="font-medium">Error:</div>
              <pre className="bg-red-50 p-2 rounded mt-1 overflow-auto text-red-700">
                {error}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}