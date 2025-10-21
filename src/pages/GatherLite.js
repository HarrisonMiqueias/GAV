// src/pages/GatherLite.js
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Row, Col } from "react-bootstrap";
import MapArea from "../components/MapArea";
import LocalVideo from "../components/LocalVideo";
import ScreenShareModal from "../components/ScreenShareModal";
import { createPeer } from "../utils/peers";
import background from "../assets/background.png";
import "../css/GatherLite.css";

export default function GatherLite() {
  // Conexão direta ao servidor Socket.io (string literal)
  const SOCKET_SERVER = "https://api-cav.onrender.com";
  const USER_RADIUS = 60;

  const location = useLocation();
  const navigate = useNavigate();
 const savedName = localStorage.getItem("userName");
 const userNam = location.state?.name || savedName;

  const [me, setMe] = useState({ id: null, x: 700, y: 300, name: userNam || "Convidado" });
  const [users, setUsers] = useState({});
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  const socketRef = useRef(null);
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const mapRef = useRef(null);
  const remoteScreenVideoRef = useRef(null);

  // Redireciona se não houver usuário (mesmo comportamento que antes)
  useEffect(() => {
    if (!userNam) navigate("/", { replace: true });
  }, [userNam, navigate]);

  // Inicializa mídia local (camera/mic). Mantive a lógica de fallback com canvas preto.
  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: false,
        });
        if (!mounted) return;
        localStreamRef.current = stream;
        setVideoEnabled(true);
        setAudioEnabled(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("⚠️ Falha ao acessar câmera, tentando só áudio:", err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });

          // Cria canvas preto para gerar track de vídeo fake
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          const context = canvas.getContext("2d");
          context.fillStyle = "black";
          context.fillRect(0, 0, canvas.width, canvas.height);
          const fakeStream = canvas.captureStream(5);
          const fakeVideoTrack = fakeStream.getVideoTracks()[0];

          audioStream.addTrack(fakeVideoTrack);

          if (!mounted) return;
          localStreamRef.current = audioStream;
          setVideoEnabled(false);
          setAudioEnabled(true);
          if (localVideoRef.current)
            localVideoRef.current.srcObject = new MediaStream([fakeVideoTrack, ...audioStream.getAudioTracks()]);
        } catch (err2) {
          console.error("❌ Nenhum dispositivo de áudio/vídeo disponível:", err2);
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Movimentação e detecção de proximidade (cria/destroi peers)
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        // envia posição atual ao servidor
        socketRef.current.emit("move", { x: me.x, y: me.y });
      }

      Object.entries(users).forEach(([id, u]) => {
        if (id === me.id) return;
        const dx = u.x - me.x;
        const dy = u.y - me.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Se dentro do raio e ainda não tem peer -> cria (iniciador)
        if (dist <= USER_RADIUS && !peersRef.current[id]) {
          createPeer(
            id,
            u.name,
            true,
            localStreamRef,
            peersRef,
            remoteVideosRef,
            socketRef,
            setRemoteScreenStream
          );
        }
        // Se fora do raio e tem peer -> destrói
        else if (dist > USER_RADIUS && peersRef.current[id]) {
          try {
            peersRef.current[id].destroy();
          } catch (e) {
            // ignore
          }
          delete peersRef.current[id];

          // remove vídeo remoto se existir
          try {
            remoteVideosRef.current[id]?.remove();
          } catch (e) {}
          delete remoteVideosRef.current[id];
        }
      });
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, users]); // me e users são dependências necessárias

  // Atualiza vídeo remoto de tela quando o stream muda
  useEffect(() => {
    if (remoteScreenStream && remoteScreenVideoRef.current) {
      remoteScreenVideoRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  // Socket.io: conexão, eventos e limpeza
  useEffect(() => {
    // conecta ao servidor Socket.io
    socketRef.current = io(SOCKET_SERVER, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      const myId = socketRef.current.id;
      setMe((prev) => {
        const newMe = { ...prev, id: myId };
        // emite join com posição inicial e nome
        socketRef.current.emit("join", {
          x: newMe.x,
          y: newMe.y,
          name: newMe.name,
        });
        return newMe;
      });
    });

    // atualiza estado global de usuários
    socketRef.current.on("state", (serverUsers) => {
      setUsers(serverUsers);
    });

    // quando um usuário sai
    socketRef.current.on("user-left", (id) => {
      setUsers((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });

      // cleanup do peer/vídeo
      try {
        peersRef.current[id]?.destroy();
      } catch (e) {}
      delete peersRef.current[id];

      try {
        remoteVideosRef.current[id]?.remove();
      } catch (e) {}
      delete remoteVideosRef.current[id];
    });

    // sinalização WebRTC encaminhada por socket
    socketRef.current.on("signal", ({ from, data }) => {
      // se já existe peer, só sinaliza
      if (peersRef.current[from]) {
        peersRef.current[from].signal(data);
        return;
      }

      // se não existe, cria peer como não-iniciador e aplica sinal
      const remoteName = (users && users[from] && users[from].name) || "Remoto";
      const newPeer = createPeer(
        from,
        remoteName,
        false,
        localStreamRef,
        peersRef,
        remoteVideosRef,
        socketRef,
        setRemoteScreenStream
      );

      // store nova referência caso createPeer não faça isso internamente
      if (newPeer) peersRef.current[from] = newPeer;
      try {
        // se newPeer ainda não foi retornado sincronamente, createPeer internamente pode já ter colocado peersRef
        peersRef.current[from]?.signal(data);
      } catch (e) {
        console.warn("Erro ao aplicar signal no peer recém-criado:", e);
      }
    });

    return () => {
      // desconecte socket
      try {
        socketRef.current?.disconnect();
      } catch (e) {}
      // limpe peers
      Object.keys(peersRef.current).forEach((k) => {
        try {
          peersRef.current[k].destroy();
        } catch (e) {}
      });
      peersRef.current = {};
      // pare mídia local
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // roda apenas uma vez

  return (
    <div className="container">
      <Row className="row-principal">
        <Col className="col-principal">
          <Row className="row-primario">
            <Col className="col-primario">
              <MapArea
                mapRef={mapRef}
                users={users}
                me={me}
                setMe={setMe}
                USER_RADIUS={USER_RADIUS}
                background={background}
                audio={audioEnabled}
                remoteVideosRef={remoteVideosRef}
                audioEnabled={audioEnabled}
              />
            </Col>
          </Row>
          <Row className="row-secundario">
            <Col className="col-secundario">
              <LocalVideo
                localVideoRef={localVideoRef}
                videoEnabled={videoEnabled}
                audioEnabled={audioEnabled}
                setVideoEnabled={setVideoEnabled}
                setAudioEnabled={setAudioEnabled}
                peersRef={peersRef}
                localStreamRef={localStreamRef}
                screenVideoRef={screenVideoRef}
                setIsScreenModalOpen={setIsScreenModalOpen}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Modal da tela compartilhada */}
      {isScreenModalOpen && (
        <ScreenShareModal
          screenVideoRef={screenVideoRef}
          onClose={() => setIsScreenModalOpen(false)}
          peersRef={peersRef}
          localStreamRef={localStreamRef}
        />
      )}
    </div>
  );
}
