import { Clock, FileCheck, Edit3, CheckCircle2, LayoutGrid } from "lucide-react";

export const STATUS_ORDER = [
  "Pending_Review",
  "Approved_For_Rewrite",
  "Rewritten_Pending_Publish",
  "Published",
];

export const STATUS_CONFIG = {
  Pending_Review: {
    key: "Pending_Review",
    label: "Pending Review",
    short: "Pending",
    icon: Clock,
    badge:
      "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    dot: "bg-amber-400",
    accent: "text-amber-400",
    ring: "hover:border-amber-500/40",
  },
  Approved_For_Rewrite: {
    key: "Approved_For_Rewrite",
    label: "Approved for Rewrite",
    short: "Approved",
    icon: FileCheck,
    badge: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    dot: "bg-blue-400",
    accent: "text-blue-400",
    ring: "hover:border-blue-500/40",
  },
  Rewritten_Pending_Publish: {
    key: "Rewritten_Pending_Publish",
    label: "Rewritten · Pending Publish",
    short: "Rewritten",
    icon: Edit3,
    badge:
      "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    dot: "bg-purple-400",
    accent: "text-purple-400",
    ring: "hover:border-purple-500/40",
  },
  Published: {
    key: "Published",
    label: "Published",
    short: "Published",
    icon: CheckCircle2,
    badge:
      "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    dot: "bg-emerald-400",
    accent: "text-emerald-400",
    ring: "hover:border-emerald-500/40",
  },
};

export const ALL_TAB = {
  key: "all",
  label: "All Items",
  short: "All",
  icon: LayoutGrid,
  accent: "text-slate-300",
};

// Next workflow action per status
export const NEXT_ACTION = {
  Pending_Review: {
    to: "Approved_For_Rewrite",
    label: "Approve for Rewrite",
    className: "bg-blue-600 hover:bg-blue-500 text-white",
  },
  Approved_For_Rewrite: {
    to: "Rewritten_Pending_Publish",
    label: "Submit Rewrite",
    className: "bg-purple-600 hover:bg-purple-500 text-white",
    requiresRewrite: true,
  },
  Rewritten_Pending_Publish: {
    to: "Published",
    label: "Publish",
    className: "bg-emerald-600 hover:bg-emerald-500 text-white",
  },
  Published: null,
};
