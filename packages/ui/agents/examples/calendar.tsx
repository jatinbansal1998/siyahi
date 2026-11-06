import { Calendar } from "@siyahi/ui";
import { useState } from "react";

export default function CalendarExample() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 20));
  return (
    <div className="w-fit rounded-lg border">
      <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026, 9, 1)} />
    </div>
  );
}
