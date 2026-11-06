import { Tabs, TabsContent, TabsList, TabsTrigger } from "@siyahi/ui";

export default function TabsExample() {
  return (
    <Tabs defaultValue="orders">
      <TabsList>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="returns">Returns</TabsTrigger>
        <TabsTrigger value="payouts">Payouts</TabsTrigger>
      </TabsList>
      <TabsContent value="orders">Every order placed, newest first.</TabsContent>
      <TabsContent value="returns">Items sent back and the refunds paid for them.</TabsContent>
      <TabsContent value="payouts">Money paid out to sellers each week.</TabsContent>
    </Tabs>
  );
}
