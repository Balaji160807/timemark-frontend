"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, isBackOffice } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
    } else if (isBackOffice(session.role)) {
      router.replace("/admin");
    } else {
      router.replace("/employee");
    }
  }, [router]);

  return null;
}
