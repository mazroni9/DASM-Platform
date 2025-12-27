"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { commissionTierService } from "@/services/commission-tier-service";
import { formatCurrency } from "@/utils/formatCurrency";

export default function CommissionCalculator() {
  const [price, setPrice] = useState("");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCalc = async () => {
    if (price === "" || isNaN(Number(price))) return;
    setLoading(true);
    try {
      const d = await commissionTierService.calculate(Number(price));
      setRes(d);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block mb-1">السعر</label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" placeholder="أدخل السعر" />
        </div>
        <Button onClick={onCalc} disabled={loading}>{loading ? "جارٍ الحساب..." : "احسب العمولة"}</Button>
      </div>
      {res && (
        <div className="rounded-md border p-3">
          <div className="flex justify-between">
            <span>الفئة:</span>
            <span>{res.tier ? res.tier.name : "لا توجد فئة"}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span>العمولة:</span>
            <span>{formatCurrency(res.commission, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  );
}


