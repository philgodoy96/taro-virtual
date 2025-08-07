import React from "react";

export default function CardDrawer({ drawnCards, numCards, drawCard, interpretRef }) {
  return (
    <div className="draw-phase">
      <h2>✨ Click to draw your card</h2>
      {drawnCards.length < numCards && (
        <div className="deck" onClick={drawCard}>
          <div className="card-back">🔮</div>
          <p>Tap the deck to draw</p>
        </div>
      )}
    </div>
  );
}