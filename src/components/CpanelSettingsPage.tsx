import { useState } from "react";
import {
  Download,
  Server,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Archive,
  RefreshCw,
  FolderCheck,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { Theme } from "../theme";

interface CpanelSettingsPageProps {
  t: Theme;
  onShowToast: (msg: string) => void;
}

export default function CpanelSettingsPage({
  t,
  onShowToast,
}: CpanelSettingsPageProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // تابع دانلود تضمینی نسخه کامل
  const handleFullDownload = async () => {
    setDownloading(true);
    setDownloadProgress("در حال بررسی و دریافت نسخه کامل...");

    try {
      const fileUrl = `${window.location.origin}/cpanel_public_html.zip?t=${Date.now()}`;
      const res = await fetch(fileUrl);
      
      if (!res.ok) {
        throw new Error("خطا در برقراری ارتباط با سرور");
      }

      const blob = await res.blob();
      const sizeInKb = Math.round(blob.size / 1024);

      // اگر حجم فایل کمتر از ۱۰۰ کیلوبایت بود (نشانه خطای آی‌فریم)، تب جدید باز شود
      if (blob.size < 100000) {
        setDownloadProgress("باز کردن در تب مستقیم جهت دانلود بدون محدودیت...");
        window.open(fileUrl, "_blank");
        onShowToast("دانلود در پنجره مستقیم باز شد (جهت تضمین حجم کامل)");
        return;
      }

      // ایجاد لینک دانلود مستقیم محلی از Blob
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "cpanel_public_html.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadProgress(`دانلود با موفقیت انجام شد (${sizeInKb} کیلوبایت)`);
      onShowToast(`نسخه کامل فایل cPanel با موفقیت دانلود شد (${sizeInKb} KB)`);
    } catch {
      // در صورت هرگونه محدودیت، باز کردن در تب جدید
      const directUrl = `${window.location.origin}/cpanel_public_html.zip`;
      window.open(directUrl, "_blank");
      onShowToast("لینک دانلود مستقیم در تب جدید باز شد");
      setDownloadProgress("دانلود در تب مستقیم اجرا شد.");
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 1500);
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText("https://emami-asemansara.ir");
    setCopied(true);
    onShowToast("آدرس دامنه کپی شد");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-1 flex-col overflow-y-auto p-6 text-right ${t.bg}`}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 ${t.text}`}>
            <Server className="text-emerald-500" size={24} />
            تنظیمات هاست و فایل خروجی cPanel
          </h1>
          <p className={`mt-1 text-xs ${t.sub}`}>
            مدیریت بسته نصبی، دانلود نسخه کامل خروجی و راهنمای راه‌اندازی روی دامنه اختصاصی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://emami-asemansara.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-zinc-700 dark:text-sky-400 dark:hover:bg-zinc-800 transition"
          >
            <Globe size={14} />
            مشاهده سایت زنده (emami-asemansara.ir)
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Box */}
        <div className="lg:col-span-2 space-y-6">
          {/* Download Box */}
          <div className={`rounded-xl border p-6 shadow-sm ${t.card} ${t.border}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 size={13} />
                  نسخه کامل کامپایل شده و آماده
                </span>
                <h2 className={`mt-2 text-lg font-bold ${t.text}`}>
                  بسته نصبی کامل برای cPanel (public_html)
                </h2>
                <p className={`mt-1 text-xs leading-relaxed ${t.sub}`}>
                  این بسته حاوی تمامی کدهای کامپایل‌شده جاوااسکریپت، استایل‌ها، فونت‌ها و فایل ساختار
                  به همراه فایل کانفیگ <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">.htaccess</code> آپاچی است.
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <Archive size={32} />
              </div>
            </div>

            {/* File info pill */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-y py-3 text-xs">
              <div>
                <span className={t.sub}>نام فایل:</span>
                <div className="font-semibold dir-ltr text-right">cpanel_public_html.zip</div>
              </div>
              <div>
                <span className={t.sub}>حجم بسته کامل:</span>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">~۷۰۹ کیلوبایت</div>
              </div>
              <div>
                <span className={t.sub}>مسیر در cPanel:</span>
                <div className="font-semibold dir-ltr text-right">public_html/</div>
              </div>
              <div>
                <span className={t.sub}>وضعیت:</span>
                <div className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck size={13} /> کاملاً معتبر
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFullDownload}
                disabled={downloading}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>در حال دانلود نسخه کامل...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>دانلود نسخه کامل فایل cPanel (۷۰۹ KB)</span>
                  </>
                )}
              </button>

              <a
                href="/cpanel_public_html.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
              >
                <ExternalLink size={14} />
                دانلود مستقیم در تب جدید (لینک کمکی)
              </a>
            </div>

            {downloadProgress && (
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {downloadProgress}
              </div>
            )}
          </div>

          {/* Step by Step Guide */}
          <div className={`rounded-xl border p-6 shadow-sm ${t.card} ${t.border}`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${t.text} mb-4`}>
              <FolderCheck size={18} className="text-sky-500" />
              راهنمای ۳ مرحله‌ای استخراج در cPanel
            </h3>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold dark:bg-sky-950 dark:text-sky-300">
                  ۱
                </span>
                <div>
                  <strong className={t.text}>ورود به File Manager:</strong> وارد کنترل‌پنل cPanel خود شوید، روی آیکون <strong>File Manager</strong> کلیک کرده و وارد پوشه <strong>public_html</strong> شوید.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold dark:bg-sky-950 dark:text-sky-300">
                  ۲
                </span>
                <div>
                  <strong className={t.text}>آپلود و استخراج (Extract):</strong> فایل <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">cpanel_public_html.zip</code> را در همان صفحه اول <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">public_html</code> آپلود کنید. سپس روی آن راست‌کلیک کرده و گزینه <strong>Extract</strong> را انتخاب کنید.
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold dark:bg-sky-950 dark:text-sky-300">
                  ۳
                </span>
                <div>
                  <strong className={t.text}>بررسی و اجرا:</strong> مطمئن شوید فایل‌های <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">index.html</code>، پوشه <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">assets</code> و فایل <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">.htaccess</code> مستقیماً در <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">public_html</code> قرار گرفته‌اند. سایت شما روی دامنه اختصاصی آنلاین است!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Domain Details */}
          <div className={`rounded-xl border p-5 shadow-sm ${t.card} ${t.border}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.sub} mb-3`}>
              اطلاعات دامنه و اتصال
            </h3>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border p-3 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                <span className={t.sub}>آدرس دامنه فعال:</span>
                <div className="mt-1 flex items-center justify-between font-mono font-bold text-sky-600 dark:text-sky-400">
                  <span>https://emami-asemansara.ir</span>
                  <button
                    type="button"
                    onClick={copyDomain}
                    title="کپی آدرس دامنه"
                    className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b dark:border-zinc-800">
                <span className={t.sub}>گواهی SSL (HTTPS):</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> فعال
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b dark:border-zinc-800">
                <span className={t.sub}>وب‌سرور هاست:</span>
                <span className="font-semibold">Apache / LiteSpeed</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className={t.sub}>تنظیم روت‌ها (.htaccess):</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> تعبیه شده
                </span>
              </div>
            </div>
          </div>

          {/* Help notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle size={15} />
              نکته مهم در رابطه با حجم فایل
            </div>
            اگر هر زمان دکمه دانلود را زدید و فایل چند کیلوبایت دانلود شد، به دلیل تدابیر امنیتی پیش‌نمایش در مرورگر است؛ در آن حالت کافیست دکمه <strong>«دانلود مستقیم در تب جدید»</strong> را کلیک کنید تا بدون واسطه نسخه کامل ۷۰۹ کیلوبایتی دانلود گردد.
          </div>
        </div>
      </div>
    </div>
  );
}
