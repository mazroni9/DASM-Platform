import { SaudiRiyal } from "lucide-react";

export function PriceWithIcon({ price }: { price: number }) {
    return (
        <div className="flex items-center gap-1">
            {price}
            <SaudiRiyal />
        </div>
    )
}