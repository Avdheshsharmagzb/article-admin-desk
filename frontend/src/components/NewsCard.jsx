import { STATUS_CONFIG, NEXT_ACTION } from "@/lib/statusConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Video,
  Image as ImageIcon,
  ArrowRight,
  Eye,
} from "lucide-react";

export const NewsCard = ({ item, index, onOpen, onAdvance }) => {
  const cfg = STATUS_CONFIG[item.status];
  const StatusIcon = cfg.icon;
  const next = NEXT_ACTION[item.status];
  const hasRewrite = item.rewritten_title && item.rewritten_content;
  const displayTitle = hasRewrite ? item.rewritten_title : item.original_title;

  return (
    <div
      data-testid={`news-card-${item.id}`}
      className={`group flex flex-col justify-between rounded-xl bg-slate-900 border border-slate-800/80 ${cfg.ring} p-0 overflow-hidden shadow-md transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg animate-fade-up`}
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      {/* Media */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800/80">
        {item.media_url ? (
          item.media_type === "video" ? (
            <video
              src={item.media_url}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={item.media_url}
              alt={item.original_title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-700">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <span className="absolute top-3 left-3">
          <Badge
            data-testid={`news-card-status-${item.id}`}
            className={`gap-1.5 font-medium ${cfg.badge}`}
          >
            <StatusIcon className="h-3 w-3" />
            {cfg.short}
          </Badge>
        </span>
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-300 backdrop-blur">
          {item.media_type === "video" ? (
            <Video className="h-3 w-3" />
          ) : (
            <ImageIcon className="h-3 w-3" />
          )}
          {item.media_type}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 space-y-3">
        <h3 className="font-serif-display text-lg font-semibold leading-snug text-slate-100 line-clamp-2">
          {displayTitle}
        </h3>
        {hasRewrite && (
          <p className="text-xs text-slate-500 line-through line-clamp-1">
            {item.original_title}
          </p>
        )}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
          {hasRewrite ? item.rewritten_content : item.original_content}
        </p>

        <a
          href={item.original_url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`news-card-source-${item.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors truncate"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{sourceHost(item.original_url)}</span>
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-800/80 p-4">
        <Button
          data-testid={`news-card-open-${item.id}`}
          variant="outline"
          size="sm"
          onClick={() => onOpen(item)}
          className="flex-1 border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <Eye className="h-4 w-4 mr-1.5" />
          {item.status === "Published" ? "View" : "Review & Edit"}
        </Button>
        {next && (
          <Button
            data-testid={`news-card-advance-${item.id}`}
            size="sm"
            onClick={() => onAdvance(item)}
            className={`${next.className} whitespace-nowrap`}
          >
            {next.label}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}
