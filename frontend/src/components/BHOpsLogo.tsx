"use client";

import React from "react";

interface BHOpsLogoProps {
  variant?: "dark" | "light" | "icon-only";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BHOpsLogo: React.FC<BHOpsLogoProps> = ({
  variant = "dark",
  className = "",
  size = "md",
}) => {
  if (variant === "icon-only") {
    const dim = size === "sm" ? 32 : size === "lg" ? 48 : 38;
    return (
      <svg
        viewBox="0 0 128 128"
        width={dim}
        height={dim}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="iconBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1329" />
            <stop offset="60%" stopColor="#0f1d40" />
            <stop offset="100%" stopColor="#070c1a" />
          </linearGradient>
          <linearGradient id="iconHawkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="iconBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="iconOpsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#iconBgGrad)" stroke="url(#iconBorderGrad)" strokeWidth="2.5" />
        <path d="M 24 16 Q 64 6 104 16" fill="none" stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="1.5" />
        <g transform="translate(64, 44)">
          <path d="M 0,-18 L -16,-2 L -32,-4 L -20,8 L -36,12 L -18,18 L 0,0 Z" fill="url(#iconHawkGrad)" />
          <path d="M 0,-18 L 16,-2 L 32,-4 L 20,8 L 36,12 L 18,18 L 0,0 Z" fill="url(#iconHawkGrad)" />
          <polygon points="0,-22 5,-12 0,-7 -5,-12" fill="#ffffff" />
          <circle cx="0" cy="1" r="2.5" fill="#38bdf8" />
        </g>
        <g transform="translate(64, 98)">
          <text x="-16" y="0" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="23" fill="#ffffff" letterSpacing="-0.5px">BH</text>
          <rect x="2" y="-17" width="46" height="22" rx="7" fill="url(#iconOpsGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
          <text x="25" y="-1" textAnchor="middle" fontFamily="monospace" fontWeight="800" fontSize="14" fill="#ffffff">Ops</text>
          <circle cx="44" cy="-14" r="2.5" fill="#10b981" />
        </g>
      </svg>
    );
  }

  const isLight = variant === "light";
  const height = size === "sm" ? 32 : size === "lg" ? 48 : 38;
  const width = size === "sm" ? 140 : size === "lg" ? 210 : 165;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 40x40 Vector Emblem */}
      <svg
        viewBox="0 0 44 44"
        width={height}
        height={height}
        className="shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="compBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1329" />
            <stop offset="60%" stopColor="#0f1d40" />
            <stop offset="100%" stopColor="#070c1a" />
          </linearGradient>
          <linearGradient id="compHawkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="compBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="42" height="42" rx="12" fill="url(#compBgGrad)" stroke="url(#compBorderGrad)" strokeWidth="1.5" />
        <g transform="translate(22, 22) scale(0.65)">
          <path d="M 0,-18 L -16,-2 L -32,-4 L -20,8 L -36,12 L -18,18 L 0,0 Z" fill="url(#compHawkGrad)" />
          <path d="M 0,-18 L 16,-2 L 32,-4 L 20,8 L 36,12 L 18,18 L 0,0 Z" fill="url(#compHawkGrad)" />
          <polygon points="0,-22 5,-12 0,-7 -5,-12" fill="#ffffff" />
          <circle cx="0" cy="1" r="2.5" fill="#38bdf8" />
        </g>
      </svg>

      {/* Typography & Ops Pill */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-sm leading-none ${isLight ? "text-slate-900" : "text-white"}`}>
            BLUE HAWK
          </span>
          <span className="font-mono text-[10px] font-bold bg-gradient-to-r from-blue-600 to-sky-500 text-white px-1.5 py-0.2 rounded-md shadow-xs border border-sky-400/40 flex items-center gap-1">
            <span>Ops</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>
        <span className={`text-[8.5px] font-semibold tracking-[0.18em] uppercase leading-tight mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          Technologies
        </span>
      </div>
    </div>
  );
};
