// CarColorSelect.tsx
import React, { ChangeEvent, ChangeEventHandler } from 'react';

interface CarColor {
  name: string;
  value: string;
}

interface CarColorSelectProps {
    name?: string;
  selected?: string;
  onChange: (name: string, value: string) => void;
}


const carColors: CarColor[] = [
    { name: "أسود", value: "black" },
    { name: "أبيض", value: "white" },
    { name: "أحمر", value: "red" },
    { name: "أخضر", value: "green" },
    { name: "أزرق", value: "blue" },
    { name: "أصفر", value: "yellow" },
    { name: "برتقالي", value: "orange" },
    { name: "أرجواني", value: "purple" },
    { name: "وردي", value: "pink" },
    { name: "بني", value: "brown" },
    { name: "رمادي", value: "gray" },
    { name: "سماوي", value: "cyan" },
    { name: "أرجواني فاتح", value: "magenta" },
    { name: "ليموني", value: "lime" },
    { name: "أخضر مزرق", value: "teal" },
    { name: "كحلي", value: "navy" },
    { name: "خمري", value: "maroon" },
    { name: "زيتي", value: "olive" },
    { name: "ذهبي", value: "gold" },
    { name: "فضي", value: "silver" },
    { name: "أبيض لؤلؤي", value: "Pearl White" },
    { name: "أسود معدني", value: "Metallic Black" },
    { name: "فضي معدني", value: "Silver Metallic" },
    { name: "رمادي جرافيت", value: "Graphite Gray" },
    { name: "أزرق داكن", value: "Deep Blue" },
    { name: "أحمر قاني", value: "Crimson Red" },
    { name: "أحمر حلوى", value: "Candy Apple Red" },
    { name: "أخضر بريطاني سباق", value: "British Racing Green" },
    { name: "رمادي ناردو", value: "Nardo Grey" },
    { name: "أخضر جرينتا مانتس", value: "Verde Mantis" },
    { name: "أحمر هيلروت", value: "Hellrot" },
    { name: "ليلكي غامق", value: "Nightshade Purple" },
    { name: "أزرق ليلى", value: "Lapis Blue" },
    { name: "أحمر روسّو كورسا", value: "Rosso Corsa" },
    { name: "أصفر لامع", value: "Solar Yellow" },
    { name: "برتقالي لهب", value: "Flame Red (or Orange)" },
    { name: "بيج شوكولاتة", value: "Champagne Beige" },
    { name: "أزرق رالي العالم", value: "World Rally Blue" }
];

 
const CarColorSelect: React.FC<CarColorSelectProps> = ({
  selected = '',
  onChange ,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
     onChange(event.target.name, event.target.value);

  };
  return (
    <select
      name='color'
      id='color'
      value={selected}
      onChange={handleChange}
      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">اختر لون السيارة</option>
      {carColors.map((color) => (
        <option key={color.name} value={color.name}>
          {color.name}
        </option>
      ))}
    </select>
  );
};

export default CarColorSelect;