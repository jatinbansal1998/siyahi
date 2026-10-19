import { Calendar } from "@siyahi/ui";
import { useState } from "react";

export default function CalendarExample() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 20));
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={new Date(2026, 9, 1)}
      className="w-fit rounded-lg border"
    />
  );
}
