export interface IPurchase {
  _id: string;
  artNo: string;
  size: string;
  purchaseDate: string; // YYYY-MM-DD
  purchaseValue: number; // cost per pair
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
  recentSales: ISale[];
  topArtNos: { artNo: string; soldPairs: number; totalRevenue: number; totalProfit: number }[];
  last7Days: { date: string; displayDate: string; sales: number; profit: number; pairs: number }[];
}
