"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { NetworkDevice, Discrepancy } from "@/types";
import { 
  Activity, PieChart as PieIcon, BarChart2, TrendingUp, 
  Wifi, Server, Radio, ShieldCheck 
} from "lucide-react";

interface ObservabilityChartsProps {
  devices: NetworkDevice[];
  discrepancies: Discrepancy[];
}

const COLORS = ["#1e40af", "#2563eb", "#38bdf8", "#64748b", "#94a3b8"];

// Custom Apple Frosted Tooltip
const AppleChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[14px] bg-white/95 p-3 shadow-lg ring-1 ring-slate-900/10 backdrop-blur-md font-mono text-xs">
        <div className="font-sans font-semibold text-slate-800 mb-1 border-b border-slate-100 pb-1">
          {label || payload[0]?.name}
        </div>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || item.fill }}
              />
              {item.name}:
            </span>
            <span className="font-bold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ObservabilityCharts: React.FC<ObservabilityChartsProps> = ({
  devices,
  discrepancies,
}) => {
  const [chartView, setChartView] = useState<"standard" | "detailed">("standard");

  // 1. Group by category (Donut Chart)
  const categoryCounts = devices.reduce<Record<string, number>>((acc, d) => {
    const type = d.device_type.toUpperCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 2. Telemetry Timeline data (Uptime / Health status)
  const timelineData = [
    { time: "09:00", online: 10, latencia: 4 },
    { time: "09:30", online: 10, latencia: 3 },
    { time: "10:00", online: 10, latencia: 4 },
    { time: "10:30", online: 10, latencia: 5 },
    { time: "11:00", online: 10, latencia: 3 },
    { time: "11:30", online: 10, latencia: 4 },
    { time: "12:00", online: 10, latencia: 3 },
  ];

  // 3. Wi-Fi APs & Switch Distribution / Clients Load (Document Section 8.4)
  const apDevices = devices.filter((d) => d.device_type === "ap" || d.device_type === "switch");
  const apLoadData = [
    { name: "1F U7 Pro", clientes: 18, senal: 98 },
    { name: "2F U7 Pro", clientes: 24, senal: 96 },
    { name: "3F U6 Pro", clientes: 12, senal: 99 },
    { name: "Data Center Sw", clientes: 28, senal: 100 },
    { name: "3F Switch", clientes: 14, senal: 100 },
    { name: "1F Switch", clientes: 16, senal: 100 },
  ];

  return (
    <div className="space-y-4">
      {/* 3 Grid Charts according to Apple HIG */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Chart 1: Donut Distribution */}
        <div className="apple-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-sky-50 text-sky-600 ring-1 ring-sky-500/15">
                <PieIcon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold tracking-tight text-slate-900 truncate">
                Categorías de Hardware
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 font-semibold">
              {devices.length} Nodos
            </span>
          </div>

          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<AppleChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(val) => (
                    <span className="text-[11px] font-sans text-slate-600 font-medium">
                      {val}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Telemetry SLA & Link Uptime (Smooth Area Chart) */}
        <div className="apple-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/15">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold tracking-tight text-slate-900 truncate">
                Uptime de Enlace & Latencia
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-500/20">
              99.98% SLA
            </span>
          </div>

          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[8, 12]}
                  fontFamily="monospace"
                />
                <Tooltip content={<AppleChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="online"
                  name="Nodos Conectados"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOnline)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Client Load per Wireless AP / Switch (Bar Chart) */}
        <div className="apple-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 ring-1 ring-blue-500/15">
                <Wifi className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold tracking-tight text-slate-900 truncate">
                Carga Wi-Fi & Nodos
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
              112 Clientes
            </span>
          </div>

          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apLoadData}>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={9}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={35}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="monospace"
                />
                <Tooltip content={<AppleChartTooltip />} />
                <Bar
                  dataKey="clientes"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  name="Clientes Conectados"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
