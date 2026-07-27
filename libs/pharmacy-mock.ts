"use client";

export interface DrugItem {
  id: string;
  name: string;
  genericName: string;
  category: "Liquid" | "Tablet" | "Capsule" | "Injection" | "Supply" | "Inhaler" | string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  price: number; // Stored in Naira
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Expired";
}

export interface PharmacyBillItem {
  drugId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PharmacyBill {
  code: string;
  patientId: string;
  patientName: string;
  phoneNumber: string;
  departmentId: string;
  departmentName: string;
  items: PharmacyBillItem[];
  totalAmount: number;
  status: "pending" | "paid";
  createdAt: string;
}

const INVENTORY_STORAGE_KEY = "swiftrev.pharmacy.inventory";
const BILLS_STORAGE_KEY = "swiftrev.pharmacy.bills";

const DEFAULT_DRUGS: DrugItem[] = [
  {
    id: "d1",
    name: "Normal Saline 0.9% 500ml",
    genericName: "Sodium Chloride",
    category: "Liquid",
    batchNumber: "NS2025-015",
    expiryDate: "2027-08",
    stock: 176,
    price: 1500,
    status: "In Stock",
  },
  {
    id: "d2",
    name: "Paracetamol 500mg",
    genericName: "Acetaminophen",
    category: "Tablet",
    batchNumber: "PCM2025-001",
    expiryDate: "2027-03",
    stock: 1141,
    price: 150,
    status: "In Stock",
  },
  {
    id: "d3",
    name: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    category: "Capsule",
    batchNumber: "AMX2025-004",
    expiryDate: "2026-09",
    stock: 45,
    price: 450,
    status: "Low Stock",
  },
  {
    id: "d4",
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    category: "Capsule",
    batchNumber: "OME2025-003",
    expiryDate: "2027-05",
    stock: 453,
    price: 350,
    status: "In Stock",
  },
  {
    id: "d5",
    name: "Ceftriaxone 1g Injection",
    genericName: "Ceftriaxone Sodium",
    category: "Injection",
    batchNumber: "CEF2025-005",
    expiryDate: "2026-07",
    stock: 11,
    price: 5500,
    status: "Low Stock",
  },
  {
    id: "d6",
    name: "Atorvastatin 20mg",
    genericName: "Atorvastatin Calcium",
    category: "Tablet",
    batchNumber: "ATR2025-007",
    expiryDate: "2026-11",
    stock: 350,
    price: 300,
    status: "In Stock",
  },
  {
    id: "d7",
    name: "Cetirizine 10mg",
    genericName: "Cetirizine HCl",
    category: "Tablet",
    batchNumber: "CET2025-011",
    expiryDate: "2025-12",
    stock: 600,
    price: 150,
    status: "Expired",
  },
  {
    id: "d8",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    category: "Tablet",
    batchNumber: "IBU2025-012",
    expiryDate: "2027-01",
    stock: 794,
    price: 250,
    status: "In Stock",
  },
  {
    id: "d9",
    name: "Surgical Gloves (Box of 100)",
    genericName: "Latex Gloves",
    category: "Supply",
    batchNumber: "GLV2025-009",
    expiryDate: "2028-01",
    stock: 0,
    price: 12000,
    status: "Out of Stock",
  },
  {
    id: "d10",
    name: "Salbutamol Inhaler 100mcg",
    genericName: "Salbutamol",
    category: "Inhaler",
    batchNumber: "SAL2025-006",
    expiryDate: "2026-08",
    stock: 60,
    price: 6500,
    status: "In Stock",
  },
];

function determineStatus(stock: number, expiryDate: string): DrugItem["status"] {
  const expiry = new Date(expiryDate);
  const now = new Date();
  if (expiry < now) {
    return "Expired";
  }
  if (stock === 0) {
    return "Out of Stock";
  }
  if (stock < 50) {
    return "Low Stock";
  }
  return "In Stock";
}

export function getPharmacyInventory(): DrugItem[] {
  if (typeof window === "undefined") return DEFAULT_DRUGS;
  const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(DEFAULT_DRUGS));
    return DEFAULT_DRUGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DRUGS;
  }
}

export function savePharmacyInventory(items: DrugItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
}

export function addDrug(drug: Omit<DrugItem, "id" | "status">): DrugItem {
  const items = getPharmacyInventory();
  const status = determineStatus(drug.stock, drug.expiryDate);
  const newDrug: DrugItem = {
    ...drug,
    id: `d-${Date.now()}`,
    status,
  };
  items.push(newDrug);
  savePharmacyInventory(items);
  return newDrug;
}

export function updateDrug(id: string, updatedFields: Partial<Omit<DrugItem, "id">>): DrugItem | null {
  const items = getPharmacyInventory();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = items[idx];
  const newStock = updatedFields.stock !== undefined ? updatedFields.stock : current.stock;
  const newExpiry = updatedFields.expiryDate !== undefined ? updatedFields.expiryDate : current.expiryDate;
  const status = determineStatus(newStock, newExpiry);

  const updatedDrug: DrugItem = {
    ...current,
    ...updatedFields,
    status,
  };

  items[idx] = updatedDrug;
  savePharmacyInventory(items);
  return updatedDrug;
}

