import { Progress, ProgressLabel, ProgressValue } from "@siyahi/ui";

export default function ProgressExample() {
  return (
    <Progress value={64} className="max-w-sm">
      <ProgressLabel>Statements imported</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}
