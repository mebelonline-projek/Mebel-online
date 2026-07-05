import LoginForm from "./LoginForm";

// Login page adalah Client Component wrapper murni
// Tidak ada data fetching di server untuk menghindari CPU timeout di Cloudflare Workers
export default function AdminLoginPage() {
  return <LoginForm />;
}
