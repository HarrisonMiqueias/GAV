import React, { useEffect, useRef,useState } from "react";

export default function ScreenShareModal({ screenVideoRef, onClose, peersRef, localStreamRef }) {
  const startedRef = useRef(false); // impede múltiplas execuções
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (startedRef.current) return; // se já iniciou, não roda de novo
    startedRef.current = true;

    async function startScreenShare() {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          screenVideoRef.current.muted = true;
          await screenVideoRef.current.play().catch(err => console.warn("Erro play:", err));
        }

       

        // envia pros peers
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });


        // quando o usuário parar de compartilhar
        screenTrack.onended = () => {
          console.log("Compartilhamento de tela finalizado.");
          onClose();

          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          Object.values(peersRef.current).forEach(peer => {
            const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
            if (sender && camTrack) sender.replaceTrack(camTrack);
          });

          screenStream.getTracks().forEach(t => t.stop());
        };
      } catch (err) {
        console.error("Erro ao compartilhar tela:", err);
        onClose(); // se cancelar a escolha da tela, fecha o modal
      }
    }

    startScreenShare();
  }, [onClose, peersRef, localStreamRef, screenVideoRef]);

  return (
<div
      style={{
        position: "fixed",
        inset: 0,
        background: minimized ? "transparent" : "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: minimized ? "flex-end" : "center",
        alignItems: minimized ? "flex-end" : "center",
        zIndex: 2000,
        pointerEvents: minimized ? "none" : "auto", // deixa clicável só o vídeo quando minimizado
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
          pointerEvents: "auto", // mantém o vídeo interativo
        }}
      >
        {/* Botão fechar */}
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
          ✕
        </button>

        {/* Botão minimizar */}
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
                  .catch((err) => console.error("Erro ao iniciar vídeo de tela:", err));
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