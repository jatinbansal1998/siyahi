import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@siyahi/ui";

const accounts = [
  { label: "All accounts", value: "all" },
  { label: "Equity", value: "equity" },
  { label: "Mutual funds", value: "funds" },
  { label: "Bonds", value: "bonds" },
];

export default function SelectExample() {
  return (
    <Select items={accounts} defaultValue="all">
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {accounts.map((account) => (
            <SelectItem key={account.value} value={account.value}>
              {account.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
