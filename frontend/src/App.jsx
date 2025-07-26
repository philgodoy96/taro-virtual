import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const arcanosMaiores = ["O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador", "O Hierofante", "Os Enamorados", "O Carro", "A Força", "O Eremita", "A Roda da Fortuna", "A Justiça", "O Enforcado", "A Morte", "A Temperança", "O Diabo", "A Torre", "A Estrela", "A Lua", "O Sol", "O Julgamento", "O Mundo"];
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
  const [usuario, setUsuario] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [pagamento, setPagamento] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [tarologo, setTarologo] = useState(null);
  const [etapa, setEtapa] = useState("cruz_celta");
  const [cartas, setCartas] = useState([]);
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [perguntaConfirmada, setPerguntaConfirmada] = useState(false);
  const [perguntasPorEtapa, setPerguntasPorEtapa] = useState({});

  /*useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.emailVerified) {
        alert("Por favor, verifique seu e-mail antes de continuar.");
        await signOut(auth);
        return;
      }

      setUsuario(user);
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const dados = snap.data();
        //setPagamento(dados.pagamento);
        setPagamento(true); // ⚠️ força o pagamento como feito

        if (dados.pagamento) {
          const consultaRef = doc(db, "consultas", user.uid);
          const consultaSnap = await getDoc(consultaRef);
          if (consultaSnap.exists()) {
            const leitura = consultaSnap.data();
            setEtapa(leitura.etapa || "cruz_celta");
            setCartas(leitura.cartas || []);
            setPerguntasPorEtapa(leitura.perguntasPorEtapa || {});
            setTarologo(leitura.tarologo || null);
          }
        }
      } else {
        await setDoc(ref, { email: user.email, pagamento: false });
        setPagamento(false);
      }
    } else {
      setUsuario(null);
      setPagamento(false);
    }
  });
  return () => unsubscribe();
}, []);*/

useEffect(() => {
    // Wake up backend Render (warm-up)
    fetch("https://taro-backend-2k9m.onrender.com/")
  }, []);

  useEffect(() => {
    setUsuario({ email: "teste@local.com", uid: "teste123" });
    setPagamento(true);
    setTarologo(null);
  }, []);

useEffect(() => {
  if (!pixData) return;

  const intervalo = setInterval(async () => {
    try {
      const res = await fetch(`https://taro-backend-2k9m.onrender.com/verificar-pagamento/${pixData.id}`);
      const data = await res.json();
      if (data.status === "pago") {
        setPagamento(true);
        const ref = doc(db, "usuarios", usuario.uid);
        await setDoc(ref, { pagamento: true }, { merge: true });
        clearInterval(intervalo);
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err);
    }
  }, 4000);

  return () => clearInterval(intervalo);
}, [pixData, usuario]);

  const handleLogin = async () => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    if (!cred.user.emailVerified) {
      alert("Por favor, verifique seu e-mail antes de continuar.");
      await signOut(auth);
    }
  } catch (err) {
    alert("Erro no login: " + err.message);
  }
};

const handleCadastro = async () => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await sendEmailVerification(cred.user);
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      email: cred.user.email,
      pagamento: false,
    });
    alert("Cadastro realizado. Verifique seu e-mail antes de fazer login.");
    setIsLogin(true);
  } catch (err) {
    alert("Erro no cadastro: " + err.message);
  }
};

