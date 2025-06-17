export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  customizationOptions?: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens?: string[];
  createdAt: string;
  updatedAt: string;
} 