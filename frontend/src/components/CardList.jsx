import TarotCard from "./TarotCard";
import translations from "../utils/Translations";

export default function CardList({ drawnCards, spread, language }) {
  const t = translations[language] || translations.en;

  return (
    <div className="card-list">
      {[...drawnCards].reverse().map((card, idx) => {
        const spreadIndex = drawnCards.length - 1 - idx;
        const originalPosition = spread.positions[spreadIndex];
        const translatedPosition = t.positions?.[originalPosition] || originalPosition;

        return (
          <TarotCard
            key={card}
            card={card}
            position={translatedPosition}
            language={language}
          />
        );
      })}
    </div>
  );
}