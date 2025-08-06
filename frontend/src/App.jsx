import React, { useState, useEffect, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CardDrawer from "./components/CardDrawer";
import CardList from "./components/CardList";
import Interpretation from "./components/Interpretation";
import { shuffleDeck, defaultSpreads } from "./utils/tarotDeck";

export default function TarotApp() {
  // Core states to manage question, reading stage, card deck and result
  const [question, setQuestion] = useState("");
  const [numCards, setNumCards] = useState(3);
  const [stage, setStage] = useState("welcome");
  const [deck, setDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState("");

  const interpretRef = useRef(null);
  const interpretationRef = useRef(null);

  // Define positions for the current spread (defaults to 3-card spread)
  const spread = {
    positions: defaultSpreads[numCards] || Array(numCards).fill("Card")
  };

  // Ping the backend once when app loads (keeps it awake on Render)
  useEffect(() => {
    fetch("https://taro-backend-2k9m.onrender.com/").catch(console.error);
  }, []);

  // Starts a new reading by shuffling the deck and moving to draw stage
  const startReading = () => {
    setDeck(shuffleDeck());
    setDrawnCards([]);
    setInterpretation("");
    setStage("draw");
  };

  // Draws one card from the deck
  const drawCard = () => {
    const nextCard = deck.find(card => !drawnCards.includes(card));
    if (!nextCard) return;

    setDrawnCards(prev => {
      const updated = [...prev, nextCard];

      // Auto-scroll to interpretation button when all cards are drawn
      if (updated.length === numCards) {
        setTimeout(() => {
          interpretRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 2000);
      }

      return updated;
    });
  };

  // Sends the question and selected cards to the backend for interpretation
  const handleInterpret = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://taro-backend-2k9m.onrender.com/consult-tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cards: drawnCards,
          positions: spread.positions.slice(0, drawnCards.length),
          reader: "" // reserved for future use (e.g. multiple reader styles)
        })
      });

      const data = await response.json();
      setInterpretation(data.message);
      setStage("result");

      // Scroll to the generated interpretation
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

  // Resets the app to the initial state
  const reset = () => {
    setStage("welcome");
    setQuestion("");
    setInterpretation("");
    setDrawnCards([]);
  };

  return (
    <div className="container">
      {stage === "welcome" && (
        <WelcomeScreen
          question={question}
          setQuestion={setQuestion}
          numCards={numCards}
          setNumCards={setNumCards}
          startReading={startReading}
        />
      )}

      {stage === "draw" && (
        <CardDrawer
          drawnCards={drawnCards}
          numCards={numCards}
          drawCard={drawCard}
          interpretRef={interpretRef}
        />
      )}

      {(stage === "draw" || stage === "result") && (
        <CardList drawnCards={drawnCards} spread={spread} />
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
        <Interpretation
          interpretation={interpretation}
          reset={reset}
          interpretationRef={interpretationRef}
        />
      )}
    </div>
  );
}