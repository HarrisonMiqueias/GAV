import SimplePeer from "simple-peer";

export function createPeer(
peerId,
userName,
initiator,
localStreamRef,
peersRef,
remoteVideosRef,
socketRef,
setRemoteScreenStream
) {
const peer = new SimplePeer({ initiator, trickle: true });

// ✅ Adiciona as tracks de áudio/vídeo locais
if (localStreamRef.current) {
const tracks = localStreamRef.current.getTracks();


// ✅ Se estiver compartilhando tela, adiciona também o track da tela
const screenTrack = Array.from(localStreamRef.current.getTracks()).find(
  (t) => t.label.includes("Screen") || t.label.includes("Window")
);
if (screenTrack) {
  peer.addTrack(screenTrack, localStreamRef.current);
} else if (tracks.length > 0) {
  tracks.forEach((track) => peer.addTrack(track, localStreamRef.current));
} else {
  // cria uma track vazia para permitir replaceTrack depois
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const emptyStream = canvas.captureStream(5);
  const emptyTrack = emptyStream.getVideoTracks()[0];
  peer.addTrack(emptyTrack, emptyStream);
}

}

// Envia sinal de conexão
peer.on("signal", (data) =>
socketRef.current.emit("signal", { to: peerId, data })
);

// Recebe stream remota (câmera ou tela)
peer.on("stream", (remoteStream) => {
const videoTrack = remoteStream.getVideoTracks()[0];
const label = videoTrack?.label || "";
const isScreen = label.includes("Screen") || label.includes("Window");

// ✅ Se for compartilhamento de tela, mostra no modal remoto
if (isScreen && setRemoteScreenStream) {
  console.log("🔵 Recebendo compartilhamento de tela remoto");
  setRemoteScreenStream(remoteStream);
  return;
}

// Caso normal: vídeo da câmera
if (!remoteVideosRef.current[peerId]) {
  /*const vid = document.createElement("video");
  vid.id = `remote-${peerId}`;
  vid.autoplay = true;
  vid.playsInline = true;
  vid.style.width = "160px";
  vid.style.height = "120px";
  vid.style.borderRadius = "8px";
  vid.style.margin = "4px";
  vid.style.objectFit = "cover";
  vid.style.resize = "both";
  document.getElementById("remote-videos")?.appendChild(vid);
  remoteVideosRef.current[peerId] = vid;*/
 const container = document.createElement("div");
container.style.position = "relative";
container.style.display = "inline-block";
container.style.margin = "4px";

const vid = document.createElement("video");
vid.id = `remote-${peerId}`;
vid.autoplay = true;
vid.playsInline = true;
vid.style.width = "160px";
vid.style.height = "120px";
vid.style.borderRadius = "8px";
vid.style.objectFit = "cover";
vid.style.backgroundColor = "#000";
vid.style.resize = "both";

// ✅ Nome ou identificador do usuário
  const nameTag = document.createElement("div");
  nameTag.innerText = userName;//👉 troque por userName se tiver disponível
  nameTag.style.position = "absolute";
  nameTag.style.bottom = "4px";
  nameTag.style.left = "6px";
  nameTag.style.padding = "2px 6px";
  nameTag.style.background = "rgba(0, 0, 0, 0.5)";
  nameTag.style.color = "#fff";
  nameTag.style.fontSize = "12px";
  nameTag.style.borderRadius = "4px";
  nameTag.style.pointerEvents = "none";
  nameTag.style.zIndex = "9";

// ✅ Botão de expandir
const expandBtn = document.createElement("button");
expandBtn.innerText = "⛶"; // símbolo de tela cheia
expandBtn.title = "Expandir vídeo";
expandBtn.style.position = "absolute";
expandBtn.style.bottom = "4px";
expandBtn.style.right = "4px";
expandBtn.style.background = "rgba(0,0,0,0.6)";
expandBtn.style.color = "white";
expandBtn.style.border = "none";
expandBtn.style.borderRadius = "4px";
expandBtn.style.padding = "2px 6px";
expandBtn.style.cursor = "pointer";
expandBtn.style.fontSize = "14px";
expandBtn.style.zIndex = "10";


// ✅ Ao clicar, entra em modo fullscreen ou sai
expandBtn.onclick = () => {
if (!document.fullscreenElement) {
vid.requestFullscreen?.().catch((err) =>
console.error("Erro ao expandir vídeo:", err)
);
} else {
document.exitFullscreen?.();
}
};

container.appendChild(vid);
container.appendChild(expandBtn);
container.appendChild(nameTag); // ✅ adiciona o nome

document.getElementById("remote-videos")?.appendChild(container);
remoteVideosRef.current[peerId] = vid;

  
}

  remoteVideosRef.current[peerId].srcObject = remoteStream;
});

// Quando o peer fecha
peer.on("close", () => {
remoteVideosRef.current[peerId]?.remove();
delete remoteVideosRef.current[peerId];
peer.destroy();
delete peersRef.current[peerId];
});

peersRef.current[peerId] = peer;
return peer;
}
