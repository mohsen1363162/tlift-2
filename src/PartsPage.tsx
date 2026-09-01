import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Settings,
  RotateCw,
  FileText,
  Sheet,
  Check,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Theme } from "./theme";
import { Field, inputCls, SearchSelect } from "./ui";
import { useParts, partsApi, PartItem, UNITS, COUNTRIES, CURRENCIES } from "./partsStore";

const fa = (n: string | number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const money = (n: number) => fa(n.toLocaleString("en-US")) + " ریال";
const PAGE = 12;

export default function PartsPage({ t }: { t: Theme }) {
  const parts = useParts();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<PartItem | "new" | null>(null);
  const [rowMenu, setRowMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const list = useMemo(
    () => parts.filter((p) => q.trim().length < 2 || (p.name + p.code + p.alias).includes(q.trim())),
    [parts, q]
  );
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className={`flex flex-wrap items-center gap-2 border-b ${t.border} px-3 py-2`}>
        <div className={`flex h-8 w-[240px] items-center gap-2 rounded border px-2 ${t.input}`}>
          <Search size={14} className={t.sub} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو خودکار با بیش از 2 کاراکتر"
            className="w-full bg-transparent text-[12px] outline-none"
          />
        </div>
        {[Filter, Settings, RotateCw, FileText, Sheet].map((I, i) => (
          <button key={i} type="button" className={`rounded p-1.5 ${t.hover} ${t.sub}`}>
            <I size={17} />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setModal("new")}
          className="rounded bg-violet-500 px-4 py-1.5 text-[12.5px] text-white hover:bg-violet-600"
        >
          قطعه جدید
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-[12.5px]">
          <thead className={`${t.head} ${t.sub}`}>
            <tr>
              {["ردیف", "کد", "نام", "نام مستعار", "واحد", "قطعه مصرفی", "قیمت", "توضیحات", ""].map(
                (h, i) => (
                  <th key={i} className="px-3 py-2.5 text-right font-normal">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className={t.text}>
            {shown.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => setModal(p)}
                className={`cursor-pointer border-b ${t.border} ${t.row}`}
              >
                <td className="px-3 py-3">{(page - 1) * PAGE + i + 1}</td>
                <td className="px-3 py-3">{fa(p.code)}</td>
                <td className="px-3 py-3">{p.name}</td>
                <td className="px-3 py-3">{p.alias}</td>
                <td className="px-3 py-3">{p.unit}</td>
                <td className="px-3 py-3">{p.consumable && <Check size={15} className="text-green-500" />}</td>
                <td className="px-3 py-3">{money(p.price)}</td>
                <td className="px-3 py-3">{p.desc}</td>
                <td className="px-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setRowMenu(rowMenu?.id === p.id ? null : { id: p.id, x: r.left, y: r.bottom });
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
        <div className={`flex items-center gap-1 rounded border px-2 py-1 ${t.border} ${t.sub}`}>
          <ChevronDown size={13} /> <span>20 / صفحه</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            className={`rounded p-1 ${t.hover} ${t.sub}`}
          >
            <ChevronRight size={15} />
          </button>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`h-6 w-6 rounded text-[12px] ${
                page === i + 1 ? "bg-violet-500 text-white" : `${t.hover} ${t.sub}`
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage(Math.min(pages, page + 1))}
            className={`rounded p-1 ${t.hover} ${t.sub}`}
          >
            <ChevronLeft size={15} />
          </button>
        </div>
        <span className={t.sub}>{fa(list.length)} مورد پیدا شد</span>
      </div>

      {rowMenu &&
        (() => {
          const p = parts.find((x) => x.id === rowMenu.id)!;
          return (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRowMenu(null)} />
              <div
                style={{ top: rowMenu.y + 2, left: rowMenu.x }}
                className={`fixed z-50 w-[170px] rounded border py-1 shadow-2xl ${t.border} ${
                  t.dark ? "bg-[#232323]" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setModal(p);
                    setRowMenu(null);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-[12.5px] ${t.hover} ${t.text}`}
                >
                  <Pencil size={14} className={t.sub} /> ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => {
                    partsApi.remove(p.id);
                    setRowMenu(null);
                    notify("قطعه حذف شد");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-[12.5px] text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={14} /> حذف
                </button>
              </div>
            </>
          );
        })()}

      {modal && (
        <PartModal
          t={t}
          item={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={(p) => {
            if (modal === "new") partsApi.add(p);
            else partsApi.update({ ...p, id: (modal as PartItem).id });
            setModal(null);
            notify("قطعه ثبت شد");
          }}
        />
      )}

      {toast && (
        <div className="absolute bottom-14 left-1/2 z-50 -translate-x-1/2 rounded bg-neutral-800 px-4 py-2 text-[12.5px] text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function PartModal({
  t,
  item,
  onClose,
  onSave,
}: {
  t: Theme;
  item: PartItem | null;
  onClose: () => void;
  onSave: (p: Omit<PartItem, "id">) => void;
}) {
  const [f, setF] = useState<Omit<PartItem, "id">>(
    item ?? {
      code: "",
      name: "",
      alias: "",
      unit: "",
      brand: "",
      country: "",
      desc: "",
      consumable: true,
      price: 0,
    }
  );
  const [currency, setCurrency] = useState("ریال");
  const [rate, setRate] = useState(0);
  const [convert, setConvert] = useState(1);
  const [curFactor, setCurFactor] = useState(1);
  const [rialFactor, setRialFactor] = useState(1);
  const [err, setErr] = useState("");
  const set = (k: string, v: string | boolean | number) => setF((s) => ({ ...s, [k]: v }));

  const finalPrice = Math.max(f.price * rialFactor, rate * convert * curFactor) || f.price || 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-5"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full max-w-[830px] rounded p-6 ${t.dark ? "bg-[#242424]" : "bg-white"} ${t.text}`}
      >
        <div className="mb-5 text-[15px]">{item ? "ویرایش قطعه" : "ایجاد قطعه جدید"}</div>

        <div className="grid grid-cols-3 gap-5">
          <Field label="نام" req>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls(t)} />
          </Field>
          <Field label="نام مستعار">
            <input value={f.alias} onChange={(e) => set("alias", e.target.value)} className={inputCls(t)} />
          </Field>
          <Field label="کد قطعه" req>
            <div className="flex items-center gap-2">
              <input value={f.code} onChange={(e) => set("code", e.target.value)} className={inputCls(t)} />
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border ${t.border} ${t.sub}`}
              >
                <ArrowUpDown size={14} />
              </span>
            </div>
          </Field>

          <Field label="واحد" req>
            <SearchSelect t={t} value={f.unit} onChange={(v) => set("unit", v)} options={UNITS} />
          </Field>
          <Field label="برند">
            <input value={f.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls(t)} />
          </Field>
          <Field label="کشور">
            <SearchSelect t={t} value={f.country} onChange={(v) => set("country", v)} options={COUNTRIES} />
          </Field>

          <Field label="شرح" className="col-span-3">
            <textarea
              value={f.desc}
              onChange={(e) => set("desc", e.target.value)}
              className={`h-28 w-full rounded border p-2 text-[12.5px] outline-none ${t.input}`}
            />
          </Field>
        </div>

        <label className="mt-3 flex items-center justify-end gap-2 text-[12.5px]">
          <span>قطعه مصرفی است.</span>
          <input
            type="checkbox"
            checked={f.consumable}
            onChange={(e) => set("consumable", e.target.checked)}
            className="h-4 w-4 accent-violet-500"
          />
        </label>

        <fieldset className={`mt-5 rounded border p-4 ${t.border}`}>
          <legend className={`px-2 text-[12.5px] ${t.sub}`}>مالی</legend>
          <div className="grid grid-cols-4 gap-5">
            <Field label="نرخ ارز" req>
              <input
                value={rate || ""}
                onChange={(e) => setRate(+e.target.value.replace(/\D/g, "") || 0)}
                className={inputCls(t)}
              />
              <div className={`mt-1 text-[11px] ${t.sub}`}>نرخ کالا برحسب ارز انتخابی</div>
            </Field>
            <Field label="ارز" req>
              <SearchSelect t={t} value={currency} onChange={setCurrency} options={CURRENCIES} />
            </Field>
            <Field label="تبدیل ارز" req>
              <div className="flex items-center gap-1">
                <input
                  value={convert}
                  onChange={(e) => setConvert(+e.target.value.replace(/\D/g, "") || 0)}
                  className={inputCls(t)}
                />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
              <div className={`mt-1 text-[11px] ${t.sub}`}>نرخ تبدیل قیمت ارز به ریال</div>
            </Field>
            <Field label="ضریب ارز" req>
              <input
                value={curFactor}
                onChange={(e) => setCurFactor(+e.target.value.replace(/\D/g, "") || 0)}
                className={inputCls(t)}
              />
            </Field>

            <Field label="نرخ ریالی" className="col-span-2">
              <div className="flex items-center gap-1">
                <input
                  value={f.price}
                  onChange={(e) => set("price", +e.target.value.replace(/\D/g, "") || 0)}
                  className={inputCls(t)}
                />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
            </Field>
            <Field label="ضریب ریالی" req className="col-span-2">
              <input
                value={rialFactor}
                onChange={(e) => setRialFactor(+e.target.value.replace(/\D/g, "") || 0)}
                className={inputCls(t)}
              />
            </Field>

            <Field label="قیمت نهایی" className="col-span-2">
              <div className="flex items-center gap-1">
                <input readOnly value={finalPrice} className={inputCls(t, "opacity-70")} />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
            </Field>
            <Field label="قیمت تمام شده" className="col-span-2">
              <div className="flex items-center gap-1">
                <input readOnly value={finalPrice} className={inputCls(t, "opacity-70")} />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
            </Field>
          </div>
        </fieldset>

        {err && <div className="mt-2 text-[12px] text-red-500">{err}</div>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!f.name || !f.code || !f.unit) {
                setErr("نام، کد قطعه و واحد الزامی است");
                return;
              }
              onSave({ ...f, price: finalPrice });
            }}
            className="rounded bg-violet-400 px-6 py-1.5 text-[12.5px] text-white hover:bg-violet-500"
          >
            ثبت
          </button>
          <button type="button" onClick={onClose} className={`rounded border px-5 py-1.5 text-[12.5px] ${t.border} ${t.hover}`}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
