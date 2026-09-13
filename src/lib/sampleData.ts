import { IPurchase, ISale } from "./types";

// Helper to generate elegant realistic SVG slipper image data URLs
export function generateSlipperSvg(artNo: string, color1: string, color2: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#151b28" />
        <stop offset="100%" stop-color="#0b0f17" />
      </linearGradient>
      <linearGradient id="soleGrad" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <rect width="400" height="300" rx="16" fill="url(#bgGrad)" />
    <!-- Ambient glow -->
    <circle cx="200" cy="150" r="100" fill="${color1}" opacity="0.12" filter="blur(30px)" />
    <!-- Slipper base shadow -->
    <ellipse cx="200" cy="195" rx="120" ry="25" fill="#000000" opacity="0.45" />
    <!-- Slipper Sole -->
    <g filter="url(#shadow)">
      <!-- Outsole base -->
      <path d="M 100 170 C 85 150, 110 130, 150 135 C 190 140, 240 135, 290 145 C 320 150, 330 175, 310 185 C 280 200, 220 200, 170 195 C 130 190, 110 185, 100 170 Z" fill="#2d3748" />
      <!-- Colored midsole cushion -->
      <path d="M 102 165 C 88 147, 112 129, 152 134 C 192 139, 242 134, 292 144 C 318 149, 326 170, 308 179 C 278 193, 218 193, 168 189 C 131 184, 111 179, 102 165 Z" fill="url(#soleGrad)" />
      <!-- Upper Footbed texture -->
      <path d="M 110 160 C 100 148, 120 135, 155 139 C 195 144, 240 139, 285 148 C 308 153, 315 168, 300 174 C 272 186, 215 186, 168 182 C 135 178, 118 173, 110 160 Z" fill="#1a202c" opacity="0.85" />
      <!-- Slipper Strap -->
      <path d="M 160 140 C 160 100, 245 100, 255 145 C 240 152, 220 150, 205 148 C 190 146, 175 145, 160 140 Z" fill="url(#soleGrad)" />
      <path d="M 165 138 C 170 108, 238 108, 248 142" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4" />
    </g>
    <!-- Brand badge -->
    <rect x="25" y="25" width="90" height="28" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="70" y="44" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${artNo}</text>
    <text x="200" y="260" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getPastDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const INITIAL_PURCHASES: IPurchase[] = [
  {
    _id: "pur-001",
    artNo: "SLIP-AIR-901",
    size: "8",
    purchaseDate: getPastDateString(10),
    purchaseValue: 180,
    quantity: 50,
    remainingStock: 32,
    image: generateSlipperSvg("SLIP-AIR-901", "#3b82f6", "#06b6d4", "Air Cushion Comfort Slide"),
    notes: "Premium memory foam EVA sole batch",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    _id: "pur-002",
    artNo: "SLIP-AIR-901",
    size: "9",
    purchaseDate: getPastDateString(10),
    purchaseValue: 180,
    quantity: 40,
    remainingStock: 26,
    image: generateSlipperSvg("SLIP-AIR-901", "#3b82f6", "#06b6d4", "Air Cushion Comfort Slide"),
    notes: "High demand size",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    _id: "pur-003",
    artNo: "ART-LITE-305",
    size: "7",
    purchaseDate: getPastDateString(7),
    purchaseValue: 140,
    quantity: 60,
    remainingStock: 48,
    image: generateSlipperSvg("ART-LITE-305", "#10b981", "#059669", "Ultra Light Daily Flip-Flop"),
    notes: "Waterproof anti-skid bathroom slippers",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    _id: "pur-004",
    artNo: "ART-LITE-305",
    size: "8",
    purchaseDate: getPastDateString(7),
    purchaseValue: 140,
    quantity: 60,
    remainingStock: 42,
    image: generateSlipperSvg("ART-LITE-305", "#10b981", "#059669", "Ultra Light Daily Flip-Flop"),
    notes: "Waterproof anti-skid bathroom slippers",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    _id: "pur-005",
    artNo: "ROYAL-ORTO-550",
    size: "8",
    purchaseDate: getPastDateString(5),
    purchaseValue: 260,
    quantity: 30,
    remainingStock: 18,
    image: generateSlipperSvg("ROYAL-ORTO-550", "#8b5cf6", "#d946ef", "Orthopedic Arch Support"),
    notes: "Doctor recommended orthopedic soft sole",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: "pur-006",
    artNo: "ROYAL-ORTO-550",
    size: "9",
    purchaseDate: getPastDateString(5),
    purchaseValue: 260,
    quantity: 30,
    remainingStock: 21,
    image: generateSlipperSvg("ROYAL-ORTO-550", "#8b5cf6", "#d946ef", "Orthopedic Arch Support"),
    notes: "Doctor recommended orthopedic soft sole",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: "pur-007",
    artNo: "URBAN-LEATHER-70",
    size: "8",
    purchaseDate: getPastDateString(3),
    purchaseValue: 320,
    quantity: 25,
    remainingStock: 15,
    image: generateSlipperSvg("URBAN-LEATHER-70", "#f59e0b", "#d97706", "Premium Leather Handcrafted Slide"),
    notes: "Tan brown synthetic leather strap",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: "pur-008",
    artNo: "KIDS-CARTOON-12",
    size: "4",
    purchaseDate: getPastDateString(2),
    purchaseValue: 95,
    quantity: 50,
    remainingStock: 35,
    image: generateSlipperSvg("KIDS-CARTOON-12", "#ec4899", "#f43f5e", "Kids Fun Clogs"),
    notes: "Bright colors with strap charms",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

export const INITIAL_SALES: ISale[] = [
  // Today's sales
  {
    _id: "sal-today-1",
    artNo: "SLIP-AIR-901",
    customerName: "Rajesh Kumar",
    size: "8",
    salesDate: getTodayDateString(),
    salesValue: 299,
    purchaseValue: 180,
    quantity: 2,
    profit: (299 - 180) * 2, // 238
    notes: "Walk-in cash sale",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "sal-today-2",
    artNo: "ROYAL-ORTO-550",
    customerName: "Dr. Sharma",
    size: "8",
    salesDate: getTodayDateString(),
    salesValue: 449,
    purchaseValue: 260,
    quantity: 1,
    profit: (449 - 260) * 1, // 189
    notes: "Prescription orthopedic",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: "sal-today-3",
    artNo: "ART-LITE-305",
    customerName: "Metro Footwear Wholesale",
    size: "8",
    salesDate: getTodayDateString(),
    salesValue: 220,
    purchaseValue: 140,
    quantity: 6,
    profit: (220 - 140) * 6, // 480
    notes: "Bulk order",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: "sal-today-4",
    artNo: "URBAN-LEATHER-70",
    customerName: "Arun Verma",
    size: "8",
    salesDate: getTodayDateString(),
    salesValue: 499,
    purchaseValue: 320,
    quantity: 1,
    profit: (499 - 320) * 1, // 179
    notes: "UPI payment",
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  // Yesterday and past days
  {
    _id: "sal-past-1",
    artNo: "SLIP-AIR-901",
    customerName: "Sanjay Gupta",
    size: "9",
    salesDate: getPastDateString(1),
    salesValue: 299,
    purchaseValue: 180,
    quantity: 4,
    profit: (299 - 180) * 4,
    notes: "",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: "sal-past-2",
    artNo: "KIDS-CARTOON-12",
    customerName: "Pooja Reddy",
    size: "4",
    salesDate: getPastDateString(1),
    salesValue: 170,
    purchaseValue: 95,
    quantity: 3,
    profit: (170 - 95) * 3,
    notes: "",
    createdAt: new Date(Date.now() - 90000000).toISOString(),
  },
  {
    _id: "sal-past-3",
    artNo: "ROYAL-ORTO-550",
    customerName: "Venkatesh Rao",
    size: "9",
    salesDate: getPastDateString(2),
    salesValue: 450,
    purchaseValue: 260,
    quantity: 2,
    profit: (450 - 260) * 2,
    notes: "",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: "sal-past-4",
    artNo: "ART-LITE-305",
    customerName: "City Shoe Mart",
    size: "7",
    salesDate: getPastDateString(3),
    salesValue: 220,
    purchaseValue: 140,
    quantity: 12,
    profit: (220 - 140) * 12,
    notes: "Wholesale box",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: "sal-past-5",
    artNo: "URBAN-LEATHER-70",
    customerName: "Karan Johar",
    size: "8",
    salesDate: getPastDateString(4),
    salesValue: 499,
    purchaseValue: 320,
    quantity: 2,
    profit: (499 - 320) * 2,
    notes: "",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }
];
