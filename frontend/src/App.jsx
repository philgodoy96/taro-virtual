import React, { useState } from "react";

const arcanosMaiores = [
  "O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador",
  "O Hierofante", "Os Enamorados", "O Carro", "A Força", "O Eremita",
  "A Roda da Fortuna", "A Justiça", "O Enforcado", "A Morte", "A Temperança",
  "O Diabo", "A Torre", "A Estrela", "A Lua", "O Sol", "O Julgamento", "O Mundo"
];
const naipes = ["Copas", "Ouros", "Espadas", "Paus"];
const faces = ["Ás", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez", "Valete", "Cavaleiro", "Rainha", "Rei"];
const arcanosMenores = naipes.flatMap(naipe => faces.map(face => `${face} de ${naipe}`));
const baralhoCompleto = [...arcanosMaiores, ...arcanosMenores];

const etapas = {
  cruz_celta: { titulo: "Cruz Celta", cartas: 11, proxima: "etapa9" },
  etapa9: { titulo: "Leitura de 9 cartas", cartas: 9, proxima: "etapa7" },
  etapa7: { titulo: "Leitura de 7 cartas", cartas: 7, proxima: "etapa5" },
  etapa5: { titulo: "Leitura de 5 cartas", cartas: 5, proxima: "etapa3" },
  etapa3: { titulo: "Leitura Final de 3 cartas", cartas: 3, proxima: null }
};

export default function App() {
  const [tarologo, setTarologo] = useState(null);
  const [etapa, setEtapa] = useState("cruz_celta");
  const [cartas, setCartas] = useState([]);
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [perguntaConfirmada, setPerguntaConfirmada] = useState(false);
  const [perguntasPorEtapa, setPerguntasPorEtapa] = useState({});

  const etapaAtual = etapas[etapa];

  const embaralhar = () => [...baralhoCompleto].sort(() => 0.5 - Math.random());

  const puxarCarta = () => {
    if (cartas.length >= etapaAtual.cartas) return;
    const deck = embaralhar().filter(c => !cartas.includes(c));
    setCartas([...cartas, deck[0]]);
  };

  const consultarTarologo = async () => {
    setCarregando(true);
    try {
      const response = await fetch("https://taro-backend-2k9m.onrender.com/consultar-taro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta: perguntasPorEtapa[etapa],
          cartas,
          etapa,
          tarologo
        })
      });
      const data = await response.json();
      setResposta(data.mensagem);
    } catch (error) {
      setResposta("Erro ao consultar o tarólogo.");
    } finally {
      setCarregando(false);
    }
  };

  const avancarEtapa = () => {
    const proxima = etapaAtual.proxima;
    if (proxima) {
      setEtapa(proxima);
      setCartas([]);
      setResposta("");
      setPergunta("");
      setPerguntaConfirmada(false);
    } else {
      alert("Sessão finalizada. Que os caminhos estejam abertos para você.");
      setEtapa(null);
    }
  };

  // Etapa 0: escolha do tarólogo
  if (!tarologo) {
    return (
      <div className="container">
        <h1>Tarô Virtual</h1>
        <p>Escolha seu tarólogo:</p>
        <div className="tarologo-selector">
          <button onClick={() => setTarologo("jaime")}>🌌 Jaime E. Cannes</button>
          <button onClick={() => setTarologo("clara")}>🔮 Maria Mercedes</button>
          <button onClick={() => setTarologo("felipe")}>😏 Felipe Godoy</button>
        </div>
      </div>
    );
  }

  // Etapa de pergunta por etapa
  if (!perguntaConfirmada) {
    return (
      <div className="container">
        <h2>{tarologo.toUpperCase()}</h2>
        <h3>{etapaAtual?.titulo || "Início"}</h3>
        <p>Faça sua pergunta para esta etapa:</p>
        <textarea
          className="pergunta-textarea"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Digite sua pergunta com contexto..."
          rows={5}
        />
        <button
          onClick={() => {
            if (pergunta) {
              setPerguntaConfirmada(true);
              setPerguntasPorEtapa(prev => ({ ...prev, [etapa]: pergunta }));
            }
          }}
        >
          Iniciar leitura
        </button>
      </div>
    );
  }

  // Etapa finalizada
  if (!etapaAtual) {
    return (
      <div className="container">
        <h2>Sessão Encerrada</h2>
        <p>Esperamos que as cartas tenham trazido sabedoria à sua jornada.</p>
      </div>
    );
  }

  // Etapas de leitura
  return (
    <div className="container">
      <h2>{etapaAtual.titulo}</h2>
      <p>Cartas selecionadas: {cartas.length} / {etapaAtual.cartas}</p>

      {cartas.length < etapaAtual.cartas && (
        <div className="deck" onClick={puxarCarta}>
          <div className="card-back">🔮</div>
          <p>Clique para puxar uma carta</p>
        </div>
      )}

      <div className="spread">
        {cartas.map((carta, idx) => (
          <div key={idx} className="revealed-card">
            <strong>{idx + 1}.</strong> {carta}
          </div>
        ))}
      </div>

      {cartas.length === etapaAtual.cartas && !resposta && (
        <button className="interpretar-btn" onClick={consultarTarologo} disabled={carregando}>
          {carregando ? "Consultando..." : "Interpretar Leitura"}
        </button>
      )}

      {resposta && (
        <div className="resposta">
          <h3>Interpretação:</h3>
          <p>{resposta}</p>
          <button onClick={avancarEtapa}>
            {etapaAtual.proxima ? "Continuar para próxima etapa" : "Finalizar sessão"}
          </button>
        </div>
      )}
    </div>
  );
}