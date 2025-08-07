from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend integration (Vercel + local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://virtualtarot.vercel.app",
        "https://www.virtualtarot.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API configuration
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Request model for tarot consultation
class ConsultationRequest(BaseModel):
    question: str
    cards: List[str]
    positions: List[str]

# Function to send prompt to Groq
def make_groq_request(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    response = requests.post(GROQ_API_URL, headers=headers, json=data)
    if response.status_code == 200:
        return response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    else:
        print(f"[Groq Error] Status {response.status_code}: {response.text}")
        raise HTTPException(status_code=response.status_code, detail="Error from Groq API.")

# Endpoint for tarot consultation
@app.post("/consult-tarot")
def consult_tarot(data: ConsultationRequest):
    if not data.question.strip():
        raise HTTPException(status_code=422, detail="The question cannot be empty.")
    if not data.cards or not data.positions:
        raise HTTPException(status_code=422, detail="Cards and positions are required.")

    card_details = "\n".join(
        [f"{i + 1}. {pos} — {card}" for i, (pos, card) in enumerate(zip(data.positions, data.cards))]
    )

    full_prompt = f"""
You're a grounded, intuitive tarot reader who speaks like a trusted friend. Your readings are conversational, honest, and insightful — like someone who knows the cards deeply but doesn't hide behind them.

You meet the querent where they are: if the question is heavy, you bring empathy; if it's light, you bring warmth and humor. Avoid sounding like a mystical oracle. Speak like someone who's human first, reader second.

Always adapt your tone to the question. Be real, be kind, be clear.

The querent has asked you something important:

Question: "{data.question}"

These are the cards drawn and their positions:

{card_details}

🎯 Your task:

Speak to the seeker like a close, grounded friend who knows the cards well. Let your interpretation flow naturally — as if you were explaining what you feel from the cards, not giving a performance. Avoid formal structure, headers, or formatting tricks. No "**Advice — Card Name:**" style.

Bring empathy, clarity, and personality. You don't need to be poetic — just intuitive, thoughtful, and real.

If the question is sensitive, show care. If it's light, feel free to smile through your words. But always answer the question with honesty and heart.
"""

    interpretation = make_groq_request(full_prompt)
    return {"message": interpretation.strip()}

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "Backend is awake ✨"}