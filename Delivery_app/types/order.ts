export type OrderStatus = 'pending' | 'confirmed' | 'pickup' | 'enroute' | 'delivered' | 'cancelled' | 'canceled';

export interface OrderItem {
  _id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Location {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Order {
  _id: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryAddress?: string;
  deliveryBoyId?: string;
  vendorId?: string;
  routeId?: string;
  vehicleNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}