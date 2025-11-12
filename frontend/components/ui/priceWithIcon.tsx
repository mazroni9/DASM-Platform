import { SaudiRiyal } from "lucide-react";

interface PriceWithIconProps {
    price: number | string;
    className?: string;
    iconSize?: number;
}

export function PriceWithIcon({ price, className = "" ,iconSize = 24}: PriceWithIconProps) {
    const defaultClass = "flex items-center gap-1";
    const combinedClass = `${defaultClass}${className ? " " + className : ""}`;
    return (
        <span className={combinedClass}>
            {price}
            <SaudiRiyal size={iconSize} />
        </span>
    );
}