import { useSync } from "../hooks/useSync";
import { formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function SyncStatus() {
  const { sync, isSyncing, lastSyncTime } = useSync();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={sync}
            disabled={isSyncing}
            className="relative"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isSyncing
              ? "Syncing..."
              : lastSyncTime
              ? `Last synced ${formatDistanceToNow(lastSyncTime, {
                  addSuffix: true,
                })}`
              : "Not synced yet"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
