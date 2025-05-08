import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
  icon: LucideIcon;
  size?: number;
}

function CategoryIcon({ icon: Icon, size = 24 }: CategoryIconProps) {
  return React.createElement(Icon, { size });
}

export default CategoryIcon; 