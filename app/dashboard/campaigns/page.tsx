import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const campaigns = [
  {
    platform: "Google",
    budget: "$5,000",
    goal: "Lead volume",
    location: "Tampa Bay",
    status: "active",
    spend: "$3,900",
    leads: 38,
    cpl: "$103",
    conversionRate: "18%",
  },
  {
    platform: "Meta",
    budget: "$2,500",
    goal: "Booked appointments",
    location: "St. Petersburg",
    status: "active",
    spend: "$1,840",
    leads: 24,
    cpl: "$77",
    conversionRate: "21%",
  },
];

export default function CampaignManagerPage() {
  return (
    <main className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold">Campaign Manager</h1>
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>CPL</TableHead>
                <TableHead>Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={`${campaign.platform}-${campaign.location}`}>
                  <TableCell>{campaign.platform}</TableCell>
                  <TableCell>{campaign.budget}</TableCell>
                  <TableCell>{campaign.goal}</TableCell>
                  <TableCell>{campaign.location}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>{campaign.spend}</TableCell>
                  <TableCell>{campaign.leads}</TableCell>
                  <TableCell>{campaign.cpl}</TableCell>
                  <TableCell>{campaign.conversionRate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
