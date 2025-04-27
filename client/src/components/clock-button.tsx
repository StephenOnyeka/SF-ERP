import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

interface ClockButtonProps {
  type: 'in' | 'out';
  disabled?: boolean;
  onSuccess?: () => void;
}

export function ClockButton({ type, disabled, onSuccess }: ClockButtonProps) {
  const { toast } = useToast();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isClockedOut, setIsClockedOut] = useState(false);

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/attendance/clock-in');
      return await res.json();
    },
    onSuccess: () => {
      setIsClockedIn(true);
      toast({
        title: 'Clock In Successful',
        description: `You've successfully clocked in at ${new Date().toLocaleTimeString()}`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Clock In Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/attendance/clock-out');
      return await res.json();
    },
    onSuccess: () => {
      setIsClockedOut(true);
      toast({
        title: 'Clock Out Successful',
        description: `You've successfully clocked out at ${new Date().toLocaleTimeString()}`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Clock Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClick = () => {
    if (type === 'in') {
      clockInMutation.mutate();
    } else {
      clockOutMutation.mutate();
    }
  };

  const isPending = type === 'in' ? clockInMutation.isPending : clockOutMutation.isPending;
  const isSuccess = type === 'in' ? isClockedIn : isClockedOut;

  return (
    <Button
      onClick={handleClick}
      className={`inline-flex items-center justify-center px-4 py-2 ${
        type === 'in'
          ? 'bg-primary hover:bg-primary-700'
          : 'bg-red-600 hover:bg-red-700'
      }`}
      disabled={disabled || isPending || isSuccess}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : type === 'in' ? (
        <LogIn className="h-5 w-5 mr-2" />
      ) : (
        <LogOut className="h-5 w-5 mr-2" />
      )}
      {isPending
        ? `Clocking ${type}...`
        : isSuccess
        ? `Clocked ${type}`
        : `Clock ${type.charAt(0).toUpperCase() + type.slice(1)}`}
    </Button>
  );
}

export default ClockButton;
