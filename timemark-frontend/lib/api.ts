import { getSession } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authed = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authed) {
    const session = getSession();
    if (session) headers["Authorization"] = `Bearer ${session.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-JSON error body, fall back to default message */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) };
  const session = getSession();
  if (session) headers["Authorization"] = `Bearer ${session.token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  return res.blob();
}

/* ---------- Types matching backend DTOs ---------- */
export type LoginResponse = {
  token: string;
  username: string;
  fullName: string;
  role: "EMPLOYEE" | "HR" | "MANAGER" | "ADMIN";
};

export type Attendance = {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE";
};

export type Payroll = {
  employeeId: number;
  employeeName: string;
  month: string;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
  absentDays: number;
  perDayRate: number;
  deduction: number;
  netPay: number;
};

export type QrCode = {
  token: string;
  imageBase64: string;
};

export type Leave = {
  id: number;
  employeeId: number;
  employeeName: string;
  type: "CASUAL" | "SICK" | "ANNUAL";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

/* ---------- API surface ---------- */
export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }, false),

  register: (payload: {
    username: string; password: string; fullName: string;
    role: string; department?: string; designation?: string; salary?: number;
  }) =>
    request<void>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }, false),

  checkIn: (latitude?: number, longitude?: number) =>
    request<Attendance>("/api/attendance/checkin", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),

  checkOut: () =>
    request<Attendance>("/api/attendance/checkout", { method: "POST" }),

  myAttendance: () => request<Attendance[]>("/api/attendance/me"),

  teamAttendanceToday: () => request<Attendance[]>("/api/attendance/team"),

  requestLeave: (payload: { type: string; fromDate: string; toDate: string; reason: string }) =>
    request<Leave>("/api/leave", { method: "POST", body: JSON.stringify(payload) }),

  myLeaves: () => request<Leave[]>("/api/leave/me"),

  pendingLeaves: () => request<Leave[]>("/api/leave/pending"),

  approveLeave: (id: number) => request<Leave>(`/api/leave/${id}/approve`, { method: "POST" }),

  rejectLeave: (id: number) => request<Leave>(`/api/leave/${id}/reject`, { method: "POST" }),

  myPayroll: (month?: string) =>
    request<Payroll>(`/api/payroll/me${month ? `?month=${month}` : ""}`),

  teamPayroll: (month?: string) =>
    request<Payroll[]>(`/api/payroll/team${month ? `?month=${month}` : ""}`),

  myPayslipPdf: (month?: string) =>
    requestBlob(`/api/payroll/me/payslip${month ? `?month=${month}` : ""}`),

  qrCode: () => request<QrCode>("/api/attendance/qr-code"),

  checkInViaQr: (token: string) =>
    request<Attendance>("/api/attendance/checkin-qr", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  teamInsight: () => request<{ insight: string }>("/api/insights/team"),
};
