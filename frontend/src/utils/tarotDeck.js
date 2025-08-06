// tarotDeck.js – Define full Tarot deck and default card spreads

// Major Arcana cards (22 cards)
const major = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
];

// Minor Arcana suits and faces (56 cards)
const suits = ["Cups", "Pentacles", "Swords", "Wands"];
const faces = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Page", "Knight", "Queen", "King"
];

// Combine suits and faces to build Minor Arcana
const minor = suits.flatMap(suit =>
  faces.map(face => `${face} of ${suit}`)
);

// Full Tarot deck (78 cards total)
export const fullDeck = [...major, ...minor];

// Simple shuffle function
export const shuffleDeck = () => [...fullDeck].sort(() => Math.random() - 0.5);

// Predefined spreads for common card readings
export const defaultSpreads = {
  3: ["Past", "Present", "Future"],
  5: ["Situation", "Challenge", "Advice", "External Influence", "Outcome"],
  7: ["You", "Obstacle", "Hidden Factor", "Advice", "Others", "Future", "Spiritual Insight"],
  10: [
    "Present", "Challenge", "Subconscious", "Past", "Conscious",
    "Near Future", "You", "Environment", "Hopes/Fears", "Outcome"
  ]
};