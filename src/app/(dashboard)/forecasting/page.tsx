"use client";

import { useRouter } from "next/navigation";
import { ForecastDashboard } from "@/components/forecasting";

export default function ForecastingPage() {
  const router = useRouter();

  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  return (
    <div className="space-y-6">
      <ForecastDashboard onDealClick={handleDealClick} />
    </div>
  );
}
