'use client';

interface ProductFeaturesProps {
  features: string[];
  title?: string;
}

export default function ProductFeatures({
  features,
  title = 'المميزات'
}: ProductFeaturesProps) {
  if (!features || features.length === 0) {
    return null;
  }
  
  return (
    <div>
      {title && <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>}
      
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <span 
            key={index}
            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
} 