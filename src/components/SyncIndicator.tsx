import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { subscribeSync, syncNow, SyncState } from "../cloudSync";

export function useSyncState() {
  const [s, setS] = useState<SyncState>({ status: "idle", lastSync: null, pending: 0 });
  useEffect(() => subscribeSync(setS), []);
  return s;
}

export default function SyncIndicator({ compact = false }: { compact?: boolean }) {
  const s = useSyncState();
  const [busy, setBusy] = useState(false);
  const label =
    s.status === "syncing" || busy
      ? "در حال همگام‌سازی..."
      : s.status === "online"
      ? "متصل به سرور"
      : s.status === "offline" || s.status === "error"
      ? "آفلاین (ذخیره محلی)"
      : "همگام‌سازی";
  const Icon = s.status === "offline" || s.status === "error" ? CloudOff : Cloud;
  const color =
    s.status === "online" ? "text-emerald-400" : s.status === "offline" || s.status === "error" ? "text-amber-400" : "";
  const time = s.lastSync
    ? new Date(s.lastSync).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <button
      type="button"
      title={s.error ? `آخرین خطا: ${s.error}` : `آخرین همگام‌سازی: ${time || "-"}`}
      onClick={async () => {
        setBusy(true);
        await syncNow();
        setBusy(false);
      }}
      className={`flex items-center gap-1 ${color} hover:underline`}
    >
      {busy || s.status === "syncing" ? <RefreshCw size={13} className="animate-spin" /> : <Icon size={13} />}
      {!compact && <span>{label}</span>}
      {s.pending > 0 && <span className="rounded bg-amber-600 px-1 text-[10px] text-white">{s.pending}</span>}
    </button>
  );
}
