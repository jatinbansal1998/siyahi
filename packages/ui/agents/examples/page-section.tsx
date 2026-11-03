import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataList,
  DataListItem,
  InlineCode,
  PageSection,
  PageSubheading,
} from "@siyahi/ui";
import { ArrowDownIcon } from "lucide-react";

export default function PageSectionExample() {
  return (
    <PageSection
      id="toolkit"
      eyebrow="Part 2"
      title="The toolkit"
      lead={
        <p>
          One command, <InlineCode>vp</InlineCode>, builds, tests and lints; it replaces the separate config of each.
        </p>
      }
      action={
        <Button variant="outline" size="sm">
          <ArrowDownIcon data-icon="inline-start" />
          Skip to the commands
        </Button>
      }
    >
      <PageSubheading>What each tool does</PageSubheading>
      <Card>
        <CardHeader>
          <CardTitle>Vite+</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList>
            <DataListItem label="In Java terms">Maven, the compiler plugin and Surefire in one binary.</DataListItem>
            <DataListItem label="How it is set up">
              One <InlineCode>vite.config.ts</InlineCode> at the root of the repo.
            </DataListItem>
            <DataListItem label="Remember">
              <InlineCode>vp check</InlineCode>
            </DataListItem>
          </DataList>
        </CardContent>
      </Card>
    </PageSection>
  );
}
