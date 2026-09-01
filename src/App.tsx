import { useMemo, useState } from "react";
import {
  ArrowLeft,
  RotateCw,
  Search,
  Plus,
  Minus,
  Minimize2,
  X,
  Lock,
  Megaphone,
  Monitor,
  User,
  Headphones,
  MessageSquare,
  GitBranch,
  TerminalSquare,
  SquareArrowOutUpRight,
  LayoutGrid,
} from "lucide-react";
import {
  navItems,
  serviceMenu,
  fileMenu,
  settingsMenu,
  recentItems,
  MenuGroup,
  Contract,
} from "./data";
import StaffPage from "./StaffPage";
import PartsPage from "./PartsPage";
import { makeTheme } from "./theme";
import CustomersPage from "./CustomersPage";
import ContractsPage from "./ContractsPage";
import NewContractWizard from "./NewContractWizard";
import ContractView from "./ContractView";
import CustomerReportsPage from "./CustomerReportsPage";
import CsvUploadPage from "./CsvUploadPage";
import { useContracts, appStore } from "./store";

type Tab = {
  id: number;
  title: string;
  kind:
    | "home"
    | "customers"
    | "blank"
    | "contracts"
    | "newContract"
    | "contractView"
    | "staff"
    | "parts"
    | "debtorReport"
    | "customerReport"
    | "csvUpload";
  contract?: Contract;
  csvType?: "contracts" | "customers";
};

let uid = 100;

const menus: Record<string, MenuGroup[]> = {
  service: serviceMenu,
  file: fileMenu,
  settings: settingsMenu,
};

