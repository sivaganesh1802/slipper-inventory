import mongoose, { Schema, Model } from "mongoose";
import { IPurchase, ISale } from "@/lib/types";

// Purchase Schema
const PurchaseSchema = new Schema<IPurchase>(
  {
    artNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    size: { type: String, required: true, trim: true },
    purchaseDate: { type: String, required: true },
    purchaseValue: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    remainingStock: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Sale Schema
const SaleSchema = new Schema<ISale>(
  {
    artNo: { type: String, required: true, uppercase: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    salesDate: { type: String, required: true, index: true },
    salesValue: { type: Number, required: true, min: 0 },
    purchaseValue: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    profit: { type: Number, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// User Schema
export interface IUserDoc {
  username: string;
  passwordHash: string;
  name: string;
  role: string;
}

const UserSchema = new Schema<IUserDoc>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

export const PurchaseModel: Model<IPurchase> =
  mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export const SaleModel: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export const UserModel: Model<IUserDoc> =
  mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);
