"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cs } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={cs}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-white",
        nav: "flex items-center gap-1",
        button_previous: "absolute left-1 top-0 inline-flex items-center justify-center rounded-md h-7 w-7 bg-transparent text-white/60 hover:text-white hover:bg-white/10 transition-colors",
        button_next: "absolute right-1 top-0 inline-flex items-center justify-center rounded-md h-7 w-7 bg-transparent text-white/60 hover:text-white hover:bg-white/10 transition-colors",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-white/40 rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: "h-9 w-9 p-0 font-normal rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors inline-flex items-center justify-center",
        selected: "[&_.rdp-day_button]:bg-blue-500 [&_.rdp-day_button]:text-white [&_.rdp-day_button]:hover:bg-blue-600 [&_.rdp-day_button]:font-semibold",
        today: "[&_.rdp-day_button]:bg-white/10 [&_.rdp-day_button]:text-white [&_.rdp-day_button]:font-semibold",
        outside: "[&_.rdp-day_button]:text-white/20 [&_.rdp-day_button]:hover:text-white/40",
        disabled: "[&_.rdp-day_button]:text-white/20 [&_.rdp-day_button]:hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
