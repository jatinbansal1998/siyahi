import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@siyahi/ui";

const stores = [
  { label: "All stores", value: "all" },
  { label: "Online", value: "online" },
  { label: "Retail", value: "retail" },
  { label: "Wholesale", value: "wholesale" },
];

export default function SelectExample() {
  return (
    <Select items={stores} defaultValue="all">
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sales channel</SelectLabel>
          {stores.map((store) => (
            <SelectItem key={store.value} value={store.value}>
              {store.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
