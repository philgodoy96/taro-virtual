import React, { useState, useEffect, useRef } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import CardDrawer from "./components/CardDrawer";
import CardList from "./components/CardList";
import Interpretation from "./components/Interpretation";
import LanguageSelector from "./components/LanguageSelector";
import { shuffleDeck, defaultSpreads } from "./utils/tarotDeck";
import translations from "./utils/Translations";

export default function TarotApp() {
  // Main app state
  const [question, setQuestion] = useState("");
  const [numCards, setNumCards] = useState(3);
  const [stage, setStage] = useState("welcome");
  const [deck, setDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState("");

  // Language state with persistence
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("lang") || "en";
  });

  const interpretRef = useRef(null);
  const interpretationRef = useRef(null);

  // Define positions based on spread size
  const spread = {
    positions: defaultSpreads[numCards] || Array(numCards).fill("Card"),
  };

  // Wake up backend on app load
  useEffect(() => {
    fetch("https://taro-backend-2k9m.onrender.com/").catch(console.error);
  }, []);

  // Persist language selection
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  // Preload card images
  useEffect(() => {
    if (deck.length > 0) {
      deck.forEach((card) => {
        const img = new Image();
        img.src = `/images/cards/${card.replaceAll(" ", "_")}.jpg`;
      });
    }
  }, [deck]);

  // Start a new reading
  const startReading = () => {
    setDeck(shuffleDeck());
    setDrawnCards([]);
    setInterpretation("");
    setStage("draw");
  };

  // Draw the next card
  const drawCard = () => {
    const nextCard = deck.find((card) => !drawnCards.includes(card));
    if (!nextCard) return;

    setDrawnCards((prev) => {
      const updated = [...prev, nextCard];

      if (updated.length === numCards) {
        setTimeout(() => {
          interpretRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 2000);
      }

      return updated;
    });
  };

  // Interpret the reading via backend
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
          reader: "",
          lang: language,
        }),
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

  // Reset app state
  const reset = () => {
    setStage("welcome");
    setQuestion("");
    setInterpretation("");
    setDrawnCards([]);
  };

  // Get translation object
  const t = translations[language] || translations.en;

  return (
    <div className="container">
      {/* Language selector only in welcome screen */}
      {stage === "welcome" && (
        <LanguageSelector selectedLang={language} onChange={setLanguage} />
      )}

      {stage === "welcome" && (
        <WelcomeScreen
          question={question}
          setQuestion={setQuestion}
          numCards={numCards}
          setNumCards={setNumCards}
          startReading={startReading}
          language={language}
        />
      )}

      {stage === "draw" && (
        <CardDrawer
          drawnCards={drawnCards}
          numCards={numCards}
          drawCard={drawCard}
          interpretRef={interpretRef}
          language={language}
        />
      )}

      {(stage === "draw" || stage === "result") && (
        <CardList drawnCards={drawnCards} spread={spread} language={language} />
      )}

      {drawnCards.length === numCards && !interpretation && (
        <button
          ref={interpretRef}
          onClick={handleInterpret}
          disabled={loading}
          className={loading ? "loading" : ""}
        >
          {loading ? t.interpreting : t.interpret}
        </button>
      )}

      {stage === "result" && (
        <Interpretation
          interpretation={interpretation}
          reset={reset}
          interpretationRef={interpretationRef}
          language={language}
        />
      )}
    </div>
  );
}