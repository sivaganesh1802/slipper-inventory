import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { IPurchase, ISale, IDashboardSummary } from "./types";
import { getTodayDateString, getPastDateString } from "./sampleData";

import { getAppConfig } from "./config";

import os from "os";

interface LocalStore {
  purchases: IPurchase[];
  sales: ISale[];
}

// In Vercel / serverless environments, only /tmp is writable; /var/task is read-only.
const DATA_DIR =
  process.env.VERCEL || (process.env.NODE_ENV === "production" && process.platform !== "win32")
    ? path.join(os.tmpdir(), "slipper_data")
    : path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "slipper_store.json");

let isMongoConnected = false;
let mongoConnectPromise: Promise<boolean> | null = null;

// Attempt MongoDB Connection
export async function connectMongo(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return true;
  }

  if (mongoConnectPromise) {
    return mongoConnectPromise;
  }

  mongoConnectPromise = (async () => {
    const cfg = getAppConfig();
    const uri = cfg.database?.mongodb_uri?.trim() || "";

    if (!uri || uri.includes("<username>")) {
      console.warn("MongoDB URI is empty or not configured in config/env");
      return false;
    }

    try {
      // Fix Windows DNS SRV lookup issues for MongoDB Atlas ONLY on Windows.
      // Do NOT run on Linux/Vercel (AWS Lambda blocks outbound UDP port 53 to custom DNS).
      if (process.platform === "win32") {
        try {
          const dns = await import("dns");
          dns.setServers(["8.8.8.8", "1.1.1.1"]);
        } catch {
          // ignore
        }
      }

      if (mongoose.connection.readyState === 1) {
        isMongoConnected = true;
        return true;
      }

      await mongoose.connect(uri, {
        dbName: "slipper_inventory",
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      });
      isMongoConnected = true;
      console.log("Successfully connected to MongoDB Cloud Atlas (slipper_inventory)");

      // Auto-seed admin user into MongoDB Atlas 'users' collection if empty
      try {
        const { UserModel } = await import("@/models/schemas");
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
          const bcrypt = await import("bcryptjs");
          const adminUser = (cfg.auth.admin_username || "admin").toLowerCase().trim();
          const adminPass = cfg.auth.admin_password || "admin123";
          const passwordHash = await bcrypt.hash(adminPass, 10);

          await UserModel.create({
            username: adminUser,
            passwordHash,
            name: `${cfg.app.business_name} Admin`,
            role: "admin",
          });
          console.log("Seeded admin user into MongoDB Atlas 'users' collection");
        }
      } catch (seedErr) {
        console.warn("Error ensuring admin user in MongoDB Atlas:", seedErr);
      }

      return true;
    } catch (error) {
      console.error(
        "MongoDB Cloud connection failed. If on Vercel, ensure MongoDB Atlas Network Access has 0.0.0.0/0 allowed:",
        error
      );
      isMongoConnected = false;
      return false;
    } finally {
      mongoConnectPromise = null;
    }
  })();

  return mongoConnectPromise;
}

