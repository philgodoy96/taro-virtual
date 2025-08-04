import TarotCard from "./TarotCard";

export default function CardList({ drawnCards, spread }) {
  return (
    <div className="card-list">
      {[...drawnCards].reverse().map((card, idx) => (
        <TarotCard
          key={card}
          card={card}
          position={spread.positions[drawnCards.length - 1 - idx]}
        />
      ))}
    </div>
  );
}
