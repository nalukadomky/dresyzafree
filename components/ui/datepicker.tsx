"use client";

import * as React from "react";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

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
  const [viewMonth, setViewMonth] = React.useState(() => date || new Date());

  // Sync viewMonth when value changes externally
  React.useEffect(() => {
    if (date) setViewMonth(date);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  };

  // Build calendar grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="glass-card rounded-2xl p-5 shadow-2xl border border-white/10 w-full max-w-[340px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  className="h-10 w-10 rounded-xl inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-semibold text-white capitalize">
                  {format(viewMonth, "LLLL yyyy", { locale: cs })}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="h-10 w-10 rounded-xl inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((wd) => (
                  <div key={wd} className="text-center text-xs text-white/40 font-medium py-1">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {weeks.map((week, wi) =>
                  week.map((d, di) => {
                    const inMonth = isSameMonth(d, viewMonth);
                    const selected = date ? isSameDay(d, date) : false;
                    const today = isToday(d);
                    return (
                      <button
                        key={`${wi}-${di}`}
                        type="button"
                        onClick={() => handleSelect(d)}
                        className={cn(
                          "h-10 w-full rounded-lg text-sm transition-colors inline-flex items-center justify-center",
                          !inMonth && "text-white/20 hover:text-white/40",
                          inMonth && !selected && "text-white/80 hover:bg-white/10 hover:text-white",
                          today && !selected && "bg-white/10 text-white font-semibold",
                          selected && "bg-blue-500 text-white font-semibold hover:bg-blue-600",
                        )}
                      >
                        {format(d, "d")}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
