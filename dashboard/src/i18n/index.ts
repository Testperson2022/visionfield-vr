import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import da from "./locales/da.json";
import en from "./locales/en.json";

// Hent gemt sprog eller brug dansk som default
const savedLang = localStorage.getItem("vf_lang") || "da";

i18n.use(initReactI18next).init({
  resources: {
    da: { translation: da },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: "da",
  interpolation: { escapeValue: false },
});

export default i18n;
