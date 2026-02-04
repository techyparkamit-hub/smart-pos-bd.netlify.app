import { Timestamp } from 'firebase/firestore';

export interface Product {
  id?: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  units?: string;
  size?: string;
  variations?: string;
  color?: string;
  warranty?: string;
  mfgDate?: string;
  expDate?: string;
  cost?: number;
  wholesalePrice?: number;
  price?: number;
  vat?: number;
  isVatApplicable?: boolean;
  stock?: number;
  alertQty?: number;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Transaction {
  id?: string;
  type: 'sale' | 'expense' | 'purchase' | 'transfer_out';
  amount: number;
  date?: Timestamp | any;
  items?: CartItem[];
  partyName?: string;
  partyPhone?: string;
  deliveryStatus?: string;
  dueAmount?: number;
  paidAmount?: number;
  paymentMethod?: string;
  category?: string;
  note?: string;
  [key: string]: any;
}

export interface Party {
  id?: string;
  name: string;
  type: 'customer' | 'supplier';
  phone?: string;
  balance?: number;
}

export interface Ticket {
  id?: string;
  ticketId: string;
  subject: string;
  message: string;
  priority: string;
  category: string;
  status: string;
  date?: Timestamp | any;
}

export type Language = 'en' | 'bn';

export interface TranslationMap {
  [key: string]: {
    [key: string]: string;
  };
}
