import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./de.json";
import en from "./en.json";

export type SupportedLang = "de" | "en";

export const SUPPORTED_LANGS: {
  code: SupportedLang;
  label: string;
  flag: string;
}[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: "de",
  fallbackLng: "de",
  interpolation: { escapeValue: false },
});

export default i18n;
