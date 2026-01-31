import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-end">
          <LanguageToggle />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center">
            <img src="/burgersingh-logo.png" className="h-14 w-14" alt="" />
          </div>
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("error.pageNotFound")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("error.somethingWentWrong")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("common.back")}
              </Link>
            </Button>
            <Button asChild className="btn-accent">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {t("error.goHome")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
