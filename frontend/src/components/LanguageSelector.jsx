import React, { useState, useEffect, useRef } from "react";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "hy", label: "Հայերեն", flag: "🇦🇲" },
];

export default function LanguageSelector({ selectedLang, onChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const currentLang = languages.find((lang) => lang.code === selectedLang) || languages[0];

  const handleSelect = (code) => {
    setOpen(false);
    onChange(code);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="language-selector" ref={menuRef}>
      <button
        className="language-button"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change language"
      >
        Language {currentLang.flag}
      </button>

      {open && (
        <ul className="language-menu">
          {languages
            .filter((lang) => lang.code !== selectedLang)
            .map((lang) => (
              <li
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="language-item"
              >
                {lang.flag} {lang.label}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}