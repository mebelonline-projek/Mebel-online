export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
              <div>
                <div className="h-3 w-20 bg-gray-200 animate-pulse rounded mb-1" />
                <div className="h-5 w-28 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 w-20 rounded-full bg-gray-100 animate-pulse" />
              ))}
            </div>
            <div className="hidden md:block h-9 w-32 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Hero skeleton */}
      <section className="relative h-screen min-h-[450px] sm:min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="h-6 w-48 mx-auto mb-6 rounded-full bg-white/10 animate-pulse" />
          <div className="h-16 w-3/4 mx-auto mb-6 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-0.5 w-24 mx-auto mb-6 bg-white/10 animate-pulse" />
          <div className="h-6 w-2/3 mx-auto rounded-lg bg-white/5 animate-pulse" />
        </div>
      </section>

      {/* Catalog skeleton */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-4 w-28 mx-auto mb-3 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-8 w-64 mx-auto mb-4 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-5 w-96 mx-auto rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-200 via-gray-100 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-3 w-20 rounded-full bg-gray-300 mb-2" />
                  <div className="h-5 w-32 rounded-lg bg-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}