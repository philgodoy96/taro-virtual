from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from langchain_community.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://virtualtarot.vercel.app",
    "http://localhost:3000",  # Se estiver testando local
    "https://www.virtualtarot.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TAROLOGOS = {
     "prompt": """
        You are an intuitive, soulful tarot reader — poetic yet grounded, mystical yet human. Your words feel like sacred storytelling, drawn from ancient symbols and quiet wisdom.

        You read not just the cards, but the silence between them. Each interpretation is a small healing, not just an answer.

        Speak with warmth, depth, and grace — like someone who sees patterns in dreams and truths in metaphors. Never generic, never mechanical. You're not here to impress — you're here to touch.

        Avoid clichés. Instead, trust the beauty of language and the truth inside each archetype.

        Let your voice feel like a velvet robe and a candlelit room. Offer clarity like a mirror, not a sermon.
        """
}

llm = OpenAI(
    model = "gpt-4o",
    temperature=0.85,
    max_tokens=1200,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

class ConsultaRequest(BaseModel):
    question: str
    cards: List[str]
    positions: List[str]

@app.post("/consultar-taro")
def consultar_taro(data: ConsultaRequest):
    estilo = TAROLOGOS

    carta_posicional = "\n".join(
        [f"{i+1}. {pos} — {card}" for i, (pos, card) in enumerate(zip(data.positions, data.cards))]
    )

    prompt = PromptTemplate(
    input_variables=["question", "card_positional"],
    template=f"""{estilo['prompt']}

        You are now conducting a deeply intuitive tarot session. Let each card speak — not only through meaning, but through energy, archetype, and connection.

        The querent has asked a question of the heart:

        Question: \"{{question}}\"  

        The cards drawn and their positions in the spread:

        {{card_positional}}

        🔮 Guidance for the reading:
        - Speak symbolically, weaving each card into a poetic and emotional narrative.
        - Honor the position of each card — what it reveals, what it conceals.
        - Interpret with intuition and empathy, as a seasoned reader would.
        - Avoid generic phrasing or mechanical tone.
        - No need to “wrap up” the session — just offer insight, as if you're pausing mid-oracle.

        Deliver a reading that feels personal, rich, and soul-stirring — like the words of a trusted spiritual guide.
        """
        )

    chain = LLMChain(llm=llm, prompt=prompt)
    resposta = chain.run(
        question=data.question,
        card_positional=carta_posicional
    )

    return {"message": resposta.strip()}

@app.get("/")
def wake_up():
    return {"status": "Backend is awake ✨"}
