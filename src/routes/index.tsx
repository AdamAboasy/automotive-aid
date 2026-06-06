import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام توكيل السيارات" },
      { name: "description", content: "نظام إدارة توكيل سيارات متكامل: استقبال، ورشة، موارد بشرية." },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      const list = (roles ?? []).map((r) => r.role);
      if (list.includes("admin") || list.includes("reception")) navigate({ to: "/reception", replace: true });
      else if (list.includes("workshop_manager") || list.includes("technician")) navigate({ to: "/workshop", replace: true });
      else if (list.includes("hr")) navigate({ to: "/hr", replace: true });
      else navigate({ to: "/reception", replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}
