export default function CatalogSkeleton() {
  return (
    <section className="py-20 sm:py-28 bg-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-4 w-28 mx-auto mb-3 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-8 w-64 mx-auto mb-4 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-5 w-96 mx-auto rounded-lg bg-gray-100 animate-pulse" />
        </div>

        {/* Category pills skeleton */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 rounded-full bg-gray-200 animate-pulse"
            />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] animate-pulse"
            >
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
  );
}