import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@siyahi/ui";

const questions = [
  ["refresh", "When are the figures refreshed?", "Every night at midnight IST, and every minute for today's orders."],
  [
    "refunds",
    "How are refunds counted?",
    "A refund comes off the month the order was placed in, not the month it was paid.",
  ],
  ["stores", "Can I add a second store?", "Yes. Each store is its own workspace, and the totals add them up."],
] as const;

function Questions() {
  return questions.map(([value, question, answer]) => (
    <AccordionItem key={value} value={value}>
      <AccordionTrigger>{question}</AccordionTrigger>
      <AccordionContent>{answer}</AccordionContent>
    </AccordionItem>
  ));
}

export default function AccordionExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">One open at a time</p>
        <Accordion aria-label="One open at a time" defaultValue={["refresh"]}>
          <Questions />
        </Accordion>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Several open</p>
        <Accordion aria-label="Several open" multiple defaultValue={["refresh", "refunds"]}>
          <Questions />
        </Accordion>
      </div>
    </div>
  );
}
