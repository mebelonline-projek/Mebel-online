import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import { Package, Tags, CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function DashboardOverview() {
  const [totalProducts, totalCategories, activeProducts, inactiveProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
    ]);

  const stats = [
    {
      label: "Total Produk",
      value: totalProducts,
      icon: Package,
      color: "bg-blue-500",
      href: "/admin/dashboard/products",
    },
    {
      label: "Kategori",
      value: totalCategories,
      icon: Tags,
      color: "bg-brand-orange",
      href: "/admin/dashboard/categories",
    },
    {
      label: "Produk Aktif",
      value: activeProducts,
      icon: CheckCircle,
      color: "bg-green-500",
      href: "/admin/dashboard/products",
    },
    {
      label: "Produk Tidak Aktif",
      value: inactiveProducts,
      icon: XCircle,
      color: "bg-red-500",
      href: "/admin/dashboard/products",
    },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/dashboard/products"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-brand-maroon/5 transition-colors group"
            >
              <Package className="h-5 w-5 text-brand-maroon" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-maroon transition-colors">
                Kelola Produk
              </span>
            </Link>
            <Link
              href="/admin/dashboard/categories"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-brand-maroon/5 transition-colors group"
            >
              <Tags className="h-5 w-5 text-brand-orange" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-maroon transition-colors">
                Kelola Kategori
              </span>
            </Link>
            <Link
              href="/admin/dashboard/settings"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-brand-maroon/5 transition-colors group"
            >
              <svg className="h-5 w-5 text-brand-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-maroon transition-colors">
                Pengaturan Landing
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
