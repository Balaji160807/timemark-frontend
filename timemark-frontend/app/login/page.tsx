"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { saveSession, isBackOffice } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await api.login(username, password);
      saveSession(session);
      router.replace(isBackOffice(session.role) ? "/admin" : "/employee");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 -rotate-6 items-center justify-center rounded-[10px] bg-ink font-mono text-[15px] font-bold text-ochre">
            T
          </div>
          <div className="text-lg font-bold tracking-tight">TimeMark</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-semibold text-slate">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. priya"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-xs font-semibold text-brick">{error}</p>}

          <Button type="submit" variant="ochre" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