const handleRecuperarSenha = async () => {
  if (!email) {
    alert("Digite seu e-mail para redefinir a senha.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Um link de redefinição foi enviado para seu e-mail.");
  } catch (err) {
    alert("Erro ao enviar e-mail de redefinição: " + err.message);
  }
};

  const etapaAtual = etapas[etapa];
  const embaralhar = () => [...baralhoCompleto].sort(() => 0.5 - Math.random());

  const gerarPagamento = async () => {
  try {
    const response = await fetch("https://taro-backend-2k9m.onrender.com/criar-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: usuario.email, valor: 15 })
    });
    const data = await response.json();
    console.log(setPixData(data));
  } catch (err) {
    alert("Erro ao gerar cobrança Pix");
  }
};


  const puxarCarta = async () => {
  if (cartas.length >= etapaAtual.cartas) return;
  const deck = embaralhar().filter(c => !cartas.includes(c));
  const novaCarta = deck[0];
  const novasCartas = [...cartas, novaCarta];
  setCartas(novasCartas);

  await setDoc(doc(db, "consultas", usuario.uid), {
    etapa,
    cartas: novasCartas,
    perguntasPorEtapa,
    tarologo,
    timestamp: new Date()
  });
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

  const avancarEtapa = async () => {
  const proxima = etapaAtual.proxima;
  if (proxima) {
    setEtapa(proxima);
    setCartas([]);
    setResposta("");
    setPergunta("");
    setPerguntaConfirmada(false);

    await setDoc(doc(db, "consultas", usuario.uid), {
      etapa: proxima,
      cartas: [],
      perguntasPorEtapa,
      tarologo,
      timestamp: new Date()
    });
  } else {
    alert("Sessão finalizada. Que os caminhos estejam abertos para você.");
    setEtapa(null);
    await setDoc(doc(db, "consultas", usuario.uid), {}); // zera
  }
};


  if (!usuario) {
    return (
      <div className="container">
        <h1>Tarô Virtual</h1>
        <h2>{isLogin ? "Login" : "Cadastro"}</h2>
        <div className="login-form">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} />
          <button onClick={isLogin ? handleLogin : handleCadastro}>
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </div>
        <div className="login-toggle">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Cadastre-se" : " Faça login"}
          </button>
        </div>
      </div>
    );
  }

  if (!pagamento) {
    return (
      <div className="container">
        <h1>Tarô Virtual</h1>
        <p>Olá, {usuario?.email}. Para acessar sua leitura, realize o pagamento via Pix:</p>
        {!pixData ? (
          <button onClick={gerarPagamento}>Gerar cobrança Pix</button>
        ) : (
          <div className="pix-area">
            <img
              src={`data:image/png;base64,${pixData.pixImagem}`}
              alt="QR Code Pix"
              style={{ maxWidth: 250, marginBottom: 12 }}
            />
            <textarea
              readOnly
              value={pixData.pixQrCode}
              rows={3}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <button onClick={() => navigator.clipboard.writeText(pixData.pixQrCode)}>
              Copiar código Pix
            </button>
            <p style={{ marginTop: 12 }}><i>Aguardando confirmação do pagamento...</i></p>
          </div>
        )}
      </div>
    );
  }

  if (!tarologo) {
  
    //<button onClick={() => setTarologo("clara")}>🔮 Maria Mercedes</button>
    
    return (
      <div className="container">
        <h1>Tarô Virtual</h1>
        <p>Escolha seu tarólogo:</p>
        <div className="tarologo-selector">
          <button onClick={() => setTarologo("jaime")}>🌌 Jaime E. Cannes</button>
          
          <button onClick={() => setTarologo("felipe")}>🔮 Felipe E. Cannes</button>
        </div>
      </div>
    );
  }

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
        <button onClick={async () => {
        if (pergunta) {
          const novaPergunta = { ...perguntasPorEtapa, [etapa]: pergunta };
          setPerguntaConfirmada(true);
          setPerguntasPorEtapa(novaPergunta);

          await setDoc(doc(db, "consultas", usuario.uid), {
            etapa,
            cartas,
            perguntasPorEtapa: novaPergunta,
            tarologo,
            timestamp: new Date()
          });
        }
      }}>
          Iniciar leitura
        </button>
      </div>
    );
  }

  if (!etapaAtual) {
    return (
      <div className="container">
        <h2>Sessão Encerrada</h2>
        <p>Esperamos que as cartas tenham trazido sabedoria à sua jornada.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="etapa-header">
        <h2>{etapaAtual.titulo}</h2>
        <p>Cartas selecionadas: {cartas.length} / {etapaAtual.cartas}</p>
      </div>

      {cartas.length < etapaAtual.cartas && (
        <div className="deck" onClick={puxarCarta}>
          <div className="card-back">🔮</div>
          <p>Clique para puxar uma carta</p>
        </div>
      )}

      <div className="spread">
        {[...cartas].reverse().map((carta, idx) => (
        <div key={idx} className="revealed-card">
          <img
            src={`/cartas/${carta}.jpg`}
            alt={carta}
            style={{ width: "100px", height: "auto", marginBottom: "0.5rem" }}
          />
          <div>{carta}</div>
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