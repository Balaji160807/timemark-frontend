"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, Session } from "@/lib/auth";
import { api, ApiError, Attendance, Leave, Payroll } from "@/lib/api";
import { Header } from "@/components/Header";
import { Stamp } from "@/components/Stamp";
import { QrScanner } from "@/components/QrScanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function EmployeePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [today, setToday] = useState<Attendance | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [type, setType] = useState("CASUAL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [formMsg, setFormMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    setSession(s);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [history, myLeaves, myPayroll] = await Promise.all([
        api.myAttendance(),
        api.myLeaves(),
        api.myPayroll(),
      ]);
      const todayStr = new Date().toISOString().slice(0, 10);
      setToday(history.find((a) => a.date === todayStr) || null);
      setLeaves(myLeaves);
      setPayroll(myPayroll);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't load your data.");
    }
  }

  async function handleCheckIn() {
    setActionError(null);

    if (!navigator.geolocation) {
      setActionError("Your browser doesn't support location access, which is required to check in.");
      return;
    }

    setVerifying(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const a = await api.checkIn(pos.coords.latitude, pos.coords.longitude);
          setToday(a);
        } catch (err) {
          setActionError(err instanceof ApiError ? err.message : "Check-in failed.");
        } finally {
          setVerifying(false);
        }
      },
      () => {
        setActionError("Location access was denied. Please allow location access to check in.");
        setVerifying(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  async function handleCheckOut() {
    setActionError(null);
    try {
      const a = await api.checkOut();
      setToday(a);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Check-out failed.");
    }
  }

  async function handleQrScan(token: string) {
    setShowQrScanner(false);
    setActionError(null);
    try {
      const a = await api.checkInViaQr(token);
      setToday(a);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "QR check-in failed.");
    }
  }

  async function handleDownloadPayslip() {
    setDownloadingPayslip(true);
    setActionError(null);
    try {
      const blob = await api.myPayslipPdf(payroll?.month);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${payroll?.month ?? "current"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't download payslip.");
    } finally {
      setDownloadingPayslip(false);
    }
  }

  async function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormMsg(null);
    try {
      await api.requestLeave({ type, fromDate, toDate, reason });
      setFormMsg({ text: "Leave request submitted — awaiting approval.", ok: true });
      setFromDate(""); setToDate(""); setReason("");
      loadData();
    } catch (err) {
      setFormMsg({ text: err instanceof ApiError ? err.message : "Something went wrong.", ok: false });
    }
  }

  if (!session) return null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-6">
      <Header session={session} />

      {showQrScanner && (
        <QrScanner onScan={handleQrScan} onCancel={() => setShowQrScanner(false)} />
      )}

      <Card className="mb-5 text-center">
        {actionError && <p className="mb-3 text-xs font-semibold text-brick">{actionError}</p>}
        {verifying && (
          <p className="font-mono text-xs text-slate-light">Verifying your location…</p>
        )}
        {!verifying && !today?.checkInTime && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex gap-2">
              <Button variant="ochre" onClick={handleCheckIn}>Tap to Check In</Button>
              <Button variant="ghost" onClick={() => setShowQrScanner(true)}>Scan QR Instead</Button>
            </div>
            <p className="font-mono text-[11px] text-slate-light">Uses geo-verification, or the office QR code</p>
          </div>
        )}
        {!verifying && today?.checkInTime && !today?.checkOutTime && (
          <div className="flex flex-col items-center gap-3 py-2">
            <Stamp label={today.status} time={today.checkInTime.slice(0, 5)} />
            <Button variant="primary" onClick={handleCheckOut}>Check Out</Button>
          </div>
        )}
        {!verifying && today?.checkInTime && today?.checkOutTime && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex gap-3">
              <Stamp label="PRESENT" time={today.checkInTime.slice(0, 5)} />
              <Stamp label="PRESENT" time={today.checkOutTime.slice(0, 5)} />
            </div>
            <p className="font-mono text-[11px] text-slate-light">Day complete — see you tomorrow.</p>
          </div>
        )}
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
            My Payslip — {payroll?.month ?? "This Month"}
          </h2>
          {!payroll && <p className="text-sm text-slate-light">Loading…</p>}
          {payroll && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border p-2">
                  <div className="font-mono text-lg font-bold text-forest">{payroll.presentDays}</div>
                  <div className="text-[10px] uppercase text-slate-light">Present</div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="font-mono text-lg font-bold text-ochre-dark">{payroll.leaveDays}</div>
                  <div className="text-[10px] uppercase text-slate-light">Leave</div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="font-mono text-lg font-bold text-brick">{payroll.absentDays}</div>
                  <div className="text-[10px] uppercase text-slate-light">Absent</div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-slate">Deduction</span>
                <span className="font-mono">Rs. {payroll.deduction.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-sm font-semibold">
                <span>Net Pay</span>
                <span className="font-mono">Rs. {payroll.netPay.toLocaleString()}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full"
                onClick={handleDownloadPayslip}
                disabled={downloadingPayslip}
              >
                {downloadingPayslip ? "Preparing…" : "Download Payslip (PDF)"}
              </Button>
            </>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
            Request Leave
          </h2>
          <form onSubmit={handleLeaveSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate">Leave type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#FCFDFC] px-3 py-2 text-sm"
              >
                <option value="CASUAL">Casual</option>
                <option value="SICK">Sick</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="min-h-[64px] w-full rounded-lg border border-border bg-[#FCFDFC] px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">Submit request</Button>
            {formMsg && (
              <p className={`text-xs font-semibold ${formMsg.ok ? "text-forest" : "text-brick"}`}>
                {formMsg.text}
              </p>
            )}
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-slate">
            Your Requests
          </h2>
          {leaves.length === 0 && <p className="text-sm text-slate-light">No leave requests yet.</p>}
          <ul className="divide-y divide-border">
            {leaves.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">{l.type} · {l.days} day{l.days > 1 ? "s" : ""}</p>
                  <p className="text-xs text-slate-light">{l.fromDate} → {l.toDate}</p>
                  <p className="text-xs text-slate-light">{l.reason}</p>
                </div>
                <Badge variant={l.status.toLowerCase() as "pending" | "approved" | "rejected"}>
                  {l.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
