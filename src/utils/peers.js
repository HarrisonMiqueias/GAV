import SimplePeer from "simple-peer";

export function createPeer(peerId, initiator, localStreamRef, peersRef, remoteVideosRef, socketRef, setRemoteScreenStream) {
  const peer = new SimplePeer({ initiator, trickle: true });

  // Adiciona as tracks de áudio/vídeo locais
  if (localStreamRef.current) {
    const tracks = localStreamRef.current.getTracks();
    if (tracks.length > 0) {
      tracks.forEach(track => peer.addTrack(track, localStreamRef.current));
    } else {
      // cria uma track vazia de vídeo para permitir replaceTrack depois
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const emptyStream = canvas.captureStream(5);
      const emptyTrack = emptyStream.getVideoTracks()[0];
      peer.addTrack(emptyTrack, emptyStream);
    }
  }

  // Envia sinal de conexão
  peer.on("signal", (data) => socketRef.current.emit("signal", { to: peerId, data }));

  // Recebe stream remota (câmera ou tela)
  peer.on("stream", (remoteStream) => {
    const videoTrack = remoteStream.getVideoTracks()[0];
    const label = videoTrack?.label || "";
    const isScreen = label.includes("Screen") || label.includes("Window");

    // Se for compartilhamento de tela, mostra no modal grande
    if (isScreen && setRemoteScreenStream) {
      console.log("🔵 Recebendo compartilhamento de tela remoto");
      setRemoteScreenStream(remoteStream);
      return;
    }

    // Caso normal: vídeo da câmera
    if (!remoteVideosRef.current[peerId]) {
      const vid = document.createElement("video");
      vid.id = `remote-${peerId}`;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.style.width = "160px";
      vid.style.height = "120px";
      vid.style.borderRadius = "8px";
      vid.style.margin = "4px";
      vid.style.objectFit = "cover";
      document.getElementById("remote-videos")?.appendChild(vid);
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
