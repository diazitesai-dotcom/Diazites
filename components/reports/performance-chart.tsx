"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

const monthly = [
  { month: "Jan", leads: 32, spend: 2800, cpl: 87, roi: 2.3, conversions: 8 },
  { month: "Feb", leads: 37, spend: 3100, cpl: 84, roi: 2.5, conversions: 10 },
  { month: "Mar", leads: 45, spend: 3900, cpl: 86, roi: 2.7, conversions: 13 },
  { month: "Apr", leads: 52, spend: 4300, cpl: 82, roi: 2.9, conversions: 17 },
];

export function PerformanceChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 w-full rounded-md border p-4" />
        <div className="h-72 w-full rounded-md border p-4" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-72 w-full rounded-md border p-4">
        <p className="mb-3 text-sm font-medium">Leads and Spend</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" fill="#2563eb" />
            <Bar dataKey="spend" fill="#14b8a6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 w-full rounded-md border p-4">
        <p className="mb-3 text-sm font-medium">CPL, ROI, Conversions</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cpl" stroke="#dc2626" />
            <Line type="monotone" dataKey="roi" stroke="#16a34a" />
            <Line type="monotone" dataKey="conversions" stroke="#7c3aed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
