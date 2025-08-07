import translations from "../utils/Translations";

export default function TarotCard({ card, position, language }) {
  const t = translations[language] || translations.en;

  return (
    <div className="card-box">
      <div className="card-title">{position}</div>
      <img className="card-image" src={`/images/cards/${encodeURIComponent(card)}.jpg`} alt={card} />
      <div className="card-name">
        {t.cards?.[card] || card}
      </div>
    </div>
  );
}
