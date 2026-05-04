import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtensionDaysCellProps {
  visitUuid: string;
  currentCount: number;
}

export const ExtensionDaysCell = ({ visitUuid, currentCount }: ExtensionDaysCellProps) => {
  const queryClient = useQueryClient();
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const count = optimisticCount ?? currentCount;

  const { mutate: tickDay, isPending } = useMutation({
    mutationFn: async (newCount: number) => {
      const { error } = await supabase
        .from('visits')
        .update({ extension_days_count: newCount })
        .eq('id', visitUuid);
      if (error) throw error;
    },
    onMutate: (newCount) => {
      setOptimisticCount(newCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays-visits'] });
    },
    onError: (err: any) => {
      setOptimisticCount(null);
      toast.error('Failed to save extension day: ' + err.message);
    },
  });

  return (
    <div className="flex flex-wrap gap-1 items-center min-w-[80px]">
      {count === 0 ? (
        <label className="flex items-center gap-1 cursor-pointer select-none text-xs font-semibold text-black">
          <input
            type="checkbox"
            checked={false}
            disabled={isPending}
            onChange={() => tickDay(1)}
            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
          />
          Day 1
        </label>
      ) : (
        <>
          {Array.from({ length: count }, (_, i) => {
            const isLastDay = i === count - 1;
            return (
              <label key={i + 1} className={`flex items-center gap-1 select-none text-xs font-semibold ${isLastDay ? 'cursor-pointer text-black' : 'text-green-700 cursor-default'}`}>
                <input
                  type="checkbox"
                  checked={true}
                  readOnly={!isLastDay}
                  disabled={isLastDay && isPending}
                  onChange={isLastDay ? () => tickDay(count - 1) : undefined}
                  className={`w-3.5 h-3.5 ${isLastDay ? 'accent-blue-600 cursor-pointer' : 'accent-green-600 cursor-default'}`}
                />
                Day {i + 1}
              </label>
            );
          })}
          <label className="flex items-center gap-1 cursor-pointer select-none text-xs font-semibold text-black">
            <input
              type="checkbox"
              checked={false}
              disabled={isPending}
              onChange={() => tickDay(count + 1)}
              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
            />
            Day {count + 1}
          </label>
        </>
      )}
    </div>
  );
};
