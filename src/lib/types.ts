export interface IPurchase {
  _id: string;
  artNo: string;
  size: string;
  purchaseDate: string; // YYYY-MM-DD
  purchaseValue: number; // cost per pair
  sellingPrice?: number; // default retail/selling price per pair
  quantity: number; // initial quantity
  remainingStock: number; // currently available pairs
  image?: string; // base64 or URL
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ISale {
  _id: string;
  artNo: string;
  customerName: string;
  size: string;
  salesDate: string; // YYYY-MM-DD
  salesValue: number; // selling price per pair
  purchaseValue: number; // cost price per pair at time of sale
  quantity: number; // pairs sold
  profit: number; // (salesValue - purchaseValue) * quantity
  notes?: string;
  createdAt: string;
}

export interface ISalesFilter {
  artNo?: string;
  customerName?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string; // YYYY-MM
  year?: string; // YYYY
}

export interface IPeriodSummary {
  period: string; // e.g. "2026-11" or "2026"
  label: string; // e.g. "Nov 2026" or "2026"
  totalPairs: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  transactionCount: number;
}

export interface IUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface IDashboardSummary {
  todaySlippersSold: number;
  todaySalesAmount: number;
  todayProfit: number;
  totalInventoryPairs: number;
  totalInventoryCost: number;
  totalSalesAllTime: number;
  totalProfitAllTime: number;
  thisMonth?: {
    pairs: number;
    sales: number;
    profit: number;
  };
  thisYear?: {
    pairs: number;
    sales: number;
    profit: number;
  };
  recentSales: ISale[];
  topArtNos: { artNo: string; soldPairs: number; totalRevenue: number; totalProfit: number }[];
  last7Days: { date: string; displayDate: string; sales: number; profit: number; pairs: number }[];
}
