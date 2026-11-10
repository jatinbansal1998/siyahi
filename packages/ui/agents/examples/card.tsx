import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  useFormat,
} from "@siyahi/ui";
import { DownloadIcon } from "lucide-react";

export default function CardExample() {
  const { money } = useFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue this quarter</CardTitle>
        <CardDescription>Across all stores</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <DownloadIcon />
            Export CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{money(4512300)}</p>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground">Updated every night at midnight IST</p>
      </CardFooter>
    </Card>
  );
}
