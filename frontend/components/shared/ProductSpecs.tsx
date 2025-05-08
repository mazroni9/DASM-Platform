'use client';

interface SpecItem {
  label: string;
  value: string | number;
}

interface ProductSpecsProps {
  specs: SpecItem[];
  title?: string;
  columns?: 1 | 2 | 3 | 4;
}

export default function ProductSpecs({ 
  specs, 
  title = 'المواصفات',
  columns = 2 
}: ProductSpecsProps) {
  
  // تحديد عدد الأعمدة في العرض
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
  };
  
  return (
    <div>
      {title && <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>}
      
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {specs.map((spec, index) => (
          <div key={index} className="flex items-center">
            <span className="text-gray-500 ml-2">{spec.label}</span>
            <span className="text-gray-800">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 