"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";

type InfoPopoverProps = {
  title: string;
  ariaLabel: string;
  children: ReactNode;
  width?: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
};

export function InfoPopover({
  title,
  ariaLabel,
  children,
  width = "min(42rem, calc(100vw - 2rem))",
  side = "top",
  align = "start",
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const positionClassName = [
    side === "top" ? "bottom-full mb-3" : "top-full mt-3",
    align === "start" ? "left-0" : "right-0",
  ].join(" ");

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-slate-500 transition-colors hover:text-indigo-400"
        aria-label={ariaLabel}
      >
        <Info size={14} />
      </button>
      {open && (
        <div
          className={`absolute z-50 rounded-2xl border border-slate-700 bg-slate-800 p-5 text-sm leading-relaxed text-slate-200 shadow-2xl backdrop-blur-xl ${positionClassName}`}
          style={{
            width,
            maxWidth: "calc(100vw - 2rem)",
            whiteSpace: "normal",
            wordBreak: "normal",
            overflowWrap: "break-word",
          }}
        >
          <p className="mb-3 border-b border-slate-700 pb-2 text-sm font-bold text-white">
            {title}
          </p>
          <div className="space-y-3">{children}</div>
        </div>
      )}
    </div>
  );
}
