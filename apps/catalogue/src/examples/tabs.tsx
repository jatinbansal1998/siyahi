import { Tabs, TabsContent, TabsList, TabsTrigger } from "@siyahi/ui";

export default function TabsExample() {
  return (
    <Tabs defaultValue="holdings">
      <TabsList>
        <TabsTrigger value="holdings">Holdings</TabsTrigger>
        <TabsTrigger value="realized">Realized</TabsTrigger>
        <TabsTrigger value="cash">Cash flow</TabsTrigger>
      </TabsList>
      <TabsContent value="holdings">What you own today, valued at the last close.</TabsContent>
      <TabsContent value="realized">Gains and losses booked by selling.</TabsContent>
      <TabsContent value="cash">Money in and out of every account.</TabsContent>
    </Tabs>
  );
}
