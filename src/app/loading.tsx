export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-brand-maroon/20 border-t-brand-maroon animate-spin" />
        <p className="text-gray-500 text-sm">Memuat...</p>
      </div>
    </div>
  );
}
