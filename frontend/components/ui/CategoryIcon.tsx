'use client';

import { 
  Tv, 
  Hammer, 
  ShoppingCart, 
  Sofa, 
  Package, 
  Printer,
  Wrench, 
  Laptop, 
  Smartphone, 
  Home,
  Car,
  LucideIcon
} from 'lucide-react';
type CategoryIconProps = {
  category: string;
  size?: number;
  className?: string;
};

// Map of category names to their corresponding icons
const iconMap: Record<string, LucideIcon> = {
  furniture: Sofa,
  equipment: Wrench,
  electronics: Laptop,
  appliances: Tv,
  auction: Hammer,
  retail: ShoppingCart,
  manufacturing: Printer,
  packaging: Package,
  mobile: Smartphone,
  home: Home,
  cars: Car,
  // Add more categories as needed
};

export default function CategoryIcon({ category, size = 24, className = '' }: CategoryIconProps) {
  // Convert category to lowercase and use it to look up the icon
  const categoryKey = category.toLowerCase();
  
  // Get the icon from the map, or use a default one if not found
  const Icon = iconMap[categoryKey] || Package;
  
  return <Icon size={size} className={className} />;
}