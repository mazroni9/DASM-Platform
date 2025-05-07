/**
 * ✅ ملف تجميعي لجميع مكونات الواجهة
 * 📁 المسار: Frontend-local/components/index.ts
 *
 * ✅ الوظيفة:
 * - يسهّل استيراد المكونات من مكان واحد
 * - بدلاً من: import AuctionCard from '@/components/AuctionCard'
 *   تكتب فقط: import { AuctionCard } from '@/components'
 */

export { default as AuctionCard } from "./AuctionCard";
export { default as BidForm } from "./BidForm";
export { default as BidTimer } from "./BidTimer";
export { default as CarDataEntryButton } from "./CarDataEntryButton";
export { default as CountdownTimer } from "./CountdownTimer";
