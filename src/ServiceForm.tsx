import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Trash2,
  UserRound,
  Plus,
  Clock,
  Inbox,
  Printer,
  Wrench,
} from "lucide-react";
import type { Theme } from "./theme";
import { Field, inputCls, SearchSelect, DatePicker, TimePicker } from "./ui";
import { TECHS } from "./ServicesCalendar";
import { partsApi } from "./partsStore";

const fa = (n: string | number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const money = (n: number) => fa(n.toLocaleString("en-US")) + " ریال";

export type Fault = { by: string; date: string; reason: string };
export type Part = { code: string; name: string; unit: string; qty: number; price: number };

export default function ServiceForm({
  t,
  planDate,
  initialData,
  onBack,
  onSubmit,
}: {
  t: Theme;
  planDate: string;
  initialData?: {
    techs?: string[];
    doneBy?: string;
    report?: string;
    reminder?: string;
    doneDate?: string;
    inTime?: string;
    outTime?: string;
    wage?: number;
    trip?: number;
    discount?: number;
    faultsList?: string[];
    partsList?: Part[];
  };
  onBack: () => void;
  onSubmit: (data: {
    techs: string[];
    doneBy: string;
    doneDate: string;
    inTime: string;
    outTime: string;
    report: string;
    reminder: string;
    total: number;
    parts: number;
    wage: number;
    trip: number;
    discount: number;
    faults: number;
    faultsList: string[];
    partsList: Part[];
  }) => void;
}) {
  const [serial] = useState("775521");
  const [techs, setTechs] = useState<string[]>(initialData?.techs || [...TECHS]);
  const [doneBy, setDoneBy] = useState(initialData?.doneBy || initialData?.techs?.[0] || "");
  const [report, setReport] = useState(initialData?.report || "");
  const [reminder, setReminder] = useState(initialData?.reminder || "");
  const [followUp, setFollowUp] = useState("");
  const [doneDate, setDoneDate] = useState(initialData?.doneDate || "");
  const [inTime, setInTime] = useState(initialData?.inTime || "10:00");
  const [outTime, setOutTime] = useState(initialData?.outTime || "11:30");
  const [wage, setWage] = useState(initialData?.wage || 0);
  const [trip, setTrip] = useState(initialData?.trip || 0);
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [faults, setFaults] = useState<Fault[]>(
    initialData?.faultsList?.map((r) => ({ by: "سرویسکار", date: initialData?.doneDate || "1405/03/25", reason: r })) || []
  );
  const [parts, setParts] = useState<Part[]>(initialData?.partsList || []);
  const [showFault, setShowFault] = useState(false);
  const [showPart, setShowPart] = useState(false);
  const [err, setErr] = useState("");

  const base = 8500000;
  const partsTotal = useMemo(() => parts.reduce((s, p) => s + p.qty * p.price, 0), [parts]);
  const total = base + wage + trip + partsTotal - discount;

  const addTech = () => {
    const rest = TECHS.filter((x) => !techs.includes(x));
    if (rest.length) setTechs([...techs, rest[0]]);
  };

  const submit = () => {
    if (!doneBy || !doneDate || !inTime || !outTime) {
      setErr("سرویس‌کار انجام دهنده، تاریخ انجام و ساعت ورود/خروج الزامی است");
      return;
    }
    onSubmit({
      techs,
      doneBy,
      doneDate,
      inTime,
      outTime,
      report,
      reminder,
      total,
      parts: partsTotal,
      wage,
      trip,
      discount,
      faults: faults.length,
      faultsList: faults.map((f) => f.reason),
      partsList: parts,
    });
  };

  const box = `rounded border ${t.border} p-4`;

  return (
    <div className={`h-full overflow-y-auto p-4 ${t.text}`}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-1 rounded border px-3 py-1.5 text-[12.5px] ${t.border} ${t.hover}`}
        >
          <ArrowLeft size={14} /> بازگشت
        </button>
        <div className="flex items-center gap-2 text-[17px]">
          <span>انجام سرویس</span>
          <Check size={22} className={t.sub} />
        </div>
      </div>

      <div className={`my-4 border-t border-dashed ${t.border}`} />

      <div className="grid grid-cols-12 gap-5">
        {/* right main column */}
        <div className="col-span-9 space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <Field label="سریال برگه سرویس" req>
              <input readOnly value={serial} className={inputCls(t)} />
            </Field>
            <div className="col-span-2">
              <div className="mb-1 text-[12.5px]">
                <span className="text-red-500">* </span>سرویس کاران
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {techs.map((x) => (
                  <span key={x} className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[12px] ${t.border}`}>
                    <Trash2
                      size={13}
                      className="cursor-pointer text-red-500"
                      onClick={() => setTechs(techs.filter((y) => y !== x))}
                    />
                    <span>{x}</span>
                    <UserRound size={13} className={t.sub} />
                  </span>
                ))}
                <button
                  type="button"
                  onClick={addTech}
                  className="flex items-center gap-1 rounded bg-violet-400 px-3 py-1.5 text-[12px] text-white hover:bg-violet-500"
                >
                  <Plus size={13} /> افزودن سرویس کار
                </button>
              </div>
            </div>
          </div>

          <Field label="سرویس کار انجام دهنده" req>
            <SearchSelect t={t} value={doneBy} onChange={setDoneBy} options={techs} />
          </Field>

          <div className="grid grid-cols-3 gap-5">
            <Field label="گزارش سرویس کار">
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                className={`h-24 w-full rounded border p-2 text-[12.5px] outline-none ${t.input}`}
              />
            </Field>
            <Field label="یادآور سرویس">
              <textarea
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className={`h-24 w-full rounded border p-2 text-[12.5px] outline-none ${t.input}`}
              />
            </Field>
            <Field label="پیگیری مشتری برای سرویس">
              <textarea
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className={`h-24 w-full rounded border p-2 text-[12.5px] outline-none ${t.input}`}
              />
            </Field>
          </div>

          {/* faults */}
          <div className={box}>
            <div className="mb-3 flex justify-start">
              <button
                type="button"
                onClick={() => setShowFault(true)}
                className="rounded bg-violet-400 px-4 py-1.5 text-[12.5px] text-white hover:bg-violet-500"
              >
                افزودن خرابی
              </button>
            </div>
            <table className="w-full text-[12.5px]">
              <thead className={t.sub}>
                <tr className={`border-b ${t.border}`}>
                  <th className="px-3 py-2 text-right font-normal">ثبت توسط</th>
                  <th className="px-3 py-2 text-right font-normal">تاریخ اعلام</th>
                  <th className="px-3 py-2 text-center font-normal">دلایل</th>
                  <th className="px-3 py-2 text-center font-normal">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {faults.map((f, i) => (
                  <tr key={i} className={`border-b ${t.border}`}>
                    <td className="px-3 py-2.5">{f.by}</td>
                    <td className="px-3 py-2.5">{f.date}</td>
                    <td className="px-3 py-2.5 text-center">{f.reason}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Trash2
                        size={14}
                        className="mx-auto cursor-pointer text-red-500"
                        onClick={() => setFaults(faults.filter((_, j) => j !== i))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {faults.length === 0 && (
              <div className={`flex flex-col items-center gap-2 py-10 text-[12.5px] ${t.sub}`}>
                <Inbox size={44} /> داده‌ای موجود نیست
              </div>
            )}
          </div>

          {/* parts */}
          <div className={box}>
            <div className="mb-3 flex justify-start">
              <button
                type="button"
                onClick={() => setShowPart(true)}
                className="flex items-center gap-1 rounded bg-violet-400 px-4 py-1.5 text-[12.5px] text-white hover:bg-violet-500"
              >
                <Wrench size={13} /> مدیریت قطعات
              </button>
            </div>
            <table className="w-full text-[12.5px]">
              <thead className={t.sub}>
                <tr className={`border-b ${t.border}`}>
                  {["کد قطعه", "نام قطعه", "واحد", "تعداد", "قیمت واحد", "قیمت کل", "حذف"].map((h) => (
                    <th key={h} className="px-3 py-2 text-right font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => (
                  <tr key={i} className={`border-b ${t.border}`}>
                    <td className="px-3 py-2.5">{p.code}</td>
                    <td className="px-3 py-2.5">{p.name}</td>
                    <td className="px-3 py-2.5">{p.unit}</td>
                    <td className="px-3 py-2.5">{fa(p.qty)}</td>
                    <td className="px-3 py-2.5">{money(p.price)}</td>
                    <td className="px-3 py-2.5">{money(p.qty * p.price)}</td>
                    <td className="px-3 py-2.5">
                      <Trash2
                        size={14}
                        className="cursor-pointer text-red-500"
                        onClick={() => setParts(parts.filter((_, j) => j !== i))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parts.length === 0 && (
              <div className={`flex flex-col items-center gap-2 py-10 text-[12.5px] ${t.sub}`}>
                <Printer size={44} /> قطعه‌ای موجود نیست
              </div>
            )}
          </div>
        </div>

        {/* left side column */}
        <div className="col-span-3 space-y-4">
          <div className="text-[15px]">یادآورهای دستگاه و سرویس</div>
          <div className={`text-[12px] ${t.sub}`}>{fa(0)} یادآور تنظیم شده</div>
          <div className={`flex flex-col items-center gap-2 py-6 text-[12px] ${t.sub}`}>
            <Inbox size={40} /> یادآوری تنظیم نشده است.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="تاریخ انجام" req>
              <DatePicker t={t} value={doneDate} onChange={setDoneDate} />
            </Field>
            <Field label="تاریخ برنامه ریزی">
              <input readOnly value={planDate} className={inputCls(t, "opacity-70")} />
            </Field>
            <Field label="ساعت ورود" req>
              <TimePicker
                t={t}
                value={inTime}
                onChange={setInTime}
                placeholder="انتخاب ساعت ورود"
              />
            </Field>
            <Field label="ساعت خروج" req>
              <TimePicker
                t={t}
                value={outTime}
                onChange={setOutTime}
                placeholder="انتخاب ساعت خروج"
              />
            </Field>
            <Field label="دستمزد">
              <div className="flex items-center gap-1">
                <input
                  value={wage}
                  onChange={(e) => setWage(+e.target.value.replace(/\D/g, "") || 0)}
                  className={inputCls(t)}
                />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
            </Field>
            <Field label="ایاب ذهاب">
              <div className="flex items-center gap-1">
                <input
                  value={trip}
                  onChange={(e) => setTrip(+e.target.value.replace(/\D/g, "") || 0)}
                  className={inputCls(t)}
                />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
            </Field>
            <Field label="تخفیف" className="col-span-2">
              <div className="flex items-center gap-1">
                <input
                  value={discount}
                  onChange={(e) => setDiscount(+e.target.value.replace(/\D/g, "") || 0)}
                  className={inputCls(t)}
                />
                <span className={`rounded border px-2 py-1.5 text-[11px] ${t.border} ${t.sub}`}>ریال</span>
              </div>
            </Field>
          </div>

          <div className={`overflow-hidden rounded border text-[12px] ${t.border}`}>
            {[
              ["مبلغ", base],
              ["دستمزد", wage],
              ["قطعات", partsTotal],
              ["ایاب و ذهاب", trip],
              ["تخفیف", discount],
              ["مالیات", 0],
            ].map(([k, v]) => (
              <div key={k as string} className={`flex justify-between border-b px-3 py-2 ${t.border}`}>
                <span>{money(v as number)}</span>
                <span className={t.sub}>{k}</span>
              </div>
            ))}
            <div className="flex justify-between bg-violet-400 px-3 py-2 text-neutral-900">
              <span>{money(total)}</span>
              <span>مبلغ نهایی</span>
            </div>
          </div>

          {err && <div className="text-[12px] text-red-500">{err}</div>}
          <button
            type="button"
            onClick={submit}
            className="w-full rounded bg-violet-500 py-2 text-[12.5px] text-white hover:bg-violet-600"
          >
            ثبت گزارش سرویس
          </button>
        </div>
      </div>

      {showFault && (
        <FaultModal
          t={t}
          onClose={() => setShowFault(false)}
          onSave={(f) => {
            setFaults([...faults, f]);
            setShowFault(false);
          }}
        />
      )}
      {showPart && (
        <PartModal
          t={t}
          onClose={() => setShowPart(false)}
          onSave={(p) => {
            setParts([...parts, p]);
            setShowPart(false);
          }}
        />
      )}
    </div>
  );
}

function FaultModal({
  t,
  onClose,
  onSave,
}: {
  t: Theme;
  onClose: () => void;
  onSave: (f: Fault) => void;
}) {
  const [by, setBy] = useState(TECHS[2]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full max-w-[520px] space-y-4 rounded p-5 ${t.dark ? "bg-[#242424]" : "bg-white"} ${t.text}`}
      >
        <div className="text-[14px]">افزودن خرابی</div>
        <Field label="ثبت توسط">
          <SearchSelect t={t} value={by} onChange={setBy} options={TECHS} />
        </Field>
        <Field label="تاریخ اعلام">
          <DatePicker t={t} value={date} onChange={setDate} />
        </Field>
        <Field label="دلایل">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`h-24 w-full rounded border p-2 text-[12.5px] outline-none ${t.input}`}
          />
        </Field>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave({ by, date: date || "-", reason: reason || "-" })}
            className="rounded bg-violet-500 px-5 py-1.5 text-[12.5px] text-white"
          >
            ثبت
          </button>
          <button type="button" onClick={onClose} className={`rounded border px-5 py-1.5 text-[12.5px] ${t.border}`}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

function PartModal({
  t,
  onClose,
  onSave,
}: {
  t: Theme;
  onClose: () => void;
  onSave: (p: Part) => void;
}) {
  const [p, setP] = useState<Part>({ code: "", name: "", unit: "عدد", qty: 1, price: 0 });
  const catalog = partsApi.all();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full max-w-[620px] space-y-4 rounded p-5 ${t.dark ? "bg-[#242424]" : "bg-white"} ${t.text}`}
      >
        <div className="text-[14px]">مدیریت قطعات</div>
        <Field label="انتخاب از فهرست قطعات">
          <SearchSelect
            t={t}
            value={p.name}
            placeholder="جستجوی قطعه..."
            options={catalog.map((c) => c.name)}
            onChange={(v) => {
              const c = catalog.find((x) => x.name === v);
              if (c) setP({ code: c.code, name: c.name, unit: c.unit, qty: 1, price: c.price });
            }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="کد قطعه">
            <input value={p.code} onChange={(e) => setP({ ...p, code: e.target.value })} className={inputCls(t)} />
          </Field>
          <Field label="نام قطعه">
            <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className={inputCls(t)} />
          </Field>
          <Field label="واحد">
            <SearchSelect
              t={t}
              value={p.unit}
              onChange={(v) => setP({ ...p, unit: v })}
              options={["عدد", "لیتر", "متر", "کیلوگرم", "بسته"]}
            />
          </Field>
          <Field label="تعداد">
            <input
              value={p.qty}
              onChange={(e) => setP({ ...p, qty: +e.target.value.replace(/\D/g, "") || 0 })}
              className={inputCls(t)}
            />
          </Field>
          <Field label="قیمت واحد (ریال)" className="col-span-2">
            <input
              value={p.price}
              onChange={(e) => setP({ ...p, price: +e.target.value.replace(/\D/g, "") || 0 })}
              className={inputCls(t)}
            />
          </Field>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave(p)}
            className="rounded bg-violet-500 px-5 py-1.5 text-[12.5px] text-white"
          >
            ثبت
          </button>
          <button type="button" onClick={onClose} className={`rounded border px-5 py-1.5 text-[12.5px] ${t.border}`}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
