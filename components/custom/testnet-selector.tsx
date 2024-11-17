'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { models } from '@/ai/models';
import { saveModelId } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CheckCirclFillIcon, ChevronDownIcon } from './icons';

export function TestnetSelector({
  selectedTestnetId,
  onTestnetSelect,
  className,
}: {
  selectedTestnetId: string;
  onTestnetSelect: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // Find the selected testnet object
  const selectedTestnet = useMemo(
    () => testnets.find((testnet) => testnet.id === selectedTestnetId),
    [selectedTestnetId]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {selectedTestnet?.label || 'Select Testnet'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {testnets.map((testnet) => (
          <DropdownMenuItem
            key={testnet.id}
            onSelect={() => {
              setOpen(false);

              startTransition(() => {
                onTestnetSelect(testnet.id);
              });
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={testnet.id === selectedTestnetId}
          >
            <div className="flex flex-col gap-1 items-start">
              {testnet.label}
              {testnet.description && (
                <div className="text-xs text-muted-foreground">
                  {testnet.description}
                </div>
              )}
            </div>
            <div className="text-primary dark:text-primary-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCirclFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
