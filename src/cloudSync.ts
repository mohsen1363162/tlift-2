/**
 * همگام‌سازی ابری با Supabase
 * ---------------------------------
 * هر کلید localStorage که در store ذخیره می‌شود، در جدول `app_state`
 * (key, data jsonb, updated_at) نیز آینه می‌شود. در شروع برنامه آخرین نسخه
 * از سرور خوانده می‌شود و با Realtime، تغییرات سایر دستگاه‌ها (مثلاً گوشی
 * تکنسین) بلافاصله به دفتر می‌رسد.
 *
 * SQL ساخت جدول: supabase/migrations/20260917_app_state.sql
 */
import { supabase } from "@/integrations/supabase/client";

export type SyncStatus = "idle" | "syncing" | "online" | "offline" | "error";

type Listener = (s: SyncState) => void;
export type SyncState = {
  status: SyncStatus;
  lastSync: number | null;
  pending: number;
  error?: string;
};

const TABLE = "app_state";
const META_KEY = "tlift_cloud_meta_v1"; // key -> updated_at (ISO) known locally

let state: SyncState = { status: "idle", lastSync: null, pending: 0 };
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l({ ...state }));
const setState = (p: Partial<SyncState>) => {
  state = { ...state, ...p };
  emit();
};

export const subscribeSync = (l: Listener) => {
  listeners.add(l);
  l({ ...state });
  return () => {
    listeners.delete(l);
  };
};
export const getSyncState = () => state;

// ---- local meta (updated_at per key) ----
const loadMeta = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveMeta = (m: Record<string, string>) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from(TABLE);

// ---- push (debounced per key) ----
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const queue: Record<string, unknown> = {};
let applyingRemote = false;

export function pushKey(key: string, data: unknown) {
  if (applyingRemote) return; // change came from server; don't echo back
  queue[key] = data;
  clearTimeout(timers[key]);
  setState({ pending: Object.keys(queue).length });
  timers[key] = setTimeout(() => flushKey(key), 800);
}

async function flushKey(key: string) {
  const data = queue[key];
  delete queue[key];
  const updated_at = new Date().toISOString();
  try {
    setState({ status: "syncing" });
    const { error } = await db().upsert({ key, data, updated_at }, { onConflict: "key" });
    if (error) throw error;
    const meta = loadMeta();
    meta[key] = updated_at;
    saveMeta(meta);
    setState({ status: "online", lastSync: Date.now(), pending: Object.keys(queue).length, error: undefined });
  } catch (e: unknown) {
    // نگه‌داشتن در صف برای تلاش مجدد
    queue[key] = data;
    setState({ status: "offline", pending: Object.keys(queue).length, error: String((e as Error)?.message || e) });
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => flushKey(key), 15000);
  }
}

export async function flushAll() {
  await Promise.all(Object.keys(queue).map((k) => flushKey(k)));
}

// ---- pull ----
type Applier = (key: string, data: unknown) => void;
let applier: Applier | null = null;

export function registerApplier(fn: Applier) {
  applier = fn;
}

function applyRemote(key: string, data: unknown, updated_at: string) {
  const meta = loadMeta();
  if (meta[key] && meta[key] >= updated_at) return; // already have it or newer
  applyingRemote = true;
  try {
    applier?.(key, data);
  } finally {
    applyingRemote = false;
  }
  meta[key] = updated_at;
  saveMeta(meta);
}

export async function pullAll(prefix = "tlift_"): Promise<boolean> {
  try {
    setState({ status: "syncing" });
    const { data, error } = await db().select("key,data,updated_at").like("key", `${prefix}%`);
    if (error) throw error;
    (data || []).forEach((r: { key: string; data: unknown; updated_at: string }) =>
      applyRemote(r.key, r.data, r.updated_at)
    );
    setState({ status: "online", lastSync: Date.now(), error: undefined });
    return true;
  } catch (e: unknown) {
    setState({ status: "offline", error: String((e as Error)?.message || e) });
    return false;
  }
}

// ---- realtime ----
let channelStarted = false;
export function startRealtime() {
  if (channelStarted) return;
  channelStarted = true;
  try {
    supabase
      .channel("app_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload: { new?: { key?: string; data?: unknown; updated_at?: string } }) => {
          const r = payload.new;
          if (r?.key && r.updated_at) applyRemote(r.key, r.data, r.updated_at);
        }
      )
      .subscribe();
  } catch {
    /* realtime optional */
  }
}

// ---- bootstrap ----
let started = false;
export async function startCloudSync() {
  if (started) return;
  started = true;
  await pullAll();
  startRealtime();
  // تلاش مجدد دوره‌ای برای صف و همگام‌سازی
  setInterval(() => {
    if (Object.keys(queue).length) flushAll();
    else pullAll();
  }, 60000);
  window.addEventListener("online", () => flushAll().then(() => pullAll()));
}

/** همگام‌سازی دستی (دکمه «همگام‌سازی اطلاعات») */
export async function syncNow(): Promise<boolean> {
  await flushAll();
  return pullAll();
}
