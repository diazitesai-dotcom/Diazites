import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Onboarding Tracker</h1>
      <Card>
        <CardHeader>
          <CardTitle>Signup → Profile → Build → QA → Live → Optimize</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow key={row.client}>
                  <TableCell>{row.client}</TableCell>
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
    </main>
  );
}
