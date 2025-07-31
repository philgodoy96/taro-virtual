import React, { useState, useEffect, useRef } from "react";

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

  const interpretRef = useRef(null);
  const interpretationRef = useRef(null);

  const defaultSpreads = {
    3: ["Past", "Present", "Future"],
    5: ["Situation", "Challenge", "Advice", "External Influence", "Outcome"],
    7: ["You", "Obstacle", "Hidden Factor", "Advice", "Others", "Future", "Spiritual Insight"],
    10: ["Present", "Challenge", "Subconscious", "Past", "Conscious", "Near Future", "You", "Environment", "Hopes/Fears", "Outcome"]
  };

  const spread = {
    positions: defaultSpreads[numCards] || Array(numCards).fill("Card")
  };

  useEffect(() => {
    fetch("https://taro-backend-2k9m.onrender.com/")
      .catch(console.error);
  }, []);

  const startReading = () => {
    setDeck(shuffleDeck());
    setDrawnCards([]);
    setInterpretation("");
    setStage("draw");
  };

  const drawCard = () => {
    const nextCard = deck.find(card => !drawnCards.includes(card));
    if (!nextCard) return;

    setDrawnCards(prev => {
      const updated = [...prev, nextCard];

      if (updated.length === numCards) {
        setTimeout(() => {
          interpretRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 2000);
      }

      return updated;
    });
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
          positions: spread.positions.slice(0, drawnCards.length),
          tarologo: ""
        })
      });

      const data = await response.json();
      setInterpretation(data.message);
      setStage("result");

      setTimeout(() => {
        interpretationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);

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
          <p className="subtitle"><em>What’s been on your heart lately?</em></p>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} />

          <label className="subtitle">How many cards do you want to draw?</label>
          <select value={numCards} onChange={e => setNumCards(parseInt(e.target.value))}>
            {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} cards</option>)}
          </select>

          <button 
            onClick={startReading} 
            disabled={!question.trim()}
          >
            Start Reading
          </button>
        </div>
      )}

      {stage === "draw" && (
        <div className="draw-phase">
          <h2>✨ Click to draw your card</h2>
          {drawnCards.length < numCards && (
            <div className="deck" onClick={drawCard}>
              <div className="card-back">🔮</div>
              <p>Click to draw your card</p>
            </div>
          )}
        </div>
      )}

      {(stage === "draw" || stage === "result") && (
        <div className="card-list">
          {[...drawnCards].reverse().map((card, idx) => (
            <div className="card-box" key={card}>
              <div className="card-title">{spread.positions[drawnCards.length - 1 - idx]}</div>
              <img className="card-image" src={`/cartas/${encodeURIComponent(card)}.jpg`} alt={card} />
              <div className="card-name">{card}</div>
            </div>
          ))}
        </div>
      )}

      {drawnCards.length === numCards && !interpretation && (
        <button
          ref={interpretRef}
          onClick={handleInterpret}
          disabled={loading}
          className={loading ? "loading" : ""}
        >
          {loading ? "Interpreting..." : "Interpret Reading"}
        </button>
      )}

      {stage === "result" && (
        <div className="interpretation" ref={interpretationRef}>
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