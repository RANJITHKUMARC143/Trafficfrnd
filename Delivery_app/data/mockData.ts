import { Order } from '@/types/order';

// Mock orders data
export const ORDERS: Order[] = [
  {
    id: '12345',
    time: 'Today, 10:30 AM',
    status: 'pending',
    customerName: 'Emily Johnson',
    customerAddress: '123 Main St, New York, NY 10001',
    customerPhone: '+1234567890',
    customerAvatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200',
    pickupAddress: 'Central Café, 45 Broadway, New York, NY 10001',
    distance: 2.5,
    estimatedTime: 15,
    earnings: 8.50,
    items: [
      {
        id: 'item1',
        name: 'Coffee Latte',
        description: 'Large, Extra shot, Almond milk',
        quantity: 2
      },
      {
        id: 'item2',
        name: 'Croissant',
        description: 'Butter, Chocolate filling',
        quantity: 1
      }
    ]
  },
  {
    id: '12346',
    time: 'Today, 11:15 AM',
    status: 'pickup',
    customerName: 'Michael Brown',
    customerAddress: '456 Park Ave, New York, NY 10022',
    customerPhone: '+1987654321',
    customerAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
    pickupAddress: 'Gourmet Deli, 78 5th Ave, New York, NY 10011',
    distance: 3.8,
    estimatedTime: 22,
    earnings: 12.75,
    items: [
      {
        id: 'item1',
        name: 'Turkey Sandwich',
        description: 'No mayo, Extra tomato',
        quantity: 1
      },
      {
        id: 'item2',
        name: 'Ceasar Salad',
        description: 'Dressing on the side',
        quantity: 1
      },
      {
        id: 'item3',
        name: 'Iced Tea',
        description: 'Lemon, No sugar',
        quantity: 2
      }
    ]
  },
  {
    id: '12347',
    time: 'Today, 12:45 PM',
    status: 'enroute',
    customerName: 'Sarah Wilson',
    customerAddress: '789 Madison Ave, New York, NY 10065',
    customerPhone: '+1122334455',
    customerAvatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
    pickupAddress: 'Sushi Express, 112 E 23rd St, New York, NY 10010',
    distance: 1.9,
    estimatedTime: 12,
    earnings: 7.25,
    items: [
      {
        id: 'item1',
        name: 'California Roll',
        description: '8 pieces',
        quantity: 2
      },
      {
        id: 'item2',
        name: 'Miso Soup',
        description: 'Extra green onion',
        quantity: 1
      }
    ]
  },
  {
    id: '12348',
    time: 'Today, 2:20 PM',
    status: 'delivered',
    customerName: 'David Martinez',
    customerAddress: '321 Lexington Ave, New York, NY 10016',
    customerPhone: '+1567891234',
    customerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    pickupAddress: 'Pizza Palace, 55 W 34th St, New York, NY 10001',
    distance: 2.1,
    estimatedTime: 14,
    earnings: 9.50,
    items: [
      {
        id: 'item1',
        name: 'Pepperoni Pizza',
        description: 'Medium, Extra cheese',
        quantity: 1
      },
      {
        id: 'item2',
        name: 'Garlic Knots',
        description: '6 pieces',
        quantity: 1
      },
      {
        id: 'item3',
        name: 'Soda',
        description: 'Diet Coke, 20oz',
        quantity: 2
      }
    ]
  },
  {
    id: '12349',
    time: 'Yesterday, 6:45 PM',
    status: 'delivered',
    customerName: 'Lisa Thompson',
    customerAddress: '555 3rd Ave, New York, NY 10016',
    customerPhone: '+1345678912',
    customerAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    pickupAddress: 'Burger Joint, 33 Union Square, New York, NY 10003',
    distance: 3.2,
    estimatedTime: 18,
    earnings: 10.75,
    items: [
      {
        id: 'item1',
        name: 'Cheeseburger',
        description: 'Medium rare, No onions',
        quantity: 2
      },
      {
        id: 'item2',
        name: 'French Fries',
        description: 'Large, Extra salt',
        quantity: 1
      },
      {
        id: 'item3',
        name: 'Milkshake',
        description: 'Chocolate',
        quantity: 1
      }
    ]
  }
];

// Daily earnings data
export const DAILY_EARNINGS = [
  { day: '9AM', earnings: 12.50 },
  { day: '10AM', earnings: 8.75 },
  { day: '11AM', earnings: 15.25 },
  { day: '12PM', earnings: 20.00 },
  { day: '1PM', earnings: 18.50 },
  { day: '2PM', earnings: 14.75 },
  { day: '3PM', earnings: 22.25 },
  { day: '4PM', earnings: 17.00 },
  { day: '5PM', earnings: 25.50 },
  { day: '6PM', earnings: 28.75 },
  { day: '7PM', earnings: 21.25 },
  { day: '8PM', earnings: 15.50 }
];

// Weekly earnings data
export const WEEKLY_EARNINGS = [
  { day: 'Mon', earnings: 85.50 },
  { day: 'Tue', earnings: 92.75 },
  { day: 'Wed', earnings: 78.25 },
  { day: 'Thu', earnings: 105.00 },
  { day: 'Fri', earnings: 126.50 },
  { day: 'Sat', earnings: 145.75 },
  { day: 'Sun', earnings: 112.25 }
];

// Monthly earnings data
export const MONTHLY_EARNINGS = [
  { day: '1', earnings: 75.50 },
  { day: '3', earnings: 82.75 },
  { day: '5', earnings: 68.25 },
  { day: '7', earnings: 95.00 },
  { day: '9', earnings: 106.50 },
  { day: '11', earnings: 125.75 },
  { day: '13', earnings: 112.25 },
  { day: '15', earnings: 85.50 },
  { day: '17', earnings: 92.75 },
  { day: '19', earnings: 78.25 },
  { day: '21', earnings: 105.00 },
  { day: '23', earnings: 126.50 },
  { day: '25', earnings: 145.75 },
  { day: '27', earnings: 112.25 },
  { day: '29', earnings: 95.00 },
  { day: '31', earnings: 105.50 }
];

// Earnings history data
export const EARNINGS_HISTORY = [
  {
    id: 'hist1',
    date: 'Oct 12, 2025',
    amount: 145.75,
    deliveries: 12,
    hours: 8,
    status: 'completed',
  },
  {
    id: 'hist2',
    date: 'Oct 11, 2025',
    amount: 126.50,
    deliveries: 10,
    hours: 7,
    status: 'completed',
  },
  {
    id: 'hist3',
    date: 'Oct 10, 2025',
    amount: 105.00,
    deliveries: 8,
    hours: 6,
    status: 'completed',
  },
  {
    id: 'hist4',
    date: 'Oct 9, 2025',
    amount: 112.25,
    deliveries: 9,
    hours: 7,
    status: 'completed',
  },
  {
    id: 'hist5',
    date: 'Oct 8, 2025',
    amount: 92.75,
    deliveries: 7,
    hours: 6,
    status: 'completed',
  },
  {
    id: 'hist6',
    date: 'Oct 7, 2025',
    amount: 85.50,
    deliveries: 6,
    hours: 5,
    status: 'completed',
  },
  {
    id: 'hist7',
    date: 'Oct 6, 2025',
    amount: 78.25,
    deliveries: 6,
    hours: 5,
    status: 'completed',
  }
];

// Performance metrics data
export const PERFORMANCE_METRICS = {
  rating: 4.8,
  maxRating: 5,
  deliveryCount: 187,
  acceptanceRate: 95,
  onTimeRate: 98,
  cancellationRate: 2,
  totalDistance: 1250,
  totalEarnings: 2345.75
};