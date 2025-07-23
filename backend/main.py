from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from langchain_community.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConsultaRequest(BaseModel):
    pergunta: str
    cartas: List[str]
    tarologo: str
    etapa: str

# Tarólogos com personalidades distintas
tarologos = {
    "clara": {
        "nome": "Clara",
        "prompt": "Você é Clara, uma taróloga sensível, acolhedora e gentil. Suas palavras são como abraço: confortam, iluminam e guiam com empatia. Mesmo diante de presságios difíceis, você oferece esperança e caminhos de cura."
    },
    "jaime": {
        "nome": "Jaime",
        "prompt": "Você é Jaime, um tarólogo místico e filosófico. Suas interpretações são profundas, arquétipicas e simbólicas. Você fala como alguém que contempla a alma e o cosmos, buscando o sentido oculto por trás das cartas."
    },
    "felipe": {
        "nome": "Felipe",
        "prompt": "Você é Felipe, um tarólogo debochado e espirituoso. Você interpreta as cartas com sarcasmo inteligente, humor irônico e frases afiadas — mas sempre entrega uma verdade desconcertante no meio da piada."
    }
}

# Significados simbólicos de cada etapa
etapa_nomes = {
    "cruz_celta": "Cruz Celta – leitura completa da jornada do consulente: forças internas, externas, desafios e propósito",
    "etapa9": "Leitura de 9 cartas – análise simbólica do estado físico, mental e espiritual do consulente em 3 níveis",
    "etapa7": "Leitura de 7 cartas – caminho espiritual e emocional, revelando os próximos passos de crescimento",
    "etapa5": "Leitura de 5 cartas – análise de uma situação específica com foco em escolhas e consequências",
    "etapa3": "Leitura final de 3 cartas – visão do passado, presente e futuro como encerramento da jornada"
}

# Configuração do modelo
llm = OpenAI(
    model="gpt-3.5-turbo-instruct",
    temperature=0.85,
    max_tokens=1200,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

@app.post("/consultar-taro")
async def consultar_taro(data: ConsultaRequest):
    estilo = tarologos.get(data.tarologo, tarologos["clara"])
    descricao_etapa = etapa_nomes.get(data.etapa, "Leitura adicional sem nome")

    prompt = PromptTemplate(
    input_variables=["pergunta", "cartas"],
    template=f"""{estilo['prompt']}

Etapa da leitura: {descricao_etapa}
Pergunta do consulente: "{{pergunta}}"
Cartas sorteadas: {{cartas}}

INSTRUÇÕES:
Você está conduzindo uma sessão de tarô profunda, intuitiva e simbólica. NÃO descreva as cartas individualmente, nem siga uma ordem de interpretação rígida. Em vez disso, una os significados em uma narrativa fluida, como se estivesse contando uma história ou conduzindo um ritual verbal.

Use transições suaves e imagens simbólicas. Traga uma interpretação coesa e integrada que pareça uma jornada emocional e espiritual. Use a pergunta e o papel desta etapa como guias.

Se for uma etapa final, traga fechamento. Se for uma etapa intermediária, traga provocação ou direção. Sempre finalize com uma reflexão ou conselho inspirado, como se estivesse olhando nos olhos do consulente.

Evite repetições. Evite “por outro lado…” seguidos. Evite simplesmente listar presságios bons e ruins.

Sua resposta deve soar como um texto contínuo e inspirado.
"""
)

    chain = LLMChain(llm=llm, prompt=prompt)
    resposta = chain.run(pergunta=data.pergunta, cartas=", ".join(data.cartas))

    return {"mensagem": resposta.strip()}