"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isBackOffice, Session } from "@/lib/auth";
import { api, ApiError, Attendance, Leave, Payroll, QrCode } from "@/lib/api";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [team, setTeam] = useState<Attendance[]>([]);
  const [pending, setPending] = useState<Leave[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [qr, setQr] = useState<QrCode | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (!isBackOffice(s.role)) { router.replace("/employee"); return; }
    setSession(s);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const [t, p, pr, q] = await Promise.all([
        api.teamAttendanceToday(),
        api.pendingLeaves(),
        api.teamPayroll(),
        api.qrCode(),
      ]);
      setTeam(t);
      setPending(p);
      setPayroll(pr);
      setQr(q);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load dashboard data.");
    }
  }

  async function refreshQr() {
    try {
      setQr(await api.qrCode());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't refresh QR code.");
    }
  }

  async function loadInsight() {
    setLoadingInsight(true);
    try {
      const { insight } = await api.teamInsight();
      setInsight(insight);
    } catch (err) {
      setInsight(err instanceof ApiError ? err.message : "Couldn't load AI insight right now.");
    } finally {
      setLoadingInsight(false);
    }
  }

  async function decide(id: number, approve: boolean) {
    try {
      if (approve) await api.approveLeave(id); else await api.rejectLeave(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    }
  }

  if (!session) return null;

  const presentToday = team.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const onLeaveToday = team.filter((a) => a.status === "ON_LEAVE").length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <Header session={session} />

      {error && <p className="mb-4 text-sm font-semibold text-brick">{error}</p>}

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-5">
          <div className="font-mono text-2xl font-bold">{team.length}</div>
          <div className="text-xs text-slate">Checked in today</div>
        </Card>
        <Card className="p-5">
          <div className="font-mono text-2xl font-bold text-forest">{presentToday}</div>
          <div className="text-xs text-slate">Present</div>
        </Card>
        <Card className="p-5">
          <div className="font-mono text-2xl font-bold text-ochre-dark">{onLeaveToday}</div>
          <div className="text-xs text-slate">On leave</div>
        </Card>
        <Card className="p-5">
          <div className="font-mono text-2xl font-bold text-brick">{pending.length}</div>
          <div className="text-xs text-slate">Pending requests</div>
        </Card>
      </div>

      <div className="mb-5 grid gap-5 md:grid-cols-2">
        <Card className="text-center">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
            Today&apos;s Office QR Code
          </h2>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr.imageBase64} alt="Office check-in QR code" className="mx-auto h-40 w-40" />
          ) : (
            <p className="text-sm text-slate-light">Loading…</p>
          )}
          <p className="mt-3 text-xs text-slate-light">
            Display this at the entrance — it rotates automatically every day.
          </p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={refreshQr}>
            Refresh
          </Button>
        </Card>

        <Card>
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
            AI Insights
          </h2>
          {!insight && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-slate-light">
                Get a quick natural-language summary of today&apos;s attendance and leave patterns.
              </p>
              <Button variant="primary" size="sm" onClick={loadInsight} disabled={loadingInsight}>
                {loadingInsight ? "Thinking…" : "Generate Insight"}
              </Button>
            </div>
          )}
          {insight && (
            <div>
              <p className="text-sm leading-relaxed">{insight}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={loadInsight} disabled={loadingInsight}>
                {loadingInsight ? "Thinking…" : "Regenerate"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="mb-5 overflow-x-auto">
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
          Today&apos;s Attendance
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-wide text-slate-light">
              <th className="pb-2">Employee</th>
              <th className="pb-2">Check In</th>
              <th className="pb-2">Check Out</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {team.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-2.5 font-medium">{a.employeeName}</td>
                <td className="py-2.5 font-mono">{a.checkInTime?.slice(0, 5) || "—"}</td>
                <td className="py-2.5 font-mono">{a.checkOutTime?.slice(0, 5) || "—"}</td>
                <td className="py-2.5">
                  <Badge variant={a.status.toLowerCase() as "present" | "late" | "absent" | "on_leave"}>
                    {a.status.replace("_", " ")}
                  </Badge>
                </td>
              </tr>
            ))}
            {team.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-slate-light">No one has checked in yet today.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
          Leave Approvals
        </h2>
        {pending.length === 0 && <p className="text-sm text-slate-light">No pending requests.</p>}
        <ul className="divide-y divide-border">
          {pending.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold">
                  {l.employeeName} · {l.type} · {l.days} day{l.days > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-slate-light">{l.fromDate} → {l.toDate}</p>
                <p className="text-xs text-slate-light">{l.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="approve" size="sm" onClick={() => decide(l.id, true)}>Approve</Button>
                <Button variant="reject" size="sm" onClick={() => decide(l.id, false)}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-5 overflow-x-auto">
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
          Payroll Summary — {payroll[0]?.month ?? "This Month"}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-wide text-slate-light">
              <th className="pb-2">Employee</th>
              <th className="pb-2">Present</th>
              <th className="pb-2">Absent</th>
              <th className="pb-2">Leave</th>
              <th className="pb-2">Deduction</th>
              <th className="pb-2">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((p) => (
              <tr key={p.employeeId} className="border-b border-border last:border-0">
                <td className="py-2.5 font-medium">{p.employeeName}</td>
                <td className="py-2.5 font-mono">{p.presentDays}</td>
                <td className="py-2.5 font-mono">{p.absentDays}</td>
                <td className="py-2.5 font-mono">{p.leaveDays}</td>
                <td className="py-2.5 font-mono">Rs. {p.deduction.toLocaleString()}</td>
                <td className="py-2.5 font-mono font-semibold">Rs. {p.netPay.toLocaleString()}</td>
              </tr>
            ))}
            {payroll.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-slate-light">No payroll data yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
