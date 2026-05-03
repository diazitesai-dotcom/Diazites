import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Acquisition"
        title="Campaigns"
        description="Spend, efficiency, and conversion in one command view — tuned for weekly optimization reviews."
      />
      <Card className="overflow-hidden border-white/[0.06]">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-lg">Campaign performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
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
                <TableRow
                  key={`${campaign.platform}-${campaign.location}`}
                  className="border-border/60"
                >
                  <TableCell className="font-medium">{campaign.platform}</TableCell>
                  <TableCell>{campaign.budget}</TableCell>
                  <TableCell>{campaign.goal}</TableCell>
                  <TableCell>{campaign.location}</TableCell>
                  <TableCell>
                    <Badge variant="success">{campaign.status}</Badge>
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
    </div>
  );
}
