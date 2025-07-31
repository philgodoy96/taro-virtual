from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from fastapi.responses import JSONResponse
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

TAROLOGOS = {
    "prompt": """
        You're a grounded, intuitive tarot reader who speaks like a trusted friend. Your readings are conversational, honest, and insightful — like someone who knows the cards deeply but doesn't hide behind them.

        You meet the querent where they are: if the question is heavy, you bring empathy; if it's light, you bring warmth and humor. Avoid sounding like a mystical oracle. Speak like someone who's human first, reader second.

        Always adapt your tone to the question. Be real, be kind, be clear.

        """
        }

llm = ChatOpenAI(
    model="gpt-4o",
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
    try:
        # ✅ Log básico
        print("📩 Recebido:")
        print("❓ Pergunta:", data.question)
        print("🃏 Cartas:", data.cards)
        print("📌 Posições:", data.positions)

        if not data.question.strip():
            raise HTTPException(status_code=422, detail="A pergunta não pode estar vazia.")
        if not data.cards or not data.positions:
            raise HTTPException(status_code=422, detail="Cartas e posições são obrigatórias.")

        carta_posicional = "\n".join(
            [f"{i+1}. {pos} — {card}" for i, (pos, card) in enumerate(zip(data.positions, data.cards))]
        )

        prompt = PromptTemplate(
    input_variables=["question", "card_positional"],
    template=f"""{TAROLOGOS['prompt']}

The querent has asked you something important:

Question: "{{question}}"

These are the cards drawn and their positions:

{{card_positional}}

🎯 Your task:

Speak to the seeker like a close, grounded friend who knows the cards well. Let your interpretation flow naturally — as if you were explaining what you feel from the cards, not giving a performance. Avoid formal structure, headers, or formatting tricks. No "**Advice — Card Name:**" style.

Bring empathy, clarity, and personality. You don't need to be poetic — just intuitive, thoughtful, and real.

If the question is sensitive, show care. If it's light, feel free to smile through your words. But **always answer the question** with honesty and heart.
"""
)

        chain = LLMChain(llm=llm, prompt=prompt)
        resposta = chain.run(
            question=data.question,
            card_positional=carta_posicional
        )

        print("🔁 Resposta da LLM:", resposta)
        return {"message": resposta.strip()}

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print("🔥 Erro interno:", e)
        raise HTTPException(status_code=500, detail=f"Erro ao processar leitura: {str(e)}")

@app.get("/")
def wake_up():
    return {"status": "Backend is awake ✨"}
