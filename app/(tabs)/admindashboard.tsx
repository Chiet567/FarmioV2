import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the full admin dashboard in screens folder
    router.replace("/screens/admindashboard");
  }, []);

  return null;
}
