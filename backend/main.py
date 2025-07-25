from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from langchain_community.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from passlib.context import CryptContext
from jose import jwt, JWTError
import sqlite3
import os
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import uuid

load_dotenv()

MERCADO_PAGO_TOKEN = os.getenv("MERCADO_PAGO_TOKEN")

# Configurações JWT
SECRET_KEY = os.getenv("SECRET_KEY", "chave_super_secreta")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tarovirtual.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Banco de dados SQLite
def init_db():
    conn = sqlite3.connect("usuarios.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            pagamento BOOLEAN DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Modelos de dados
class ConsultaRequest(BaseModel):
    pergunta: str
    cartas: List[str]
    tarologo: str
    etapa: str

class UserAuth(BaseModel):
    email: str
    senha: str

class TokenResponse(BaseModel):
    token: str
    email: str
    pagamento: bool

# Utilitários JWT
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str = Header(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ENDPOINT: Cadastro
@app.post("/cadastro")
def cadastrar(usuario: UserAuth):
    conn = sqlite3.connect("usuarios.db")
    cursor = conn.cursor()
    hashed = pwd_context.hash(usuario.senha)
    try:
        cursor.execute("INSERT INTO usuarios (email, senha) VALUES (?, ?)", (usuario.email, hashed))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    finally:
        conn.close()
    return {"mensagem": "Cadastro realizado com sucesso"}

# ENDPOINT: Login
@app.post("/login", response_model=TokenResponse)
def login(usuario: UserAuth):
    conn = sqlite3.connect("usuarios.db")
    cursor = conn.cursor()
    cursor.execute("SELECT senha, pagamento FROM usuarios WHERE email = ?", (usuario.email,))
    row = cursor.fetchone()
    conn.close()
    if not row or not pwd_context.verify(usuario.senha, row[0]):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    token = create_access_token({"sub": usuario.email})
    return {"token": token, "email": usuario.email, "pagamento": bool(row[1])}

# Tarólogos
tarologos = {
    "clara": {
        "prompt": """Você é Mercedes, uma taróloga extremamente positiva e animada e esperançosa. Sua leitura de tarô é sempre voltada para destacar o que há de luz, oportunidades de crescimento e energias favoráveis — mesmo em cartas desafiadoras. Fale como se estivesse olhando nos olhos do consulente, com carinho e fé no futuro. Seja mística, mas acessível.

        INSTRUÇÕES:
        Você está conduzindo uma sessão de tarô profunda e simbólica, com base na pergunta e nas cartas tiradas.

        ❌ Não descreva cada carta mecanicamente nem siga a ordem como uma lista.
        ❌ Evite estrutura repetitiva do tipo: “essa carta mostra algo bom, mas a próxima mostra um desafio”.

        ✅ Construa uma narrativa integrada, como se as cartas formassem uma história ou jornada.
        ✅ Use sensibilidade, metáforas suaves e uma visão encorajadora, mesmo diante de dificuldades.
        ✅ Faça conexões simbólicas entre as cartas e traga conselhos acolhedores e transformadores.

        Sua resposta deve parecer uma leitura feita por alguém experiente, empática e inspiradora.
        
        ⚠️ Importante: a sessão é composta por várias etapas.
    - Se a etapa **NÃO for** a última (“etapa3”), **não finalize a leitura nem diga que a jornada terminou**.
    - **Somente na etapa3** é permitido encerrar a leitura com uma conclusão, despedida ou mensagem final inspiradora.

    Evite repetições mecânicas como “mas atenção para a próxima carta…”. Escreva como um tarólogo sábio e fluido, com naturalidade e profundidade.
    """
    },
    "jaime": {
        "prompt": """Você é Jaime, um tarólogo místico, introspectivo e filosófico.
        Suas leituras são profundas, simbólicas e inspiradas em sabedoria ancestral. Você interpreta as cartas como arquétipos universais e reflete sobre o destino, os ciclos da vida e a alma humana.

        Você utiliza uma linguagem densa, quase oracular, com toques de filosofia, esoterismo e espiritualidade. Não tenha pressa. Cada palavra deve parecer sagrada, carregada de significado.

        Fale como quem está canalizando algo maior, com reverência às cartas e ao mistério.

        INSTRUÇÕES:
        Você está conduzindo uma sessão de tarô profunda e simbólica, com base na pergunta e nas cartas tiradas.

        ❌ Não descreva cada carta mecanicamente nem siga a ordem como uma lista.
        ❌ Evite estrutura repetitiva do tipo: “essa carta mostra algo bom, mas a próxima mostra um desafio”.

        ✅ Construa uma narrativa arquetípica e simbólica, refletindo sobre a jornada espiritual que as cartas revelam.
        ✅ Use referências esotéricas, imagens míticas e interpretações interligadas.
        ✅ Fale com profundidade, como um sábio oráculo, criando uma leitura atemporal e transformadora.

        Sua resposta deve parecer uma canalização mística, não uma explicação comum.
        
        ⚠️ Importante: a sessão é composta por várias etapas.
    - Se a etapa **NÃO for** a última (“etapa3”), **não finalize a leitura nem diga que a jornada terminou**.
    - **Somente na etapa3** é permitido encerrar a leitura com uma conclusão, despedida ou mensagem final inspiradora.

    Evite repetições mecânicas como “mas atenção para a próxima carta…”. Escreva como um tarólogo sábio e fluido, com naturalidade e profundidade."""

    },
    "felipe": {
       "prompt": """Você é Felipe, um tarólogo debochado, espirituoso e afiado.
        Sua leitura é cheia de sarcasmo, humor ácido e comentários inteligentes. Você não alivia a verdade, mas sempre arranca risadas mesmo nos piores cenários.

        Use memes, gírias, analogias engraçadas e linguagem informal. Não seja agressivo, mas sim sarcástico e teatral. Interprete as cartas como um amigo que sabe dar esporro com graça.

        Fale como se estivesse em um reality show esotérico. Divertido, dramático e hilário — mas sempre certeiro.

        INSTRUÇÕES:
        Você está conduzindo uma sessão de tarô profunda e simbólica, com base na pergunta e nas cartas tiradas.

        ❌ Não descreva cada carta mecanicamente nem siga a ordem como uma lista.
        ❌ Evite estrutura repetitiva do tipo: “essa carta mostra algo bom, mas a próxima mostra um desafio”.

        ✅ Crie uma leitura como se fosse uma novela dramática e hilária. Conecte as cartas numa trama cheia de viradas e sarcasmo.
        ✅ Traga conselhos com deboche, ironia e humor — mas que no fundo, toquem verdades profundas.
        ✅ Divirta, choque e provoque reflexões, tudo ao mesmo tempo.

        Sua resposta deve parecer uma leitura feita por um tarólogo que também poderia apresentar o Big Brother Místico do Multiverso.
        
        ⚠️ Importante: a sessão é composta por várias etapas.
    - Se a etapa **NÃO for** a última (“etapa3”), **não finalize a leitura nem diga que a jornada terminou**.
    - **Somente na etapa3** é permitido encerrar a leitura com uma conclusão, despedida ou mensagem final inspiradora.

    Evite repetições mecânicas como “mas atenção para a próxima carta…”. Escreva como um tarólogo sábio e fluido, com naturalidade e profundidade."""

    }
}

etapa_nomes = {
    "cruz_celta": "Cruz Celta – leitura completa da jornada...",
    "etapa9": "Leitura de 9 cartas – análise simbólica...",
    "etapa7": "Leitura de 7 cartas – caminho espiritual...",
    "etapa5": "Leitura de 5 cartas – análise de uma situação...",
    "etapa3": "Leitura final de 3 cartas – visão do passado..."
}

# LLM
llm = OpenAI(
    model="gpt-3.5-turbo-instruct",
    temperature=0.85,
    max_tokens=1200,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# ENDPOINT: Consulta protegida
@app.post("/consultar-taro")
# def consultar_taro(data: ConsultaRequest, email: str = Depends(verify_token)):
def consultar_taro(data: ConsultaRequest):
   # Verificação desativada durante testes
    # conn = sqlite3.connect("usuarios.db")
    # cursor = conn.cursor()
    # cursor.execute("SELECT pagamento FROM usuarios WHERE email = ?", (email,))
    # row = cursor.fetchone()
    # conn.close()

    #if not row or not row[0]:
    #    raise HTTPException(status_code=403, detail="Usuário não realizou o pagamento")

    estilo = tarologos.get(data.tarologo, tarologos["clara"])
    descricao_etapa = etapa_nomes.get(data.etapa, "Leitura adicional")

    prompt = PromptTemplate(
        input_variables=["pergunta", "cartas"],
        template=f"""{estilo['prompt']}

    Etapa da leitura: {descricao_etapa}
    Pergunta do consulente: "{{pergunta}}"
    Cartas sorteadas: {{cartas}}
    """
        )

    chain = LLMChain(llm=llm, prompt=prompt)
    resposta = chain.run(pergunta=data.pergunta, cartas=", ".join(data.cartas))
    return {"mensagem": resposta.strip()}

import requests

class PagamentoRequest(BaseModel):
    email: str
    valor: float = 10.0

@app.post("/criar-pagamento")
def criar_pagamento(data: PagamentoRequest):
    url = "https://api.mercadopago.com/v1/payments"
    headers = {
        "Authorization": f"Bearer {MERCADO_PAGO_TOKEN}",
        "Content-Type": "application/json",
        "X-Idempotency-Key": str(uuid.uuid4())
    }

    payload = {
        "transaction_amount": data.valor,
        "description": "Leitura de Tarô Virtual",
        "payment_method_id": "pix",
        "payer": {
            "email": data.email
        }
    }

    response = requests.post(url, headers=headers, json=payload)

    try:
        result = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao converter resposta: {str(e)}")

    if response.status_code != 201:
        print("❌ Erro do Mercado Pago:", result)
        raise HTTPException(status_code=500, detail=f"Erro do Mercado Pago: {result}")

    try:
        qr_code = result["point_of_interaction"]["transaction_data"]["qr_code"]
        qr_img = result["point_of_interaction"]["transaction_data"]["qr_code_base64"]
        payment_id = result["id"]
    except KeyError:
        print("❌ Resposta incompleta do Mercado Pago:", result)
        raise HTTPException(status_code=500, detail="Resposta do Mercado Pago incompleta.")

    return JSONResponse(status_code=200, content={
        "status": "pendente",
        "pixQrCode": qr_code,
        "pixImagem": qr_img,
        "id_transacao": payment_id
    })