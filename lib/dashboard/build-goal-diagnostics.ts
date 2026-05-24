import type { BusinessGoal, GoalCoaching, GoalPacingStatus, SparkPoint } from "@/lib/dashboard/mission-control-types";

function pacingFromRatio(ratio: number): { status: GoalPacingStatus; label: string } {
  if (ratio >= 1.05) return { status: "ahead", label: "Ahead of target" };
  if (ratio >= 0.85) return { status: "on_track", label: "On pace" };
  return { status: "behind", label: "Behind target" };
}

export function enrichBusinessGoals(input: {
  revenueCurrent: number;
  revenueTarget: number;
  leadCurrent: number;
  leadTarget: number;
  bookedCurrent: number;
  bookedTarget: number;
  campaignCurrent: number;
  campaignTarget: number;
  periodDays: number;
}): BusinessGoal[] {
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const revenueProjected = monthProgress > 0 ? input.revenueCurrent / monthProgress : input.revenueCurrent;
  const revenueRatio = input.revenueTarget > 0 ? revenueProjected / input.revenueTarget : 0;
  const revenuePacing = pacingFromRatio(revenueRatio);

  const leadPace = input.periodDays > 0 ? input.leadCurrent / Math.min(7, input.periodDays) : 0;
  const leadsRemaining = Math.max(0, input.leadTarget - input.leadCurrent);
  const leadEta = leadPace > 0 ? Math.ceil(leadsRemaining / leadPace) : null;
  const leadExpected = leadPace * daysInMonth;
  const leadRatio = input.leadTarget > 0 ? leadExpected / input.leadTarget : 0;
  const leadPacing = pacingFromRatio(leadRatio);

  const bookedRatio =
    input.bookedTarget > 0 ? input.bookedCurrent / input.bookedTarget : 0;
  const bookedPacing = pacingFromRatio(bookedRatio);

  const campaignRatio =
    input.campaignTarget > 0 ? input.campaignCurrent / input.campaignTarget : 0;
  const campaignPacing = pacingFromRatio(campaignRatio);

  return [
    {
      id: "revenue",
      label: "Revenue Goal",
      current: input.revenueCurrent,
      target: input.revenueTarget,
      unit: "currency",
      pacingStatus: revenuePacing.status,
      pacingLabel: revenuePacing.label,
      projectedLabel: `$${formatCompact(revenueProjected)} month-end`,
    },
    {
      id: "leads",
      label: "Lead Goal",
      current: input.leadCurrent,
      target: input.leadTarget,
      unit: "count",
      pacingStatus: leadPacing.status,
      pacingLabel: leadPacing.label,
      pacePerDay: Math.round(leadPace * 10) / 10,
      etaDays: leadEta,
    },
    {
      id: "booked",
      label: "Booked calls",
      current: input.bookedCurrent,
      target: input.bookedTarget,
      unit: "count",
      pacingStatus: bookedPacing.status,
      pacingLabel: bookedPacing.label,
      etaDays:
        input.bookedTarget > input.bookedCurrent
          ? Math.max(1, Math.ceil((input.bookedTarget - input.bookedCurrent) / 2))
          : 0,
    },
    {
      id: "campaigns",
      label: "Campaign launches",
      current: input.campaignCurrent,
      target: input.campaignTarget,
      unit: "count",
      pacingStatus: campaignPacing.status,
      pacingLabel: campaignPacing.label,
    },
  ];
}

function formatCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function buildGoalCoaching(input: {
  activeCampaigns: number;
  hasAds: boolean;
}): GoalCoaching {
  if (input.activeCampaigns === 0 && !input.hasAds) {
    return {
      blocker: "No active campaigns.",
      suggestedMove: "Deploy Retargeting + Meta connection.",
    };
  }
  if (input.activeCampaigns === 0) {
    return {
      blocker: "No active campaigns.",
      suggestedMove: "Deploy Retargeting Agent stack to recover warm traffic.",
    };
  }
  if (!input.hasAds) {
    return {
      blocker: "Ad platforms not connected.",
      suggestedMove: "Connect Meta Ads to unlock paid velocity.",
    };
  }
  return {
    blocker: "Lead follow-up automation is thin.",
    suggestedMove: "Deploy Follow-Up + Qualification agents.",
  };
}

export function annotateSparkSeries(series: SparkPoint[]): SparkPoint[] {
  if (series.length === 0) return series;
  const max = Math.max(...series.map((p) => p.v));
  const maxIdx = series.findIndex((p) => p.v === max && p.v > 0);
  const sundayIdx = series.findIndex((p) => p.d.toLowerCase().startsWith("sun"));

  return series.map((point, i) => {
    if (i === maxIdx && max >= 2) {
      return {
        ...point,
        annotation: {
          kind: "spike",
          title: `${point.d} spike detected`,
          detail: "Source: Direct + landing traffic",
        },
      };
    }
    if (i === sundayIdx && point.v <= Math.max(0, max - 1)) {
      return {
        ...point,
        annotation: {
          kind: "warning",
          title: "Velocity warning",
          detail: "Sunday drop expected — schedule retargeting",
        },
      };
    }
    return point;
  });
}
