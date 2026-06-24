"use client";

export default function AdminHeader({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center gap-3 px-6 lg:px-8">
      {/* Logo */}
      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-brand-maroon/20 p-0.5">
        <img
          src="/logo/admin-logo.png"
          alt="Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
