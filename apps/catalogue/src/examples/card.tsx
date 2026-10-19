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
        <CardTitle>Portfolio value</CardTitle>
        <CardDescription>Across all accounts</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <DownloadIcon />
            CSV
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{money(4512300)}</p>
      </CardContent>
      <CardFooter className="text-muted-foreground">Updated after the market close</CardFooter>
    </Card>
  );
}
