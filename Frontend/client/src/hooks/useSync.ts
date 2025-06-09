import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';
import { useToast } from './useToast';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const sync = async () => {
    try {
      setIsSyncing(true);
      await syncService.syncAll();
      setLastSyncTime(new Date());
      toast({
        title: 'Sync successful',
        description: 'All data has been synchronized with the server.',
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to synchronize data with the server.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync every 5 minutes
  useEffect(() => {
    const syncInterval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(syncInterval);
  }, []);

  // Initial sync
  useEffect(() => {
    sync();
  }, []);

  return {
    sync,
    isSyncing,
    lastSyncTime,
  };
} 