export default function App() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, title: "تب جدید", kind: "home" }]);
  const [active, setActive] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const contracts = useContracts();

  const t = makeTheme(dark);

  const filtered = useMemo(
    () => recentItems.filter((r) => r.title.includes(query.trim())),
    [query]
  );

  const addTab = (
    title = "تب جدید",
    kind: Tab["kind"] = "blank",
    contract?: Contract,
    csvType?: "contracts" | "customers"
  ) => {
    const id = ++uid;
    setTabs((s) => [...s, { id, title, kind, contract, csvType }]);
    setActive(id);
  };
  const closeTab = (id: number) => {
    setTabs((s) => {
      const n = s.filter((x) => x.id !== id);
      if (id === active && n.length) setActive(n[n.length - 1].id);
      return n;
    });
  };

  const openMenuItem = (label: string) => {
    if (label === "لیست مشتریان") addTab("مشتریان", "customers");
    else if (label === "چاپ گزارش مشتریان بدهکار") addTab("چاپ گزارش مشتریان بدهکار", "debtorReport");
    else if (label === "چاپ گزارش مشتریان") addTab("چاپ گزارش مشتریان", "customerReport");
    else if (label === "قرارداد ها" || label === "قراردادها") addTab("قرارداد ها", "contracts");
    else if (label === "سرویسکار و مسئول انجام") addTab("سرویس کار و مسئول انجام", "staff");
    else if (label === "قطعات" || label === "قطعات مصرفی") addTab("قطعه ها", "parts");
    else if (label.includes("مشتریان") && label.includes("CSV")) addTab("آپلود CSV مشتریان", "csvUpload", undefined, "customers");
    else if (label.includes("قرارداد") && label.includes("CSV")) addTab("آپلود CSV قراردادها", "csvUpload", undefined, "contracts");
    else if (label === "آپلود فایلهای CSV" || label.toLowerCase().includes("csv")) addTab("آپلود فایلهای CSV", "csvUpload", undefined, "contracts");
    else if (label.startsWith("ثبت قرارداد")) addTab("قرارداد جدید", "newContract");
    else addTab(label, "blank");
    setOpenMenu(null);
  };

  const openContractView = (c: Contract) => {
    const id = ++uid;
    setTabs((s) => [...s, { id, title: "مشاهده ی قرارداد", kind: "contractView", contract: c }]);
    setActive(id);
  };

  const current = tabs.find((x) => x.id === active);

  return (
    <div
      dir="rtl"
      className={`min-h-screen w-full text-right ${dark ? "bg-neutral-900" : "bg-neutral-200"} p-3 font-[Tahoma,system-ui]`}
    >
      <div
        className={`mx-auto flex h-[calc(100vh-24px)] max-w-[1400px] flex-col overflow-hidden rounded-md border ${t.border} ${t.body} shadow-2xl`}
      >
        {/* Title bar */}
        <div className={`flex items-center gap-2 ${t.chrome} px-2 py-1.5`}>
          <div className="flex items-center gap-1">
            <button type="button" className={`rounded p-1.5 ${t.hover} ${t.sub}`}>
              <ArrowLeft size={16} />
            </button>
            <button type="button" className={`rounded p-1.5 ${t.hover} ${t.sub}`}>
              <RotateCw size={16} />
            </button>
          </div>

          <div className={`flex h-7 w-[220px] items-center gap-2 rounded border px-2 ${t.input}`}>
            <Search size={13} className={t.sub} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو..."
              className="w-full bg-transparent text-[12px] outline-none"
            />
          </div>

          <div className="flex flex-1 items-center gap-[2px] overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`group flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-t px-3 text-[12px] ${
                  active === tab.id ? `${t.tabActive} ${t.text}` : `${t.sub} ${t.hover}`
                }`}
              >
                <span className="whitespace-nowrap">{tab.title}</span>
                {tabs.length > 1 && (
                  <X
                    size={13}
                    className="opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addTab("تب جدید", "home")}
              className={`rounded p-1.5 ${t.hover} ${t.sub}`}
            >
              <Plus size={16} />
            </button>
            <button type="button" className={`rounded p-1.5 ${t.hover} ${t.sub}`}>
              <LayoutGrid size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            title="تم شب و روز"
            className={`relative h-5 w-10 rounded-full transition ${dark ? "bg-neutral-600" : "bg-amber-400"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                dark ? "right-0.5" : "right-[22px]"
              }`}
            />
          </button>

          <div className={`flex items-center gap-1 ${t.sub}`}>
            <button type="button" className={`rounded p-1.5 ${t.hover}`}>
              <Minus size={15} />
            </button>
            <button type="button" className={`rounded p-1.5 ${t.hover}`}>
              <Minimize2 size={15} />
            </button>
            <button type="button" className="rounded p-1.5 hover:bg-red-600 hover:text-white">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1">
          {/* Sidebar */}
          <div className={`order-first flex w-[68px] shrink-0 flex-col overflow-y-auto border-s ${t.border} ${t.chrome}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const on = openMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpenMenu(on ? null : item.id)}
                  onMouseEnter={() => menus[item.id] && setOpenMenu(item.id)}
                  className={`relative flex flex-col items-center gap-1 border-b px-1 py-3 text-[10.5px] leading-4 ${
                    t.border
                  } ${on ? (dark ? "bg-white/10" : "bg-black/5") : ""} ${t.hover} ${t.text}`}
                >
                  {item.locked && <Lock size={10} className="absolute end-1 top-1 text-amber-500" />}
                  {item.badge && <span className="absolute start-1 top-2 h-3 w-3 rounded-full bg-orange-500" />}
                  <Icon size={19} className={t.sub} />
                  <span className="text-center">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Flyout */}
          {openMenu && menus[openMenu] && (
            <div
              onMouseLeave={() => setOpenMenu(null)}
              className={`absolute inset-y-0 right-[68px] z-30 flex w-[252px] flex-col border-e text-right ${
                t.border
              } ${t.chrome} shadow-[0_0_25px_rgba(0,0,0,.5)]`}
            >
              <div className="flex-1 overflow-y-auto">
                {menus[openMenu].map((g) => (
                  <div key={g.title}>
                    <div
                      className={`sticky top-0 z-10 px-3 py-2 text-right text-[12.5px] font-bold ${
                        dark ? "bg-[#2c2c2c]" : "bg-neutral-200"
                      } ${t.text}`}
                    >
                      {g.title}
                    </div>
                    {g.items.map((it) => (
                      <button
                        key={it}
                        type="button"
                        onClick={() => openMenuItem(it)}
                        className={`flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-[12px] ${
                          t.border
                        } ${t.hover} ${t.text}`}
                      >
                        <span className="text-right leading-5">{it}</span>
                        <SquareArrowOutUpRight size={13} className={t.sub} />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="flex min-w-0 flex-1 flex-col overflow-hidden"
            onClick={() => setOpenMenu(null)}
          >
            {current?.kind === "customers" ? (
              <CustomersPage
                t={t}
                onOpenTab={(title) => addTab(title, "blank")}
                onOpenContract={openContractView}
                onOpenCsvUpload={() => addTab("آپلود CSV مشتریان", "csvUpload", undefined, "customers")}
              />
            ) : current?.kind === "debtorReport" || current?.kind === "customerReport" ? (
              <CustomerReportsPage
                t={t}
                reportType={current.kind === "debtorReport" ? "debtors" : "general"}
                onOpenContract={openContractView}
                onOpenCustomerProfile={(name) => addTab(`پروفایل مشتری - ${name}`, "blank")}
              />
            ) : current?.kind === "contracts" ? (
              <ContractsPage
                t={t}
                contracts={contracts}
                onNewContract={() => addTab("قرارداد جدید", "newContract")}
                onOpenContract={openContractView}
                onOpenCsvUpload={() => addTab("آپلود CSV قراردادها", "csvUpload", undefined, "contracts")}
              />
            ) : current?.kind === "staff" ? (
              <StaffPage t={t} />
            ) : current?.kind === "parts" ? (
              <PartsPage t={t} />
            ) : current?.kind === "csvUpload" ? (
              <CsvUploadPage
                t={t}
                initialType={current.csvType || "contracts"}
                onOpenContracts={() => addTab("قرارداد ها", "contracts")}
                onOpenCustomers={() => addTab("مشتریان", "customers")}
              />
            ) : current?.kind === "contractView" && current.contract ? (
              <ContractView t={t} contract={current.contract} />
            ) : current?.kind === "newContract" ? (
              <NewContractWizard
                t={t}
                onSave={(nc) => {
                  appStore.addContract(nc);
                  setTabs((s) =>
                    s.map((x) =>
                      x.id === current.id
                        ? { ...x, title: "قرارداد ها", kind: "contracts" as const, contract: undefined }
                        : x
                    )
                  );
                }}
              />
            ) : (
              <div className="flex-1 overflow-y-auto px-10 py-6">
                <div className="mb-8 flex justify-center gap-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addTab("تب جدید", "home")}
                      className={`flex h-[120px] w-[120px] items-center justify-center rounded border-2 border-dashed ${t.card} ${t.sub} ${t.hover}`}
                    >
                      <Plus size={30} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
                <div className="mx-auto w-full max-w-[880px]">
                  {filtered.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const target = r.title.split(" - ").pop()!;
                        openMenuItem(target);
                      }}
                      className={`flex cursor-pointer items-center justify-between border-b px-4 py-4 text-[13px] ${t.border} ${t.hover} ${t.text}`}
                    >
                      <span className={t.sub}>{r.time}</span>
                      <span>{r.title}</span>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className={`py-10 text-center text-[13px] ${t.sub}`}>موردی یافت نشد</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div
          className={`flex items-center justify-between border-t ${t.border} ${t.chrome} px-3 py-1.5 text-[11.5px] ${t.sub}`}
        >
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1">
              <Megaphone size={13} /> اعلان ها
            </span>
            <span className="flex items-center gap-1">
              <Monitor size={13} /> شماره اشتراک 141
            </span>
            <span className="flex items-center gap-1">
              <User size={13} /> محسن امامی عزیز خوش آمدید!
            </span>
            <span className="flex items-center gap-1">
              <Headphones size={13} /> پشتیبانی
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={13} /> مانده پیامک: ۵٬۳۲۶٬۳۹۸ ریال
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="rounded bg-pink-300 px-2 py-0.5 text-[11px] font-medium text-neutral-900">
              ⊙ جهت نصب نسخه جدید نرم افزار کلیک کنید.
            </span>
            <span className="flex items-center gap-1">
              <GitBranch size={13} /> نسخه 1.1.22
            </span>
            <span className="flex items-center gap-1">
              <TerminalSquare size={13} /> توسعه و پشتیبانی توسط توانمند
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
