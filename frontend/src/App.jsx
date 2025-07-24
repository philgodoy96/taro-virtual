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

const arcanosMaiores = [/* ... mesmo conteúdo ... */];
const naipes = ["Copas", "Ouros", "Espadas", "Paus"];
const faces = ["Ás", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez", "Valete", "Cavaleiro", "Rainha", "Rei"];
const arcanosMenores = naipes.flatMap(naipe => faces.map(face => `${face} de ${naipe}`));
const baralhoCompleto = [...arcanosMaiores, ...arcanosMenores];

const etapas = { /* ... mesmo conteúdo ... */ };

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [pagamento, setPagamento] = useState(false);

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

  useEffect(() => {
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
          setPagamento(snap.data().pagamento);
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
  }, []);

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
}

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
        <p>Olá, {usuario.email}. Para acessar sua leitura, finalize seu pagamento via Pix.</p>
        {/* Aqui futuramente entra o QR Code Pix */}
        <p><i>(Integração com Pix pendente)</i></p>
      </div>
    );
  }

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
        <button onClick={() => {
          if (pergunta) {
            setPerguntaConfirmada(true);
            setPerguntasPorEtapa(prev => ({ ...prev, [etapa]: pergunta }));
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
