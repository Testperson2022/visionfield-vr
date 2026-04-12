import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === "da" ? "en" : "da";
    i18n.changeLanguage(next);
    localStorage.setItem("vf_lang", next);
  };

  return (
    <button
      onClick={toggle}
      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-600"
    >
      {i18n.language === "da" ? "EN" : "DA"}
    </button>
  );
}
