import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-brand-maroon" />
        <p className="text-gray-500 text-sm">Memuat dashboard...</p>
      </div>
    </div>
  );
}
