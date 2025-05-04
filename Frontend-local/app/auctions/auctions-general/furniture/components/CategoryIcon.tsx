import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
  icon: LucideIcon;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ icon: Icon, size = 24 }) => {
  return <Icon size={size} />;
};

export default CategoryIcon; 