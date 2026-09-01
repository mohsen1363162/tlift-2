import { useSyncExternalStore } from "react";
import { Contract, Customer, Staff, initialContracts, initialCustomers, initialStaff } from "./data";
import {
  RAW_CSV_DATA,
  RAW_CUSTOMERS_CSV_DATA,
  parseContractsCsv,
  convertRowToContract,
  parseCustomersCsv,
  convertRowToCustomer,
} from "./csvData";

// Type definitions
export type ServicePartItem = {
  code?: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
};

export type MonthService = {
  id: number;
  m: string;
  y: number;
  done: boolean;
  date?: string;
  inTime?: string;
  outTime?: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  paidMethod?: string;
  paidRef?: string;
  techs?: string[];
  doneBy?: string;
  report?: string;
  reminder?: string;
  faultsCount?: number;
  faultsList?: string[];
  partsAmount?: number;
  partsList?: ServicePartItem[];
  wage?: number;
  trip?: number;
  discount?: number;
};

export type PaymentRecord = {
  id: number;
  title: string;
  date: string;
  amount: number;
  method: string;
  ref?: string;
  monthId?: number;
};

export type Invoice = {
  id: number;
  title: string;
  date: string;
  amount: number;
  parts: number;
  wage: number;
};

export type ContractDetails = {
  months: MonthService[];
  payments: PaymentRecord[];
  invoices: Invoice[];
};

const DEFAULT_MONTHS_NAMES = [
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
  "فروردین",
  "اردیبهشت",
];

export function generateInitialMonths(startYear = 1405, monthlyAmount = 8500000): MonthService[] {
  return [
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
    "فروردین",
    "اردیبهشت",
  ].map((m, i) => {
    const y = i >= 10 ? startYear + 1 : startYear;
    const isFirst = i === 0;
    return {
      id: i + 1,
      m,
      y,
      done: isFirst,
      date: isFirst ? `${y}/03/25` : undefined,
      inTime: isFirst ? "10:00" : undefined,
      outTime: isFirst ? "11:30" : undefined,
      amount: monthlyAmount,
      paid: isFirst,
      paidDate: isFirst ? `${y}/03/26` : undefined,
      paidMethod: isFirst ? "کارت به کارت" : undefined,
      paidRef: isFirst ? "TRX-89301" : undefined,
      doneBy: isFirst ? "علی کاظمی" : undefined,
      techs: isFirst ? ["علی کاظمی", "محمد رضایی"] : undefined,
      report: isFirst
        ? "سرویس ماهیانه موتورخانه، آچارکشی اتصالات ریل‌ها، بازبینی روغن گیربکس و تنظیم سنسورهای توقف طبقات با موفقیت انجام شد."
        : undefined,
      faultsCount: isFirst ? 1 : 0,
      faultsList: isFirst ? ["لرزش جزئی در حرکت بین طبقات ۲ و ۳ که با رگلاژ کفشک‌ها برطرف شد"] : [],
      partsAmount: isFirst ? 1850000 : 0,
      partsList: isFirst
        ? [
            { code: "29304", name: "روغن ریل ۱ لیتری", unit: "لیتر", qty: 1, price: 650000 },
            { code: "29307", name: "لنت کفشک کابین", unit: "جفت", qty: 1, price: 1200000 },
          ]
        : [],
      wage: isFirst ? 500000 : 0,
    };
  });
}

// LocalStorage helpers
function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}`, e);
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving to localStorage for ${key}`, e);
  }
}

// In-Memory Global State
let contracts: Contract[] = loadStorage<Contract[]>("tlift_contracts", initialContracts);
let customers: Customer[] = loadStorage<Customer[]>("tlift_customers", initialCustomers);
let staff: Staff[] = loadStorage<Staff[]>("tlift_staff", initialStaff);

// Auto-seed CSV contracts if only default demo contracts are present
const isCsvSeeded = loadStorage<boolean>("tlift_csv_seeded_v1", false);
if (!isCsvSeeded) {
  try {
    const csvRows = parseContractsCsv(RAW_CSV_DATA);
    let nextId = contracts.length > 0 ? Math.max(...contracts.map((c) => c.id)) + 1 : 1;
    let nextCustId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;

    csvRows.forEach((row) => {
      const existingIdx = contracts.findIndex((c) => c.no === row.no);
      const converted = convertRowToContract(row, existingIdx >= 0 ? contracts[existingIdx].id : nextId);
      if (existingIdx >= 0) {
        contracts[existingIdx] = { ...contracts[existingIdx], ...converted };
      } else {
        contracts.push(converted);
        nextId++;
      }

      const custName = row.customer.trim();
      if (custName && !customers.some((c) => c.name === custName)) {
        customers.push({
          id: nextCustId++,
          name: custName,
          buildings: 1,
          active: !row.isCanceled,
          suspended: false,
          sms: true,
          phone: row.phone || row.coordinatorPhone,
        });
      }
    });

    saveStorage("tlift_contracts", contracts);
    saveStorage("tlift_customers", customers);
    saveStorage("tlift_csv_seeded_v1", true);
  } catch (e) {
    console.error("Error auto-seeding CSV contracts", e);
  }
}

