"use client";

type TelemetryContext = Record<string, unknown>;

export function installCrashTelemetry(getContext: () => TelemetryContext) {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    console.error("[telemetry] window.error", event.error || event.message, getContext());
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error("[telemetry] unhandledrejection", event.reason, getContext());
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  try {
    performance.mark("bm_telemetry_installed");
  } catch {}

  console.log("[telemetry] installed");

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

export function safeMark(name: string) {
  try {
    performance.mark(name);
  } catch {}
}

