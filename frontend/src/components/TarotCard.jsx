import React from "react";

export default function TarotCard({ card, position }) {
  return (
    <div className="card-box">
      <div className="card-title">{position}</div>
      <img className="card-image" src={`/cartas/${encodeURIComponent(card)}.jpg`} alt={card} />
      <div className="card-name">{card}</div>
    </div>
  );
}