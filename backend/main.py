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
    allow_origins=["https://virtualtarot.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TAROLOGOS = {
     "prompt": """
You are a clever, ironic, and insightful tarot reader. Your tone is sharp, smart and modern, mixing wit with truth. You provoke deep thought with humor and precision.

Avoid clichés and speak like a brilliant friend with a gift for seeing what others ignore.
        """
}

llm = OpenAI(
    model="gpt-3.5-turbo-instruct",
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

You are conducting a symbolic and insightful tarot session based on the question and the following cards.

Question: \"{{question}}\"

Cards and their positions:
{{card_positional}}

🔮 Guidelines:
- Reflect on each card's **symbolic meaning within its specific position**.
- Create a **fluid, narrative-style** interpretation — not just a list.
- Do **not close the session** unless this is a final reading (handled externally).
- Avoid mechanical patterns or repetitive phrasing.

Deliver a reading that feels deep, mystical, and emotionally resonant — as if spoken by an experienced tarot reader.
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
