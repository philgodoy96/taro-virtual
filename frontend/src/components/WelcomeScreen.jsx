import { useRef, useEffect } from "react";

export default function WelcomeScreen({ question, setQuestion, numCards, setNumCards, startReading }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [question]);

  return (
    <div className="welcome">
      <h1>🔮 Welcome to Your Tarot Reading</h1>
      <p className="subtitle"><em>What’s been on your heart lately?</em></p>

      <textarea
        ref={textareaRef}
        value={question}
        onChange={e => setQuestion(e.target.value)}
        rows={3}
      />

      <label className="subtitle">How many cards do you want to draw?</label>
      <select value={numCards} onChange={e => setNumCards(parseInt(e.target.value))}>
        {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} cards</option>)}
      </select>

      <button onClick={startReading} disabled={!question.trim()}>
        Start Reading
      </button>
    </div>
  );
}