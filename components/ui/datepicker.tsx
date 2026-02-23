"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  /** Value in YYYY-MM-DD format */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export function DatePicker({ value, onChange, className, required }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange(format(day, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 inline-flex items-center gap-2 rounded-lg glass-input text-foreground px-4 text-sm transition-colors hover:bg-white/10",
            !value && "text-muted-foreground",
            className,
          )}
          aria-required={required}
        >
          <CalendarIcon className="h-4 w-4 text-white/50" />
          {date ? format(date, "d. M. yyyy", { locale: cs }) : <span className="text-white/50">Datum</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  );
}
