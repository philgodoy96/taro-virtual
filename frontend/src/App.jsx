import { useState, useEffect, useRef } from "react";
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

  // Language state with persistence using localStorage
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("lang") || "en";
  });

  const interpretRef = useRef(null);
  const interpretationRef = useRef(null);

  // Determine spread positions based on selected number of cards
  const spread = {
    positions: defaultSpreads[numCards] || Array(numCards).fill("Card"),
  };

  // Wake up Render backend on app load (prevents cold start delay)
  useEffect(() => {
    fetch("https://taro-backend-2k9m.onrender.com/").catch(console.error);
  }, []);

  // Save selected language to localStorage on change
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  // Preload card images to improve UX
  useEffect(() => {
    if (deck.length > 0) {
      deck.forEach((card) => {
        const img = new Image();
        img.src = `/images/cards/${card.replaceAll(" ", "_")}.jpg`;
      });
    }
  }, [deck]);

  // Start a new tarot reading session
  const startReading = () => {
    setDeck(shuffleDeck());
    setDrawnCards([]);
    setInterpretation("");
    setStage("draw");
  };

  // Draw the next card from the deck
  const drawCard = () => {
    const nextCard = deck.find((card) => !drawnCards.includes(card));
    if (!nextCard) return;

    setDrawnCards((prev) => {
      const updated = [...prev, nextCard];

      // Scroll to interpretation button after the last card is drawn
      if (updated.length === numCards) {
        setTimeout(() => {
          interpretRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 2000);
      }

      return updated;
    });
  };

  // Request tarot interpretation from backend
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

      // Scroll to the interpretation section
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

  // Reset everything back to welcome screen
  const reset = () => {
    setStage("welcome");
    setQuestion("");
    setInterpretation("");
    setDrawnCards([]);
  };

  // Translation object for the current language
  const t = translations[language] || translations.en;

  return (
    <div className="container">
      {/* Language selector at the top of the app */}
      <LanguageSelector selectedLang={language} onChange={setLanguage} />

      {/* Welcome screen: question input + number of cards */}
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

      {/* Card drawing screen */}
      {stage === "draw" && (
        <CardDrawer
          drawnCards={drawnCards}
          numCards={numCards}
          drawCard={drawCard}
          interpretRef={interpretRef}
          language={language}
        />
      )}

      {/* Show drawn cards during draw/result stages */}
      {(stage === "draw" || stage === "result") && (
        <CardList drawnCards={drawnCards} spread={spread} language={language} />
      )}

      {/* Show Interpret button when all cards are drawn */}
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

      {/* Interpretation result screen */}
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