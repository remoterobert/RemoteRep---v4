"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const PALETTE = [
  "#0079fe",
  "#22c55e",
  "#eab308",
  "#9b51e0",
  "#f2994a",
  "#56ccf2",
  "#ef4444",
  "#fbdc3b",
  "#818594",
];

/**
 * Line chart: single series of counts per date bucket.
 */
export function SignupsChart({
  data,
  label = "Signups",
}: {
  data: Array<{ date: string; count: number }>;
  label?: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            stroke="var(--border)"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name={label}
            stroke={PALETTE[0]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Stacked area chart: multiple category series over a common date axis.
 * Used for events broken down by event_type.
 */
export function StackedActivityChart({
  data,
  categories,
}: {
  data: Array<Record<string, string | number>>;
  categories: string[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            stroke="var(--border)"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {categories.map((cat, i) => (
            <Area
              key={cat}
              type="monotone"
              dataKey={cat}
              stackId="1"
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.4}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Horizontal bar chart for top-N lists.
 */
export function TopNBar({
  data,
  labelKey = "label",
  valueKey = "value",
}: {
  data: Array<Record<string, string | number>>;
  labelKey?: string;
  valueKey?: string;
}) {
  return (
    <div style={{ height: Math.max(220, data.length * 32) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            stroke="var(--border)"
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey={labelKey}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            stroke="var(--border)"
            width={180}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey={valueKey} fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