// Local Persistent Store fallback (clean empty store)
async function getLocalStore(): Promise<LocalStore> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(STORE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    const initial: LocalStore = {
      purchases: [],
      sales: [],
    };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

async function saveLocalStore(store: LocalStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/* ==========================================================================
   PURCHASE MANAGEMENT API
   ========================================================================== */

export async function getPurchases(filter?: { artNo?: string; size?: string }): Promise<IPurchase[]> {
  const isCloud = await connectMongo();
  if (isCloud) {
    const { PurchaseModel } = await import("@/models/schemas");
    const query: Record<string, unknown> = {};
    if (filter?.artNo) query.artNo = new RegExp(filter.artNo, "i");
    if (filter?.size) query.size = filter.size;
    const items = await PurchaseModel.find(query).sort({ purchaseDate: -1, createdAt: -1 }).lean();
    return items.map((doc) => ({
      ...doc,
      _id: String(doc._id),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    })) as IPurchase[];
  }

  const store = await getLocalStore();
  let items = store.purchases;
  if (filter?.artNo) {
    const term = filter.artNo.toLowerCase();
    items = items.filter((p) => p.artNo.toLowerCase().includes(term));
  }
  if (filter?.size) {
    items = items.filter((p) => p.size === filter.size);
  }
  return items.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
}

export async function createPurchase(data: {
  artNo: string;
  size: string;
  purchaseDate: string;
  purchaseValue: number;
  sellingPrice?: number;
  quantity: number;
  image?: string;
  notes?: string;
}): Promise<IPurchase> {
  const isCloud = await connectMongo();
  const quantity = Number(data.quantity) || 1;
  const purchaseValue = Number(data.purchaseValue) || 0;
  const sellingPrice = data.sellingPrice !== undefined ? Number(data.sellingPrice) : 0;

  if (isCloud) {
    const { PurchaseModel } = await import("@/models/schemas");
    const newDoc = await PurchaseModel.create({
      artNo: data.artNo.toUpperCase().trim(),
      size: data.size.trim(),
      purchaseDate: data.purchaseDate,
      purchaseValue,
      sellingPrice,
      quantity,
      remainingStock: quantity,
      image: data.image || "",
      notes: data.notes || "",
    });
    return {
      ...newDoc.toObject(),
      _id: String(newDoc._id),
      createdAt: newDoc.createdAt ? String(newDoc.createdAt) : new Date().toISOString(),
    } as IPurchase;
  }

  const store = await getLocalStore();
  const newPurchase: IPurchase = {
    _id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    artNo: data.artNo.toUpperCase().trim(),
    size: data.size.trim(),
    purchaseDate: data.purchaseDate,
    purchaseValue,
    sellingPrice,
    quantity,
    remainingStock: quantity,
    image: data.image || "",
    notes: data.notes || "",
    createdAt: new Date().toISOString(),
  };
  store.purchases.unshift(newPurchase);
  await saveLocalStore(store);
  return newPurchase;
}

export async function updatePurchase(
  id: string,
  data: Partial<Omit<IPurchase, "_id" | "createdAt">>
): Promise<IPurchase | null> {
  const isCloud = await connectMongo();

  const updateData: Record<string, unknown> = { ...data };
  if (data.artNo) updateData.artNo = data.artNo.toUpperCase().trim();
  if (data.size) updateData.size = String(data.size).trim();
  if (data.purchaseValue !== undefined) updateData.purchaseValue = Number(data.purchaseValue);
  if (data.sellingPrice !== undefined) updateData.sellingPrice = Number(data.sellingPrice);
  if (data.quantity !== undefined) {
    updateData.quantity = Number(data.quantity);
    if (data.remainingStock === undefined) {
      updateData.remainingStock = Number(data.quantity);
    }
  }

  if (isCloud) {
    const { PurchaseModel } = await import("@/models/schemas");
    const updated = await PurchaseModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!updated) return null;
    return {
      ...updated,
      _id: String(updated._id),
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
    } as IPurchase;
  }

  const store = await getLocalStore();
  const idx = store.purchases.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  store.purchases[idx] = { ...store.purchases[idx], ...updateData, updatedAt: new Date().toISOString() };
  await saveLocalStore(store);
  return store.purchases[idx];
}

export async function deletePurchase(id: string): Promise<boolean> {
  const isCloud = await connectMongo();
  if (isCloud) {
    const { PurchaseModel } = await import("@/models/schemas");
    const res = await PurchaseModel.findByIdAndDelete(id);
    return !!res;
  }

  const store = await getLocalStore();
  const initialLen = store.purchases.length;
  store.purchases = store.purchases.filter((p) => p._id !== id);
  if (store.purchases.length !== initialLen) {
    await saveLocalStore(store);
    return true;
  }
  return false;
}

/* ==========================================================================
   SALES MANAGEMENT API
   ========================================================================== */

export async function getSales(filter?: { artNo?: string; customerName?: string; date?: string }): Promise<ISale[]> {
  const isCloud = await connectMongo();
  if (isCloud) {
    const { SaleModel } = await import("@/models/schemas");
    const query: Record<string, unknown> = {};
    if (filter?.artNo) query.artNo = new RegExp(filter.artNo, "i");
    if (filter?.customerName) query.customerName = new RegExp(filter.customerName, "i");
    if (filter?.date) query.salesDate = filter.date;
    const items = await SaleModel.find(query).sort({ salesDate: -1, createdAt: -1 }).lean();
    return items.map((doc) => ({
      ...doc,
      _id: String(doc._id),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    })) as ISale[];
  }

  const store = await getLocalStore();
  let items = store.sales;
  if (filter?.artNo) {
    const term = filter.artNo.toLowerCase();
    items = items.filter((s) => s.artNo.toLowerCase().includes(term));
  }
  if (filter?.customerName) {
    const term = filter.customerName.toLowerCase();
    items = items.filter((s) => s.customerName.toLowerCase().includes(term));
  }
  if (filter?.date) {
    items = items.filter((s) => s.salesDate === filter.date);
  }
  return items.sort((a, b) => new Date(b.salesDate).getTime() - new Date(a.salesDate).getTime());
}

export async function createSale(data: {
  artNo: string;
  customerName: string;
  size: string;
  salesDate: string;
  salesValue: number;
  quantity: number;
  purchaseValue?: number;
  notes?: string;
}): Promise<ISale> {
  const artNoUpper = data.artNo.toUpperCase().trim();
  const quantity = Number(data.quantity) || 1;
  const salesValue = Number(data.salesValue) || 0;

  // Determine purchase value to accurately calculate profit
  let purchaseValue = data.purchaseValue;
  if (purchaseValue === undefined || purchaseValue <= 0) {
    const purchases = await getPurchases({ artNo: artNoUpper });
    const matchingPurchase = purchases.find((p) => p.size === data.size && p.remainingStock > 0) || purchases[0];
    purchaseValue = matchingPurchase ? matchingPurchase.purchaseValue : 0;
  }

  const profit = (salesValue - purchaseValue) * quantity;

  // Deduct remainingStock from purchase inventory
  const isCloud = await connectMongo();
  if (isCloud) {
    const { SaleModel, PurchaseModel } = await import("@/models/schemas");
    
    // Decrement stock from oldest matching purchase
    const matchingDoc = await PurchaseModel.findOne({
      artNo: artNoUpper,
      size: data.size,
      remainingStock: { $gt: 0 },
    }).sort({ purchaseDate: 1 });

    if (matchingDoc) {
      const deduct = Math.min(matchingDoc.remainingStock, quantity);
      matchingDoc.remainingStock -= deduct;
      await matchingDoc.save();
    }

    const newSale = await SaleModel.create({
      artNo: artNoUpper,
      customerName: data.customerName.trim(),
      size: data.size.trim(),
      salesDate: data.salesDate,
      salesValue,
      purchaseValue,
      quantity,
      profit,
      notes: data.notes || "",
    });

    return {
      ...newSale.toObject(),
      _id: String(newSale._id),
      createdAt: newSale.createdAt ? String(newSale.createdAt) : new Date().toISOString(),
    } as ISale;
  }

  const store = await getLocalStore();

  // Deduct local remaining stock
  const purchaseIndex = store.purchases.findIndex(
    (p) => p.artNo.toUpperCase() === artNoUpper && p.size === data.size && p.remainingStock > 0
  );
  if (purchaseIndex !== -1) {
    const deduct = Math.min(store.purchases[purchaseIndex].remainingStock, quantity);
    store.purchases[purchaseIndex].remainingStock -= deduct;
  }

  const newSale: ISale = {
    _id: `sal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    artNo: artNoUpper,
    customerName: data.customerName.trim(),
    size: data.size.trim(),
    salesDate: data.salesDate,
    salesValue,
    purchaseValue,
    quantity,
    profit,
    notes: data.notes || "",
    createdAt: new Date().toISOString(),
  };

  store.sales.unshift(newSale);
  await saveLocalStore(store);
  return newSale;
}

export async function deleteSale(id: string): Promise<boolean> {
  const isCloud = await connectMongo();
  if (isCloud) {
    const { SaleModel } = await import("@/models/schemas");
    const res = await SaleModel.findByIdAndDelete(id);
    return !!res;
  }

  const store = await getLocalStore();
  const initialLen = store.sales.length;
  store.sales = store.sales.filter((s) => s._id !== id);
  if (store.sales.length !== initialLen) {
    await saveLocalStore(store);
    return true;
  }
  return false;
}

/* ==========================================================================
   PRODUCT & PRICE SEARCH
   ========================================================================== */

export interface IProductSearchResult {
  artNo: string;
  image?: string;
  sizes: string[];
  latestPurchaseValue: number;
  latestSalesValue: number;
  defaultSellingPrice?: number;
  avgProfitMargin: number;
  totalPurchased: number;
  totalSold: number;
  totalRemainingStock: number;
  purchases: IPurchase[];
  sales: ISale[];
}

export async function searchProducts(query: string): Promise<IProductSearchResult[]> {
  const cleanQuery = (query || "").trim().toLowerCase();
  const allPurchases = await getPurchases();
  const allSales = await getSales();

  // Group by Art.No
  const grouped = new Map<string, { purchases: IPurchase[]; sales: ISale[] }>();

  allPurchases.forEach((p) => {
    const key = p.artNo.toUpperCase();
    if (!grouped.has(key)) grouped.set(key, { purchases: [], sales: [] });
    grouped.get(key)!.purchases.push(p);
  });

  allSales.forEach((s) => {
    const key = s.artNo.toUpperCase();
    if (!grouped.has(key)) grouped.set(key, { purchases: [], sales: [] });
    grouped.get(key)!.sales.push(s);
  });

  const results: IProductSearchResult[] = [];

  for (const [artNo, data] of grouped.entries()) {
    // If query exists, filter by artNo, or check if customer bought it, or size matches
    if (cleanQuery) {
      const matchArt = artNo.toLowerCase().includes(cleanQuery);
      const matchCustomer = data.sales.some((s) => s.customerName.toLowerCase().includes(cleanQuery));
      const matchSize = data.purchases.some((p) => p.size.toLowerCase().includes(cleanQuery));
      if (!matchArt && !matchCustomer && !matchSize) continue;
    }

    const sizes = Array.from(new Set(data.purchases.map((p) => p.size)));
    const image = data.purchases.find((p) => p.image)?.image || "";
    const latestPurchaseValue = data.purchases[0]?.purchaseValue || 0;
    const defaultSellingPrice =
      data.purchases.find((p) => p.sellingPrice && p.sellingPrice > 0)?.sellingPrice || 0;
    const latestSalesValue =
      data.sales[0]?.salesValue || defaultSellingPrice || Math.round(latestPurchaseValue * 1.5);

    const targetPrice = defaultSellingPrice > 0 ? defaultSellingPrice : latestSalesValue;
    const margin =
      targetPrice > 0
        ? Math.round(((targetPrice - latestPurchaseValue) / targetPrice) * 100)
        : 0;

    const totalPurchased = data.purchases.reduce((acc, p) => acc + p.quantity, 0);
    const totalSold = data.sales.reduce((acc, s) => acc + s.quantity, 0);
    const totalRemainingStock = data.purchases.reduce((acc, p) => acc + (p.remainingStock ?? 0), 0);

    results.push({
      artNo,
      image,
      sizes,
      latestPurchaseValue,
      latestSalesValue,
      defaultSellingPrice,
      avgProfitMargin: margin,
      totalPurchased,
      totalSold,
      totalRemainingStock,
      purchases: data.purchases,
      sales: data.sales,
    });
  }

  return results.sort((a, b) => b.totalSold - a.totalSold);
}

/* ==========================================================================
   DASHBOARD KPI SUMMARY & ANALYTICS
   ========================================================================== */

export async function getDashboardSummary(): Promise<IDashboardSummary> {
  const todayStr = getTodayDateString();
  const purchases = await getPurchases();
  const sales = await getSales();

  // Today's metrics
  const todaySales = sales.filter((s) => s.salesDate === todayStr);
  const todaySlippersSold = todaySales.reduce((acc, s) => acc + s.quantity, 0);
  const todaySalesAmount = todaySales.reduce((acc, s) => acc + s.salesValue * s.quantity, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);

  // All-time metrics
  const totalSalesAllTime = sales.reduce((acc, s) => acc + s.salesValue * s.quantity, 0);
  const totalProfitAllTime = sales.reduce((acc, s) => acc + s.profit, 0);

  // Inventory stats
  const totalInventoryPairs = purchases.reduce((acc, p) => acc + (p.remainingStock ?? 0), 0);
  const totalInventoryCost = purchases.reduce(
    (acc, p) => acc + (p.remainingStock ?? 0) * p.purchaseValue,
    0
  );

  // Top Art.Nos
  const artMap = new Map<string, { soldPairs: number; revenue: number; profit: number }>();
  sales.forEach((s) => {
    const key = s.artNo;
    const current = artMap.get(key) || { soldPairs: 0, revenue: 0, profit: 0 };
    current.soldPairs += s.quantity;
    current.revenue += s.salesValue * s.quantity;
    current.profit += s.profit;
    artMap.set(key, current);
  });

  const topArtNos = Array.from(artMap.entries())
    .map(([artNo, stats]) => ({
      artNo,
      soldPairs: stats.soldPairs,
      totalRevenue: stats.revenue,
      totalProfit: stats.profit,
    }))
    .sort((a, b) => b.soldPairs - a.soldPairs)
    .slice(0, 5);

  // Last 7 days trend
  const last7Days: IDashboardSummary["last7Days"] = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = getPastDateString(i);
    const daySales = sales.filter((s) => s.salesDate === dateStr);
    const pairs = daySales.reduce((acc, s) => acc + s.quantity, 0);
    const dayRevenue = daySales.reduce((acc, s) => acc + s.salesValue * s.quantity, 0);
    const dayProfit = daySales.reduce((acc, s) => acc + s.profit, 0);

    const d = new Date(dateStr);
    const displayDate = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    last7Days.push({
      date: dateStr,
      displayDate,
      sales: dayRevenue,
      profit: dayProfit,
      pairs,
    });
  }

  return {
    todaySlippersSold,
    todaySalesAmount,
    todayProfit,
    totalInventoryPairs,
    totalInventoryCost,
    totalSalesAllTime,
    totalProfitAllTime,
    recentSales: sales.slice(0, 8),
    topArtNos,
    last7Days,
  };
}