export function deleteDrug(id: string): boolean {
  const items = getPharmacyInventory();
  const initialLength = items.length;
  const filtered = items.filter((item) => item.id !== id);
  savePharmacyInventory(filtered);
  return filtered.length < initialLength;
}

export function getPharmacyBills(): PharmacyBill[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(BILLS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePharmacyBills(bills: PharmacyBill[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
}

export function createPharmacyBill(bill: Omit<PharmacyBill, "code" | "status" | "createdAt">): PharmacyBill {
  const bills = getPharmacyBills();
  // Generate random code PH-XXXXXX
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const code = `PH-${randNum}`;

  const newBill: PharmacyBill = {
    ...bill,
    code,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Deduct inventory stock
  const inventory = getPharmacyInventory();
  bill.items.forEach((billItem) => {
    const drug = inventory.find((d) => d.id === billItem.drugId);
    if (drug) {
      drug.stock = Math.max(0, drug.stock - billItem.quantity);
      drug.status = determineStatus(drug.stock, drug.expiryDate);
    }
  });
  savePharmacyInventory(inventory);

  bills.push(newBill);
  savePharmacyBills(bills);
  return newBill;
}

export function lookupPharmacyBill(code: string): PharmacyBill | null {
  const bills = getPharmacyBills();
  return bills.find((b) => b.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export function markPharmacyBillAsPaid(code: string): boolean {
  const bills = getPharmacyBills();
  const idx = bills.findIndex((b) => b.code.toUpperCase() === code.toUpperCase());
  if (idx === -1) return false;
  bills[idx].status = "paid";
  savePharmacyBills(bills);
  return true;
}

export function updatePharmacyBill(
  code: string,
  updatedFields: {
    patientId?: string;
    patientName?: string;
    phoneNumber?: string;
    departmentId?: string;
    departmentName?: string;
    items?: PharmacyBillItem[];
  }
): { success: boolean; error?: string; bill?: PharmacyBill } {
  const bills = getPharmacyBills();
  const idx = bills.findIndex((b) => b.code.toUpperCase() === code.toUpperCase());
  if (idx === -1) {
    return { success: false, error: "Prescription bill not found." };
  }

  const bill = bills[idx];
  if (bill.status !== "pending") {
    return { success: false, error: "Only pending prescriptions can be edited." };
  }

  const inventory = getPharmacyInventory();

  // 1. Temporary refund of the original quantities of this bill
  const originalItems = bill.items;
  originalItems.forEach((oldItem) => {
    const drug = inventory.find((d) => d.id === oldItem.drugId);
    if (drug) {
      drug.stock += oldItem.quantity;
      drug.status = determineStatus(drug.stock, drug.expiryDate);
    }
  });

  // 2. Validate if we have enough stock for the new/updated items
  if (updatedFields.items) {
    for (const newItem of updatedFields.items) {
      const drug = inventory.find((d) => d.id === newItem.drugId);
      if (!drug) {
        // Roll back the stock refund before returning error
        originalItems.forEach((oldItem) => {
          const d = inventory.find((x) => x.id === oldItem.drugId);
          if (d) {
            d.stock = Math.max(0, d.stock - oldItem.quantity);
            d.status = determineStatus(d.stock, d.expiryDate);
          }
        });
        return { success: false, error: `Drug formulation not found: ${newItem.name}` };
      }
      if (drug.stock < newItem.quantity) {
        // Roll back the stock refund before returning error
        originalItems.forEach((oldItem) => {
          const d = inventory.find((x) => x.id === oldItem.drugId);
          if (d) {
            d.stock = Math.max(0, d.stock - oldItem.quantity);
            d.status = determineStatus(d.stock, d.expiryDate);
          }
        });
        return {
          success: false,
          error: `Insufficient stock for ${newItem.name}. Only ${drug.stock} units available.`,
        };
      }
    }

    // 3. Deduct stock for new/updated items
    updatedFields.items.forEach((newItem) => {
      const drug = inventory.find((d) => d.id === newItem.drugId);
      if (drug) {
        drug.stock = Math.max(0, drug.stock - newItem.quantity);
        drug.status = determineStatus(drug.stock, drug.expiryDate);
      }
    });
  } else {
    // If items aren't updated, we still need to deduct the original items because we refunded them above.
    originalItems.forEach((oldItem) => {
      const drug = inventory.find((d) => d.id === oldItem.drugId);
      if (drug) {
        drug.stock = Math.max(0, drug.stock - oldItem.quantity);
        drug.status = determineStatus(drug.stock, drug.expiryDate);
      }
    });
  }

  // 4. Save the adjusted inventory
  savePharmacyInventory(inventory);

  // 5. Update the bill fields
  if (updatedFields.patientId !== undefined) bill.patientId = updatedFields.patientId;
  if (updatedFields.patientName !== undefined) bill.patientName = updatedFields.patientName;
  if (updatedFields.phoneNumber !== undefined) bill.phoneNumber = updatedFields.phoneNumber;
  if (updatedFields.departmentId !== undefined) {
    bill.departmentId = updatedFields.departmentId;
    bill.departmentName = updatedFields.departmentName || "";
  }
  if (updatedFields.items !== undefined) {
    bill.items = updatedFields.items;
    bill.totalAmount = updatedFields.items.reduce((sum, item) => sum + item.amount, 0);
  }

  bills[idx] = bill;
  savePharmacyBills(bills);

  return { success: true, bill };
}

