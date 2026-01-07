import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Hook to use translations in components
 * @returns Translation function and current language
 * 
 * Usage:
 * const { t, language, setLanguage } = useTranslation();
 * return <p>{t('common.home')}</p>
 */
export const useTranslation = () => {
  return useLanguage();
};
