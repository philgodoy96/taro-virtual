const major = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
];

const suits = ["Cups", "Pentacles", "Swords", "Wands"];

const faces = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Page", "Knight", "Queen", "King"
];

const minor = suits.flatMap(suit =>
  faces.map(face => `${face} of ${suit}`)
);

export const fullDeck = [...major, ...minor];

export const shuffleDeck = () => [...fullDeck].sort(() => Math.random() - 0.5);

export const defaultSpreads = {
  3: ["Past", "Present", "Future"],
  5: ["Situation", "Challenge", "Advice", "External Influence", "Outcome"],
  7: ["You", "Obstacle", "Hidden Factor", "Advice", "Others", "Future", "Spiritual Insight"],
  10: [
    "Present", "Challenge", "Subconscious", "Past", "Conscious",
    "Near Future", "You", "Environment", "Hopes/Fears", "Outcome"
  ]
};