from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

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

READERS = {
    "prompt": """
        You're a grounded, intuitive tarot reader who speaks like a trusted friend. Your readings are conversational, honest, and insightful — like someone who knows the cards deeply but doesn't hide behind them.

        You meet the querent where they are: if the question is heavy, you bring empathy; if it's light, you bring warmth and humor. Avoid sounding like a mystical oracle. Speak like someone who's human first, reader second.

        Always adapt your tone to the question. Be real, be kind, be clear.
    """
}

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class ConsultationRequest(BaseModel):
    question: str
    cards: List[str]
    positions: List[str]

def make_openai_request(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    try:
        response = requests.post(OPENAI_API_URL, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")

        if response.status_code == 200:
            return response.json().get('choices', [{}])[0].get('message', {}).get('content', "Error processing reading with OpenAI.")
        else:
            return f"Error processing reading: {response.status_code} - {response.text}"
    except Exception as e:
        print(f"Connection error: {str(e)}")
        return f"Error connecting to OpenAI: {str(e)}"

@app.post("/consult-tarot")
def consult_tarot(data: ConsultationRequest):
    try:
        print("📩 Received:")
        print("❓ Question:", data.question)
        print("🃏 Cards:", data.cards)
        print("📌 Positions:", data.positions)

        if not data.question.strip():
            raise HTTPException(status_code=422, detail="The question cannot be empty.")
        if not data.cards or not data.positions:
            raise HTTPException(status_code=422, detail="Cards and positions are required.")

        carta_posicional = "\n".join(
            [f"{i+1}. {pos} — {card}" for i, (pos, card) in enumerate(zip(data.positions, data.cards))] 
        )

        prompt = f"""{READERS['prompt']}

The querent has asked you something important:

Question: "{data.question}"

These are the cards drawn and their positions:

{carta_posicional}

🎯 Your task:

Speak to the seeker like a close, grounded friend who knows the cards well. Let your interpretation flow naturally — as if you were explaining what you feel from the cards, not giving a performance. Avoid formal structure, headers, or formatting tricks. No "**Advice — Card Name:**" style.

Bring empathy, clarity, and personality. You don't need to be poetic — just intuitive, thoughtful, and real.

If the question is sensitive, show care. If it's light, feel free to smile through your words. But **always answer the question** with honesty and heart.
"""

        resposta = make_openai_request(prompt)
        print("🔁 OpenAI Response:", resposta)
        return {"message": resposta.strip()}

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print("🔥 Internal error:", e)
        raise HTTPException(status_code=500, detail=f"Error processing reading: {str(e)}")

@app.get("/")
def wake_up():
    return {"status": "Backend is awake ✨"}
