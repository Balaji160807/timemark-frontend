import { cn } from "@/lib/utils";

const COLOR: Record<string, string> = {
  PRESENT: "text-forest",
  LATE: "text-amber",
  ABSENT: "text-brick",
  ON_LEAVE: "text-ochre-dark",
};

export function Stamp({ label, time }: { label: string; time?: string }) {
  return (
    <div
      className={cn(
        "flex h-24 w-24 -rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed font-mono text-[11px] font-bold uppercase tracking-wide",
        COLOR[label] || "text-slate"
      )}
    >
      <span>{label.replace("_", " ")}</span>
      {time && <span className="mt-0.5 text-[13px] normal-case tracking-normal">{time}</span>}
    </div>
  );
}