// Auto-seed customers if customers list is small/default
const isCustCsvSeeded = loadStorage<boolean>("tlift_cust_csv_seeded_v1", false);
if (!isCustCsvSeeded) {
  try {
    const custRows = parseCustomersCsv(RAW_CUSTOMERS_CSV_DATA);
    customers = custRows.map((r, i) => convertRowToCustomer(r, i + 1));
    saveStorage("tlift_customers", customers);
    saveStorage("tlift_cust_csv_seeded_v1", true);
  } catch (e) {
    console.error("Error auto-seeding CSV customers", e);
  }
}
const contractDetailsMap: Record<number, ContractDetails> = loadStorage<Record<number, ContractDetails>>(
  "tlift_contract_details",
  {
    1: {
      months: [
        {
          id: 1,
          m: "خرداد",
          y: 1405,
          done: true,
          date: "1405/03/25",
          amount: 8500000,
          paid: true,
          paidDate: "1405/03/26",
          paidMethod: "کارت به کارت",
          paidRef: "TRX-89301",
        },
        { id: 2, m: "تیر", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 3, m: "مرداد", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 4, m: "شهریور", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 5, m: "مهر", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 6, m: "آبان", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 7, m: "آذر", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 8, m: "دی", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 9, m: "بهمن", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 10, m: "اسفند", y: 1405, done: false, amount: 8500000, paid: false },
        { id: 11, m: "فروردین", y: 1406, done: false, amount: 8500000, paid: false },
        { id: 12, m: "اردیبهشت", y: 1406, done: false, amount: 8500000, paid: false },
      ],
      payments: [
        {
          id: 1,
          title: "پیش‌پرداخت اولیه قرارداد",
          date: "1405/03/01",
          amount: 8500000,
          method: "کارت به کارت",
          ref: "TRX-89301",
          monthId: 1,
        },
      ],
      invoices: [],
    },
  }
);

// Event Listeners for reactivity
const listeners = new Set<() => void>();
const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
};

