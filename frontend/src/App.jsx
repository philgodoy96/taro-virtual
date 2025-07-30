import React, { useState } from "react";

const spreads = {
  pathOfTheHeart: {
    title: "Path of the Heart",
    cards: 5,
    description: "Explore emotions, hidden dynamics, and romantic outcomes.",
    positions: [
      "Your emotional state",
      "Their feelings",
      "Hidden influence",
      "Spiritual advice",
      "Likely outcome"
    ]
  },
  threeCard: {
    title: "Past, Present, Future",
    cards: 3,
    description: "A quick timeline snapshot of your situation.",
    positions: ["Past", "Present", "Future"]
  },
  celticCross: {
    title: "Celtic Cross",
    cards: 10,
    description: "A deep and traditional 10-card reading.",
    positions: [
      "The Present",
      "The Challenge",
      "The Subconscious Root",
      "The Past",
      "The Conscious Goal",
      "The Near Future",
      "Your Attitude",
      "External Influences",
      "Hopes and Fears",
      "Final Outcome"
    ]
  }
};

const majorArcana = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
];

const suits = ["Cups", "Pentacles", "Swords", "Wands"];
const faces = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const minorArcana = suits.flatMap(suit => faces.map(face => `${face} of ${suit}`));
const fullDeck = [...majorArcana, ...minorArcana];

function shuffleDeck(deck) {
  return [...deck].sort(() => Math.random() - 0.5);
}

export default function TarotApp() {
  const [question, setQuestion] = useState("");
  const [spreadKey, setSpreadKey] = useState("pathOfTheHeart");
  const [drawnCards, setDrawnCards] = useState([]);
  const [interpretation, setInterpretation] = useState("");

  const handleDrawCards = () => {
    const spread = spreads[spreadKey];
    const shuffled = shuffleDeck(fullDeck);
    setDrawnCards(shuffled.slice(0, spread.cards));
    setInterpretation("");
  };

  const handleInterpret = async () => {
    const spread = spreads[spreadKey];
    const res = await fetch("https://taro-backend-2k9m.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, cards: drawnCards, positions: spread.positions })
    });
    const data = await res.json();
    setInterpretation(data.message);
  };

  const spread = spreads[spreadKey];

  return (
    <div className="container">
      <h1>🔮 Welcome to Your Tarot Reading</h1>

      <label>Your question:</label>
      <textarea
        rows={3}
        placeholder="Type your question here..."
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />

      <label>Select a spread:</label>
      <select value={spreadKey} onChange={e => setSpreadKey(e.target.value)}>
        {Object.entries(spreads).map(([key, spread]) => (
          <option key={key} value={key}>{spread.title}</option>
        ))}
      </select>

      <p><i>{spread.description}</i></p>

      <button onClick={handleDrawCards}>Draw Cards</button>

      <div className="card-list">
        {drawnCards.map((card, idx) => (
          <div className="card" key={idx}>
            <strong>{spread.positions[idx]}:</strong>
            <img src={`/cards/${card}.jpg`} alt={card} />
            <div>{card}</div>
          </div>
        ))}
      </div>

      {drawnCards.length === spread.cards && (
        <button onClick={handleInterpret}>Interpret Reading</button>
      )}

      {interpretation && (
        <div className="interpretation">
          <h3>🔍 Interpretation:</h3>
          <p>{interpretation}</p>
        </div>
      )}
    </div>
  );
} 