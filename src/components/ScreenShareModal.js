import React, { useEffect, useRef, useState } from "react";

export default function ScreenShareModal({
screenVideoRef,
onClose,
peersRef,
localStreamRef,
}) {
const startedRef = useRef(false);
const [minimized, setMinimized] = useState(false);

useEffect(() => {
if (startedRef.current) return;
startedRef.current = true;

async function startScreenShare() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.muted = true;
      await screenVideoRef.current.play().catch((err) =>
        console.warn("Erro play:", err)
      );
    }

    // ✅ Envia o track da tela para todos os peers
    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer._pc
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(screenTrack);
      }
    });

    // ✅ Quando o usuário parar o compartilhamento
    screenTrack.onended = () => {
      console.log("Compartilhamento de tela finalizado.");
      onClose();

      setTimeout(() => {
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        Object.values(peersRef.current).forEach((peer) => {
          const sender = peer._pc
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
      }, 300);

      screenStream.getTracks().forEach((t) => t.stop());
    };
  } catch (err) {
    console.error("Erro ao compartilhar tela:", err);
    onClose();
  }
}

startScreenShare();

}, [onClose, peersRef, localStreamRef, screenVideoRef]);

return (
<div
style={{
position: "fixed",
width: "100vw",
height: "100vh",
top: 0,
inset: 0,
background: minimized ? "transparent" : "rgba(0,0,0,0.7)",
display: "flex",
justifyContent: minimized ? "flex-end" : "center",
alignItems: minimized ? "flex-end" : "center",
zIndex: 2000,
pointerEvents: minimized ? "none" : "auto",
}}
>
<div
style={{
position: "relative",
width: minimized ? "300px" : "85%",
height: minimized ? "200px" : "85%",
background: "#000",
borderRadius: 12,
boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
display: "flex",
justifyContent: "center",
alignItems: "center",
margin: minimized ? "10px" : "0",
pointerEvents: "auto",
}}
>
<button
onClick={onClose}
style={{
position: "absolute",
top: 12,
right: 12,
background: "rgba(255,255,255,0.08)",
border: "none",
color: "#fff",
padding: "6px 8px",
borderRadius: 6,
cursor: "pointer",
zIndex: 10,
}}
>
✕ </button>

    <button
      onClick={() => setMinimized(!minimized)}
      style={{
        position: "absolute",
        top: 12,
        right: 48,
        background: "rgba(255,255,255,0.08)",
        border: "none",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: 6,
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      {minimized ? "▢" : "▁"}
    </button>

    <div
      style={{
        flexGrow: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: 12,
      }}
    >
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={() => {
          if (screenVideoRef?.current) {
            screenVideoRef.current
              .play()
              .catch((err) =>
                console.error("Erro ao iniciar vídeo de tela:", err)
              );
          }
        }}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          borderRadius: 8,
          objectFit: "contain",
          backgroundColor: "#00000044",
        }}
      />
    </div>
  </div>
</div>

);
}
