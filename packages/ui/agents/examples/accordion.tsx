import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@siyahi/ui";

const questions = [
  [
    "prices",
    "When are prices updated?",
    "At the exchange close each trading day, and every minute while markets are open.",
  ],
  ["lots", "How are lots matched?", "Sells are matched to the oldest buy first, as the tax rules require."],
  ["brokers", "Can I add a second broker?", "Yes. Each broker is its own account, and the totals add them up."],
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
        <Accordion aria-label="One open at a time" defaultValue={["prices"]}>
          <Questions />
        </Accordion>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Several open</p>
        <Accordion aria-label="Several open" multiple defaultValue={["prices", "lots"]}>
          <Questions />
        </Accordion>
      </div>
    </div>
  );
}
