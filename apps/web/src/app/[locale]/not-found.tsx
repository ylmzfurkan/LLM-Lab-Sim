import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Home, FlaskConical } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-7xl font-bold font-mono text-primary">404</p>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-sm">{t("description")}</p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("home")}
          </Link>
        </Button>
        <Button asChild>
          <Link href="/projects">
            <FlaskConical className="mr-2 h-4 w-4" />
            {t("startSim")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
