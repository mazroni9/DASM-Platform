import { SaudiRiyal } from "lucide-react";
import "../../app/icon.css";
interface PriceWithIconProps {
    price: number | string;
    className?: string;
    iconSize?: number;
}

export function PriceWithIcon({ price, className = "" ,iconSize = 24}: PriceWithIconProps) {
    const defaultClass = "flex items-center ";
    const combinedClass = `${defaultClass}${className ? " " + className : ""}`;
    return (
        <span  className={combinedClass}>
            {price}
            <SaudiRiyal  className="currency-icon"  />
        </span>
    );
}