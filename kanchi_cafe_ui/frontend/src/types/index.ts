export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CafeSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  gst: string;
  upiId: string;
  logoUrl?: string | null;
  customerNotifDelayMin: number;
  reminderIntervalMin: number;
  autoCompleteTimeoutMin: number;
  enableGst: boolean;
  gstPercentage: number;
}

export interface PrinterSettings {
  id: string;
  printer1Name: string;
  printer1Categories: string;
  printer2Name: string;
  printer2Categories: string;
}

export interface Table {
  id: string;
  tableNumber: number;
  qrCodeUrl: string;
  active: boolean;
  activeCustomers: number;
  activeOrders: number;
}

export interface Customer {
  id: string;
  mobile: string;
  name: string;
  totalVisits: number;
  totalOrders?: number;
  favouriteItem?: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  categoryId: string;
  category?: Category;
  imageUrl?: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  isCoffeeOrJuice: boolean;
  sortOrder: number;
}

// Independent Today's Special item
export interface TodaysSpecial {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  isCoffeeOrJuice: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  rating: number;
  comment?: string | null;
  adminReply?: string | null;
  createdAt: string;
  customer?: Customer;
  order?: {
    kotNumber?: string | null;
    totalAmount: number;
    createdAt: string;
  };
}

export interface Order {
  id: string;
  kotNumber?: string | null;
  tableId: string;
  customerId: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  rejectionCustomMsg?: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentRef?: string | null;
  paymentConfirmedAt?: string | null;
  confirmedCollectedByCustomer: boolean;
  confirmedCollectedByAdmin: boolean;
  lastNotifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  table: Table;
  customer: Customer;
  items: OrderItem[];
  review?: Review | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  ipAddress?: string | null;
  adminEmail?: string | null;
  createdAt: string;
}
