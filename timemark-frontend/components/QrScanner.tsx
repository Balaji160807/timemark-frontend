"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QrScanner({ onScan, onCancel }: { onScan: (token: string) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setCameraError("Couldn't access the camera. You can still enter the code manually below.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            onScan(code.data);
            return; // stop the loop once we've found something
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/95 p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-card border border-border bg-surface p-4">
        {!cameraError && (
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="w-full" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
        {cameraError && <p className="text-sm text-brick">{cameraError}</p>}

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-slate">
            Or enter the code shown by HR
          </label>
          <div className="flex gap-2">
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="OFFICE_CHECKIN:..."
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => manualToken.trim() && onScan(manualToken.trim())}
            >
              Submit
            </Button>
          </div>
        </div>

        <Button variant="ghost" className="mt-4 w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
