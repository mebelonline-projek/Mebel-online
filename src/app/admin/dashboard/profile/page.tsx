import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const name = session.user.name || "Admin";
  const email = session.user.email || "";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <AdminHeader title="Profil Admin" />

      <div className="p-6 lg:p-8 max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="h-16 w-16 rounded-full bg-brand-maroon text-white text-lg font-semibold flex items-center justify-center ring-4 ring-gray-50">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-4">Ganti Password</h3>

          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}