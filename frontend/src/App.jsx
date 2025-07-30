// TarotApp.jsx — Nova estrutura com fluxo dividido por etapas (Welcome, Draw, Result)
import React, { useState, useEffect } from "react";

const fullDeck = (() => {
  const major = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
  ];
  const suits = ["Cups", "Pentacles", "Swords", "Wands"];
  const faces = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
  const minor = suits.flatMap(suit => faces.map(face => `${face} of ${suit}`));
  return [...major, ...minor];
})();

const shuffleDeck = () => [...fullDeck].sort(() => Math.random() - 0.5);

export default function TarotApp() {
  const [question, setQuestion] = useState("");
  const [numCards, setNumCards] = useState(3);
  const [stage, setStage] = useState("welcome");
  const [deck, setDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [currentCard, setCurrentCard] = useState(null);

  useEffect(() => {
    fetch("https://taro-backend-2k9m.onrender.com/")
      .then(() => console.log("🔥 Backend ready"))
      .catch(console.error);
  }, []);

  const startReading = () => {
    setDeck(shuffleDeck());
    setDrawnCards([]);
    setInterpretation("");
    setStage("draw");
  };

  const drawCard = () => {
    if (drawnCards.length < numCards) {
      const nextCard = deck.find(card => !drawnCards.includes(card));
      setDrawnCards([...drawnCards, nextCard]);
    }
  };

  const handleInterpret = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://taro-backend-2k9m.onrender.com/consultar-taro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cards: drawnCards,
          positions: Array(drawnCards.length).fill("Card"),
          tarologo: "clara"
        })
      });
      const data = await response.json();
      setInterpretation(data.message);
      setStage("result");
    } catch (err) {
      alert("Error during interpretation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {stage === "welcome" && (
        <div className="welcome">
          <h1>🔮 Welcome to Your Tarot Reading</h1>
          <p>Close your eyes, take a breath, and focus on your question...</p>
          <label>Your question:</label>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} />

          <label>How many cards do you want to draw?</label>
          <select value={numCards} onChange={e => setNumCards(parseInt(e.target.value))}>
            {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} cards</option>)}
          </select>

          <button onClick={startReading}>Start Reading</button>
        </div>
      )}

      {stage === "draw" && (
        <div className="draw-phase">
          <h2>✨ Click to draw your card</h2>
          {drawnCards.length < numCards && !currentCard && (
            <div className="deck" onClick={handleDrawCard}>
              <div className="card-back">🔮</div>
              <p>Click to draw your card</p>
            </div>
          )}

          <div className="card-list">
            {drawnCards.map((card, idx) => (
            <div className="card" key={idx}>
              <strong>{spread.positions[idx]}</strong> {/* ← título simbólico */}
              <img src={`/cartas/${encodeURIComponent(card)}.jpg`} alt={card} />
              <div>{card}</div>
            </div>
          ))}
          </div>

          {currentCard && (
            <div className="card animated">
              <strong>{spread.positions[drawnCards.length]}</strong>
              <img src={`/cartas/${encodeURIComponent(currentCard)}.jpg`} alt={currentCard} />
              <div>{currentCard}</div>
            </div>
          )}

          {drawnCards.length === numCards && !interpretation && (
            <button
              onClick={handleInterpret}
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              {loading ? "Interpreting..." : "Interpret Reading"}
            </button>
          )}

        </div>
      )}

      {stage === "result" && (
        <div className="interpretation">
          <h3>🔍 Interpretation:</h3>
          <p>{interpretation}</p>

        <button onClick={() => {
        setStage("welcome");
        setQuestion("");
        setInterpretation("");
        setDrawnCards([]);
      }}>
        🔁 Return to Reading
      </button>

        </div>
      )}
    </div>
  );
} 