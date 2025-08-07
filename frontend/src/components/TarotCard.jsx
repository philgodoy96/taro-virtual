export default function TarotCard({ card, position }) {
  return (
    <div className="tarot-card">
      <h4>{position}</h4>
      <img
        src={`/images/cards/${card.replaceAll(" ", "_")}.jpg`}
        alt={card}
      />
      <p>{card}</p>
    </div>
  );
}
