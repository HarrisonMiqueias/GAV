import React from "react";
import { CameraVideo, CameraVideoOff, Mic, MicMute, Display } from "react-bootstrap-icons";

export default function LocalVideo({
  localVideoRef,
  videoEnabled,
  audioEnabled,
  setVideoEnabled,
  setAudioEnabled,
  peersRef,
  localStreamRef,
  screenVideoRef,
  setIsScreenModalOpen,
}) {

  async function enableVideo() {
    if (!localStreamRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        localStreamRef.current.addTrack(videoTrack);
        setVideoEnabled(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

        Object.values(peersRef.current)
        .forEach(peer => {
          const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
          else peer._pc.addTrack(videoTrack, localStreamRef.current);
        });
      }
    } catch (err) {
      console.error("Erro ao ativar vídeo:", err);
    }
  }

  function disableVideo() {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getTracks().find(t => t.kind === "video");
    if (videoTrack) {
      videoTrack.stop();
      localStreamRef.current.removeTrack(videoTrack);
      setVideoEnabled(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream(localStreamRef.current.getTracks());
      }

      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) peer._pc.removeTrack(sender);
      });
    }
  }

  function toggleAudio() {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  }

async function startScreenShare() {
  try {
    // Recomendo começar sem audio para evitar bloqueios: mude para true só se precisar
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    if (!screenStream) throw new Error("Nenhum stream retornado por getDisplayMedia");

    const screenTrack = screenStream.getVideoTracks()[0];
    console.log("screenStream tracks:", screenStream.getTracks(), "screenTrack:", screenTrack);

    // atribui ao vídeo do modal e tenta tocar
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = screenStream;
      localVideoRef.current.muted = true;
      await localVideoRef.current.play().catch(err => console.warn(err)); 
    }

    //setIsScreenModalOpen(true);

    // envia pra peers (substitui track ou adiciona)
    Object.values(peersRef.current).forEach(peer => {
      try {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender && screenTrack) {
          sender.replaceTrack(screenTrack);
        } else if (screenTrack) {
          peer._pc.addTrack(screenTrack, screenStream);
        }
      } catch (err) {
        console.warn("Erro ao atualizar peer com track de tela:", err);
      }
    });

    // quando usuário parar de compartilhar
    screenTrack.onended = () => {
      console.log("Compartilhamento de tela finalizado pelo usuário.");
      setIsScreenModalOpen(false);

      // tenta restaurar a câmera, se existir
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        try {
          const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
          if (sender && camTrack) sender.replaceTrack(camTrack);
          else if (camTrack) peer._pc.addTrack(camTrack, localStreamRef.current);
        } catch (err) {
          console.warn("Erro ao restaurar track da câmera:", err);
        }
      });

      // garante que a screenStream pare todos os tracks
      screenStream.getTracks().forEach(t => {
        try { t.stop(); } catch(e) {}
      });
    };
  } catch (err) {
    console.error("Erro ao compartilhar tela:", err);
  }
}




  return (
    <div style={{
      width:"80%",
      height: 200,
      padding: 10,
      border: "1px solid #0000006b",
      borderRadius: 5,
      background: "#f8f1f1da",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
      flexDirection: "column",
      fontWeight: "bolder",
      fontStyle: "italic",
      overflow: "hidden",
      display:"flex",
      gap:10,
      justifyContent: "center",
      alignItems:"center",
    }}>
      <div alignItems="center">
        <video 
        ref={localVideoRef}
        muted
        autoPlay
        playsInline
        style={{
          width: 200,
          height: 150,
          borderRadius: 10,
          background: "#0000006b",
          objectFit: "cover"
        }}
      />
      </div>

      <div style={{ display:"flex",gap: 10, justifyContent: "start" }}>
        <button
          onClick={videoEnabled ? disableVideo : enableVideo}
          style={{
            padding: "6px 12px",
            backgroundColor: videoEnabled ? "#22c55e" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          {videoEnabled ? <CameraVideo size={18} /> : <CameraVideoOff size={18} />}
        </button>

        <button
          onClick={toggleAudio}
          style={{
            padding: "6px 12px",
            backgroundColor: audioEnabled ? "#22c55e" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          {audioEnabled ? <Mic size={18} /> : <MicMute size={18} />}
        </button>

        <button
           onClick={() => setIsScreenModalOpen(true)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          <Display size={18} />
        </button>
      </div>
    </div>
  );
}
