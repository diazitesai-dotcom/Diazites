import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  {
    client: "EverPeak Roofing",
    stage: "Build",
    profileComplete: true,
    agentsAssigned: true,
    campaignBuilt: true,
    landingPageReady: false,
    aiActive: false,
  },
  {
    client: "Northwind Roof Co.",
    stage: "QA",
    profileComplete: true,
    agentsAssigned: true,
    campaignBuilt: true,
    landingPageReady: true,
    aiActive: true,
  },
];

export default function AdminOnboardingTrackerPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Lifecycle"
        title="Onboarding tracker"
        description="Signup → profile → build → QA → live → optimize. Stage clarity for internal operators."
      />
      <Card className="overflow-hidden border-white/[0.06]">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-lg">
            Signup → Profile → Build → QA → Live → Optimize
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Client</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Profile Complete</TableHead>
                <TableHead>Agents Assigned</TableHead>
                <TableHead>Campaign Built</TableHead>
                <TableHead>Landing Page Ready</TableHead>
                <TableHead>AI Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.client} className="border-border/60">
                  <TableCell className="font-medium">{row.client}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.stage}</Badge>
                  </TableCell>
                  <TableCell>{row.profileComplete ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.agentsAssigned ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.campaignBuilt ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.landingPageReady ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.aiActive ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