// Store API
export const appStore = {
  // CONTRACTS
  getContracts: () => contracts,
  getOrCreateContractForCustomer: (customerName: string, debtorAmount?: number): Contract => {
    const cleanName = customerName.replace(/^\*\s*/, "").trim();
    // Try to find existing
    const existing = contracts.find(
      (c) =>
        c.building.includes(cleanName) ||
        c.manager.includes(cleanName) ||
        cleanName.includes(c.building.replace(/^\*\s*/, "").trim())
    );
    if (existing) return existing;

    // Create new contract for this customer
    const nextId = contracts.length > 0 ? Math.max(...contracts.map((c) => c.id)) + 1 : 1;
    const contractNo = (5100 + nextId).toString();
    const newContract: Contract = {
      id: nextId,
      no: contractNo,
      building: `* ${cleanName}`,
      manager: `${cleanName.split(" ")[0]} (مدیر ساختمان)`,
      zone: cleanName.includes("کوچه") ? "مرکز شهر" : "شهرک قدس",
      start: "1 خرداد 1405",
      end: "31 اردیبهشت 1406",
      kind: "general",
    };

    contracts = [newContract, ...contracts];
    saveStorage("tlift_contracts", contracts);

    // Initialize custom months and invoices/payments to reflect debt if provided
    const monthlyRate = 7500000;
    const months = generateInitialMonths(1405, monthlyRate);
    
    // If debtor amount specified, generate realistic invoices and past services
    const invoices: Invoice[] = [];
    const payments: PaymentRecord[] = [];

    if (debtorAmount && debtorAmount > 0) {
      invoices.push({
        id: Date.now() - 100000,
        title: "فاکتور تعمیرات و قطعات دوره قبل",
        date: "1405/02/15",
        amount: Math.round(debtorAmount * 0.4),
        parts: Math.round(debtorAmount * 0.3),
        wage: Math.round(debtorAmount * 0.1),
      });
    }

    contractDetailsMap[nextId] = {
      months,
      payments,
      invoices,
    };
    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();

    return newContract;
  },
  addContract: (newC: Omit<Contract, "id">) => {
    const nextId = contracts.length > 0 ? Math.max(...contracts.map((c) => c.id)) + 1 : 1;
    const contract: Contract = { ...newC, id: nextId };
    contracts = [contract, ...contracts];
    saveStorage("tlift_contracts", contracts);

    // Also initialize months for this contract
    if (!contractDetailsMap[nextId]) {
      contractDetailsMap[nextId] = {
        months: generateInitialMonths(1405, 8500000),
        payments: [],
        invoices: [],
      };
      saveStorage("tlift_contract_details", contractDetailsMap);
    }

    notifyListeners();
    return contract;
  },
  updateContract: (updated: Contract) => {
    contracts = contracts.map((c) => (c.id === updated.id ? updated : c));
    saveStorage("tlift_contracts", contracts);
    notifyListeners();
  },
  deleteContract: (id: number) => {
    contracts = contracts.filter((c) => c.id !== id);
    saveStorage("tlift_contracts", contracts);
    delete contractDetailsMap[id];
    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();
  },

  importContractsFromCsv: (csvText: string, mode: "merge" | "replace" = "replace") => {
    const rows = parseContractsCsv(csvText);
    if (!rows.length) return { totalRows: 0, contractsAdded: 0, contractsUpdated: 0, customersAdded: 0 };

    if (mode === "replace") {
      contracts = [];
      customers = [];
    }

    let nextId = contracts.length > 0 ? Math.max(...contracts.map((c) => c.id)) + 1 : 1;
    let nextCustId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;

    let contractsAdded = 0;
    let contractsUpdated = 0;
    let customersAdded = 0;

    rows.forEach((row, idx) => {
      // In replace mode, always push new contract with unique ID
      const existingIdx = mode === "merge" && row.no ? contracts.findIndex((c) => c.no === row.no) : -1;
      const contractId = existingIdx >= 0 ? contracts[existingIdx].id : nextId++;
      const converted = convertRowToContract(row, contractId);

      if (existingIdx >= 0) {
        contracts[existingIdx] = { ...contracts[existingIdx], ...converted };
        contractsUpdated++;
      } else {
        contracts.push(converted);
        contractsAdded++;
      }

      const custName = (row.customer || `مشتری ${idx + 1}`).trim();
      if (custName && !customers.some((c) => c.name === custName)) {
        customers.push({
          id: nextCustId++,
          name: custName,
          buildings: 1,
          active: !row.isCanceled,
          suspended: false,
          sms: true,
          phone: row.phone || row.coordinatorPhone,
        });
        customersAdded++;
      }
    });

    saveStorage("tlift_contracts", contracts);
    saveStorage("tlift_customers", customers);
    notifyListeners();

    return { totalRows: rows.length, contractsAdded, contractsUpdated, customersAdded };
  },

  // CONTRACT DETAILS (Months, Services, Payments, Invoices)
  getContractDetails: (contractId: number): ContractDetails => {
    if (!contractDetailsMap[contractId]) {
      contractDetailsMap[contractId] = {
        months: generateInitialMonths(1405, 8500000),
        payments: [],
        invoices: [],
      };
      saveStorage("tlift_contract_details", contractDetailsMap);
    }
    return contractDetailsMap[contractId];
  },

  updateMonthService: (
    contractId: number,
    monthId: number,
    patch: Partial<MonthService>
  ) => {
    const details = appStore.getContractDetails(contractId);
    const updatedMonths = details.months.map((m) => (m.id === monthId ? { ...m, ...patch } : m));
    contractDetailsMap[contractId] = { ...details, months: updatedMonths };
    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();
  },

  addServiceSubmission: (
    contractId: number,
    monthId: number,
    serviceData: {
      techs: string[];
      doneBy?: string;
      doneDate: string;
      inTime?: string;
      outTime?: string;
      report?: string;
      reminder?: string;
      total: number;
      parts: number;
      wage: number;
      trip: number;
      discount: number;
      faults: number;
      faultsList?: string[];
      partsList?: ServicePartItem[];
    }
  ) => {
    const details = appStore.getContractDetails(contractId);
    const targetMonth = details.months.find((m) => m.id === monthId);

    const updatedMonths = details.months.map((m) =>
      m.id === monthId
        ? {
            ...m,
            done: true,
            date: serviceData.doneDate,
            inTime: serviceData.inTime,
            outTime: serviceData.outTime,
            amount: serviceData.total || m.amount,
            techs: serviceData.techs,
            doneBy: serviceData.doneBy,
            report: serviceData.report,
            reminder: serviceData.reminder,
            faultsCount: serviceData.faults,
            faultsList: serviceData.faultsList,
            partsAmount: serviceData.parts,
            partsList: serviceData.partsList,
            wage: serviceData.wage,
            trip: serviceData.trip,
            discount: serviceData.discount,
          }
        : m
    );

    const newInvoice: Invoice = {
      id: Date.now(),
      title: `سرویس ${targetMonth ? `${targetMonth.m} ${targetMonth.y}` : "دوره"}`,
      date: serviceData.doneDate,
      amount: serviceData.total,
      parts: serviceData.parts,
      wage: serviceData.wage,
    };

    contractDetailsMap[contractId] = {
      ...details,
      months: updatedMonths,
      invoices: [...details.invoices, newInvoice],
    };

    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();
  },

  addPayment: (
    contractId: number,
    payment: Omit<PaymentRecord, "id">,
    markMonthId?: number
  ) => {
    const details = appStore.getContractDetails(contractId);
    const newRecord: PaymentRecord = { ...payment, id: Date.now() };

    let updatedMonths = details.months;
    if (markMonthId) {
      updatedMonths = details.months.map((m) =>
        m.id === markMonthId
          ? {
              ...m,
              paid: true,
              paidDate: payment.date,
              paidMethod: payment.method,
              paidRef: payment.ref,
            }
          : m
      );
    }

    contractDetailsMap[contractId] = {
      ...details,
      months: updatedMonths,
      payments: [...details.payments, newRecord],
    };

    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();
  },

  cancelMonthPayment: (contractId: number, monthId: number) => {
    const details = appStore.getContractDetails(contractId);
    const updatedMonths = details.months.map((m) =>
      m.id === monthId
        ? {
            ...m,
            paid: false,
            paidDate: undefined,
            paidMethod: undefined,
            paidRef: undefined,
          }
        : m
    );

    const updatedPayments = details.payments.filter((p) => p.monthId !== monthId);

    contractDetailsMap[contractId] = {
      ...details,
      months: updatedMonths,
      payments: updatedPayments,
    };

    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();
  },

  addMonthServiceSlot: (contractId: number) => {
    const details = appStore.getContractDetails(contractId);
    const nextId = details.months.length + 1;
    const lastMonth = details.months[details.months.length - 1];
    const newMonth: MonthService = {
      id: nextId,
      m: "سرویس دوره‌ای",
      y: lastMonth ? lastMonth.y : 1405,
      done: false,
      amount: lastMonth ? lastMonth.amount : 8500000,
      paid: false,
    };

    contractDetailsMap[contractId] = {
      ...details,
      months: [...details.months, newMonth],
    };

    saveStorage("tlift_contract_details", contractDetailsMap);
    notifyListeners();
  },

  // CUSTOMERS
  getCustomers: () => customers,
  addCustomer: (newCust: Omit<Customer, "id">) => {
    const nextId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
    const cust: Customer = { ...newCust, id: nextId };
    customers = [cust, ...customers];
    saveStorage("tlift_customers", customers);
    notifyListeners();
    return cust;
  },
  updateCustomer: (updated: Customer) => {
    customers = customers.map((c) => (c.id === updated.id ? updated : c));
    saveStorage("tlift_customers", customers);
    notifyListeners();
  },
  toggleCustomerActive: (id: number) => {
    customers = customers.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
    saveStorage("tlift_customers", customers);
    notifyListeners();
  },
  importCustomersFromCsv: (csvText: string, mode: "merge" | "replace" = "replace") => {
    const rows = parseCustomersCsv(csvText);
    if (!rows.length) return { totalRows: 0, customersAdded: 0, customersUpdated: 0 };

    if (mode === "replace") {
      customers = [];
    }

    let nextCustId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
    let customersAdded = 0;
    let customersUpdated = 0;

    rows.forEach((row) => {
      const existingIdx = mode === "merge" ? customers.findIndex((c) => c.name.trim() === row.name.trim()) : -1;
      const custId = existingIdx >= 0 ? customers[existingIdx].id : nextCustId++;
      const converted = convertRowToCustomer(row, custId);

      if (existingIdx >= 0) {
        customers[existingIdx] = { ...customers[existingIdx], ...converted };
        customersUpdated++;
      } else {
        customers.push(converted);
        customersAdded++;
      }
    });

    saveStorage("tlift_customers", customers);
    notifyListeners();

    return { totalRows: rows.length, customersAdded, customersUpdated };
  },

  // STAFF
  getStaff: () => staff,
  addStaff: (newStaff: Omit<Staff, "id">) => {
    const nextId = staff.length > 0 ? Math.max(...staff.map((s) => s.id)) + 1 : 1;
    const item: Staff = { ...newStaff, id: nextId };
    staff = [...staff, item];
    saveStorage("tlift_staff", staff);
    notifyListeners();
    return item;
  },
  updateStaff: (updated: Staff) => {
    staff = staff.map((s) => (s.id === updated.id ? updated : s));
    saveStorage("tlift_staff", staff);
    notifyListeners();
  },
  toggleStaffActive: (id: number) => {
    staff = staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    saveStorage("tlift_staff", staff);
    notifyListeners();
  },
};

// React Hooks
export function useContracts() {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => contracts
  );
}

export function useContractDetails(contractId: number) {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => appStore.getContractDetails(contractId)
  );
}

export function useCustomers() {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => customers
  );
}

export function useStaff() {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => staff
  );
}
