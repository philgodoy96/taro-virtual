import translations from "../utils/Translations";

export default function Interpretation({ interpretation, reset, interpretationRef, language }) {
  const t = translations[language] || translations.en;

  return (
    <div className="interpretation" ref={interpretationRef}>
      <h3>{t.interpretationTitle}</h3>
      <p>{interpretation}</p>
      <button onClick={reset}>{t.return}</button>
    </div>
  );
}
