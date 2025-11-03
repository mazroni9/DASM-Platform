import { SaudiRiyal } from "lucide-react";

interface PriceWithIconProps {
    price: number;
    className?: string;
}

export function PriceWithIcon({ price, className = "" }: PriceWithIconProps) {
    const defaultClass = "flex items-center gap-1";
    const combinedClass = `${defaultClass}${className ? " " + className : ""}`;
    return (
        <span className={combinedClass}>
            {price}
            <SaudiRiyal />
        </span>
    );
}