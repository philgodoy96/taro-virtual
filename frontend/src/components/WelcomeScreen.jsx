import { useRef, useEffect } from "react";
import translations from "../utils/Translations";

export default function WelcomeScreen({ question, setQuestion, numCards, setNumCards, startReading, language }) {
  const textareaRef = useRef(null);
  const t = translations[language] || translations.en;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [question]);

  return (
    <div className="welcome">
      <h1>{t.welcome}</h1>
      <p className="subtitle"><em>{t.subtitle}</em></p>

      <textarea
        ref={textareaRef}
        value={question}
        onChange={e => setQuestion(e.target.value)}
        rows={3}
      />

      <label className="subtitle">{t.howMany}</label>
      <select value={numCards} onChange={e => setNumCards(parseInt(e.target.value))}>
        {[3, 5, 7, 10].map(n => (
          <option key={n} value={n}>
            {n} {n === 1 ? "card" : "cards"}
          </option>
        ))}
      </select>

      <button onClick={startReading} disabled={!question.trim()}>
        {t.start}
      </button>
    </div>
  );
}