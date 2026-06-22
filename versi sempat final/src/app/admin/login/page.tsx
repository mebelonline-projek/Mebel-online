import { getAllSettings } from "@/lib/site-config";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const settings = await getAllSettings();

  return <LoginForm logoUrl={settings.site_logo} />;
}
