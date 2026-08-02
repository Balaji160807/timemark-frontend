"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, Session } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header({ session }: { session: Session }) {
  const router = useRouter();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }) +
          " · " +
          d.toLocaleTimeString("en-US")
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 -rotate-6 items-center justify-center rounded-[10px] bg-ink font-mono text-[15px] font-bold text-ochre">
          T
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight">TimeMark</div>
          <div className="-mt-0.5 text-xs text-slate-light">
            {session.fullName} · {session.role}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-slate">{clock}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
