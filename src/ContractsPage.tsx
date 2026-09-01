import { useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Settings,
  RotateCw,
  FileText,
  Sheet,
  ChevronDown,
  ChevronsUpDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  RefreshCcw,
  FileSignature,
  SquareArrowOutUpRight,
} from "lucide-react";
import type { Theme } from "./theme";
import { Contract } from "./data";

export default function ContractsPage({
  t,
  contracts,
  onNewContract,
  onOpenContract,
  onOpenCsvUpload,
}: {
  t: Theme;
  contracts: Contract[];
  onNewContract: (kind: string) => void;
  onOpenContract?: (c: Contract) => void;
  onOpenCsvUpload?: () => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [menu, setMenu] = useState(false);
  const [rowMenu, setRowMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const list = contracts.filter((c) => {
    if (!q.trim()) return true;
    const query = q.toLowerCase();
    return (
      c.building.toLowerCase().includes(query) ||
      c.no.includes(query) ||
      c.manager.toLowerCase().includes(query) ||
      c.zone.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query)) ||
      (c.coordinator && c.coordinator.toLowerCase().includes(query))
    );
  });

  const effectivePageSize = pageSize === -1 ? (list.length || 1) : pageSize;
  const totalPages = Math.ceil(list.length / effectivePageSize) || 1;
  const paginatedList = pageSize === -1 ? list : list.slice((page - 1) * pageSize, page * pageSize);

  const chip = (label: string, n: number, color: string) => (
    <div className={`flex items-center gap-2 rounded px-2 py-1 text-[12px] ${t.text}`}>
      <span>{label}</span>
      <span className={`rounded px-1.5 text-[11px] text-white ${color}`}>{n}</span>
    </div>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className={`flex flex-wrap items-center gap-2 border-b ${t.border} px-3 py-2`}>
        <div className={`flex h-8 w-[230px] items-center gap-2 rounded border px-2 ${t.input}`}>
          <X size={14} className={t.sub} onClick={() => setQ("")} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو..."
            className="w-full bg-transparent text-right text-[12px] outline-none"
          />
          <Search size={14} className={t.sub} />
        </div>
        {[SlidersHorizontal, Settings, RotateCw, FileText, Sheet].map((I, i) => (
          <button key={i} type="button" className={`relative rounded p-1.5 ${t.hover} ${t.sub}`}>
            {i === 0 && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />}
            <I size={17} />
          </button>
        ))}
        <div className="flex-1" />
        {onOpenCsvUpload && (
          <button
            type="button"
            onClick={onOpenCsvUpload}
            className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 text-[12.5px] text-zinc-200"
            title="آپلود و درون‌ریزی فایل‌های CSV"
          >
            <Sheet size={14} className="text-emerald-400" /> آپلود فایل CSV
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-1 rounded bg-violet-500 px-3 py-1.5 text-[12.5px] text-white hover:bg-violet-600"
          >
            <ChevronDown size={14} /> ثبت قرارداد
          </button>
          {menu && (
            <div
              className={`absolute left-0 z-40 mt-1 w-[200px] rounded border py-1 shadow-2xl ${t.border} ${
                t.dark ? "bg-[#232323]" : "bg-white"
              }`}
            >
              {["ثبت قرارداد سرویس و نگهداری", "ثبت قرارداد جنرال", "ثبت قرارداد متفرقه"].map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onNewContract(x);
                  }}
                  className={`block w-full px-3 py-2.5 text-right text-[12.5px] ${t.hover} ${t.text}`}
                >
                  {x}
                </button>
              ))}
            </div>
          )}
        </div>
        {chip("در حال تمدید", 0, "bg-red-700")}
        {chip("پیش‌نویس", 0, "bg-neutral-600")}
        {chip("متفرقه", 0, "bg-amber-600")}
        {chip("جنرال", 0, "bg-sky-700")}
        {chip("فعال", contracts.length, "bg-green-700")}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1100px] text-[12.5px]">
          <thead className={`${t.head} ${t.sub}`}>
            <tr>
              {[
                "ردیف",
                "شماره قرارداد",
                "نام ساختمان",
                "نام مسئول هماهنگی",
                "منطقه",
                "آدرس",
                "تاریخ شروع",
                "تاریخ پایان",
                "",
              ].map((h, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2.5 text-right font-normal">
                  <span className="flex items-center gap-1">
                    {h} {h && i > 0 && i < 8 && <ChevronsUpDown size={11} className="opacity-50" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={t.text}>
            {paginatedList.map((c, i) => (
              <tr
                key={c.id}
                onClick={() => onOpenContract?.(c)}
                className={`cursor-pointer border-b ${t.border} ${t.row}`}
              >
                <td className="px-3 py-3">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3 py-3 font-mono font-bold text-violet-400">{c.no}</td>
                <td className="whitespace-nowrap px-3 py-3 font-medium">{c.building}</td>
                <td className="whitespace-nowrap px-3 py-3">{c.manager}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[11px]">
                    {c.zone}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 max-w-[200px] truncate" title={c.address || "قزوین"}>
                  {c.address || "قزوین"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px]">{c.start}</td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px]">{c.end}</td>
                <td className="px-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setRowMenu(rowMenu?.id === c.id ? null : { id: c.id, x: r.left, y: r.bottom });
                    }}
                    className={`rounded p-1 ${t.hover} ${t.sub}`}
                  >
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`flex items-center justify-between border-t ${t.border} px-3 py-2 text-[12px] ${t.text}`}>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className={`rounded border px-2 py-1 outline-none text-xs ${t.border} ${t.panel} ${t.sub}`}
          >
            <option value={20}>20 / صفحه</option>
            <option value={50}>50 / صفحه</option>
            <option value={100}>100 / صفحه</option>
            <option value={250}>250 / صفحه</option>
            <option value={500}>500 / صفحه</option>
            <option value={-1}>نمایش همه قراردادها</option>
          </select>
        </div>
        {pageSize !== -1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`p-1 rounded ${t.hover} disabled:opacity-30`}
            >
              <ChevronRight size={16} className={t.sub} />
            </button>
            <span className="px-2.5 py-0.5 rounded bg-violet-600 font-semibold text-center text-white text-xs">
              {page} از {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`p-1 rounded ${t.hover} disabled:opacity-30`}
            >
              <ChevronLeft size={16} className={t.sub} />
            </button>
          </div>
        )}
        <span className={t.sub}>{list.length.toLocaleString("fa-IR")} قرارداد</span>
      </div>

      {rowMenu &&
        (() => {
          const c = contracts.find((x) => x.id === rowMenu.id)!;
          const items = [
            { label: "مشاهده ی قرارداد", icon: Eye, ext: true, run: () => onOpenContract?.(c) },
            { label: "پرینت قرارداد", icon: Printer, ext: false, run: () => notify("پرینت قرارداد") },
            { label: "تمدید قرارداد", icon: RefreshCcw, ext: false, run: () => notify("تمدید قرارداد") },
            {
              label: "تمدید با امضای مشتری",
              icon: FileSignature,
              ext: false,
              run: () => notify("تمدید با امضای مشتری"),
            },
          ];
          return (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRowMenu(null)} />
              <div
                style={{ top: rowMenu.y + 2, left: rowMenu.x }}
                className={`fixed z-50 w-[215px] rounded border py-1 shadow-2xl ${t.border} ${
                  t.dark ? "bg-[#232323]" : "bg-white"
                }`}
              >
                {items.map((a) => {
                  const I = a.icon;
                  return (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => {
                        a.run();
                        setRowMenu(null);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-[12.5px] ${t.hover} ${t.text}`}
                    >
                      <span className="flex items-center gap-2">
                        <I size={14} className={t.sub} />
                        {a.label}
                      </span>
                      {a.ext && <SquareArrowOutUpRight size={13} className={t.sub} />}
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()}

      {toast && (
        <div className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 rounded bg-neutral-800 px-4 py-2 text-[12.5px] text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
