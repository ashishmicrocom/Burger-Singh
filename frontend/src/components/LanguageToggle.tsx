import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === "en" ? "hi" : "en";
    console.log("Toggling language from", language, "to", newLang);
    setLanguage(newLang);
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleLanguage}
      title={`${t("common.language")}: ${language === "en" ? t("common.english") : t("common.hindi")}`}
    >
      <Globe className="h-4 w-4" />
      <span className="sr-only">{language === "en" ? "EN" : "हि"}</span>
    </Button>
  );
};
