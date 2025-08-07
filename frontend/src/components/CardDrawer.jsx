import translations from "../utils/Translations";

export default function CardDrawer({ drawnCards, numCards, drawCard, interpretRef, language }) {
  const t = translations[language] || translations.en;

  return (
    <div className="draw-phase">
      <h2>{t.clickToDraw}</h2>
      {drawnCards.length < numCards && (
        <div className="deck" onClick={drawCard}>
          <div className="card-back">🔮</div>
          <p>{t.tapDeck}</p>
        </div>
      )}
    </div>
  );
}
