"use client";

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = { safe: "#22c55e", suspicious: "#facc15", malicious: "#ef4444" };

export function ScansAreaChart({ data }: { data: { day: string; safe: number; suspicious: number; malicious: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: new Date(`${d.day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ left: -18, right: 8, top: 10 }}>
          <defs>
            {Object.entries(COLORS).map(([k, c]) => (
              <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                <stop offset="100%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#85858d", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fill: "#85858d", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#141418", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
          <Area type="monotone" dataKey="safe" name="Safe / trusted" stackId="1" stroke={COLORS.safe} fill="url(#fill-safe)" strokeWidth={2} />
          <Area type="monotone" dataKey="suspicious" name="Suspicious / high risk" stackId="1" stroke={COLORS.suspicious} fill="url(#fill-suspicious)" strokeWidth={2} />
          <Area type="monotone" dataKey="malicious" name="Scam" stackId="1" stroke={COLORS.malicious} fill="url(#fill-malicious)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VerdictDonut({ safe, suspicious, malicious }: { safe: number; suspicious: number; malicious: number }) {
  const data = [
    { name: "Safe / trusted", value: safe, color: COLORS.safe },
    { name: "Suspicious / high risk", value: suspicious, color: COLORS.suspicious },
    { name: "Scam", value: malicious, color: COLORS.malicious },
  ];
  const total = safe + suspicious + malicious;
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? data : [{ name: "none", value: 1, color: "rgba(255,255,255,0.08)" }]} dataKey="value" innerRadius={48} outerRadius={66} paddingAngle={total ? 3 : 0} stroke="none">
              {(total ? data : [{ color: "rgba(255,255,255,0.08)" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-white tabular-nums">{total}</span>
          <span className="text-[11px] text-muted-foreground">scans</span>
        </div>
      </div>
      <ul className="space-y-2.5 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-white/75">{d.name}</span>
            <span className="ml-auto pl-4 font-medium text-white tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
