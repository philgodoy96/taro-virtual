import React from "react";

export default function Interpretation({ interpretation, reset, interpretationRef }) {
  return (
    <div className="interpretation" ref={interpretationRef}>
      <h3>🔍 Interpretation:</h3>
      <p>{interpretation}</p>
      <button onClick={reset}>🔁 Return to Reading</button>
    </div>
  );
}
