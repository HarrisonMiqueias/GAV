import React from "react";

export default function ScreenShareModal({ screenVideoRef, onClose }) {
  // Não precisamos do isOpen aqui porque você já faz a renderização condicional fora.
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "85%",
          height: "85%",
          background: "#000",
          borderRadius: 12,
          boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Botão fechar no canto superior direito */}
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

        {/* Área central do vídeo (o bloco que você pediu como modal) */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
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
              // React usa onLoadedMetadata (camelCase)
              if (screenVideoRef?.current) {
                screenVideoRef.current
                  .play()
                  .catch(err => console.error("Erro ao iniciar vídeo de tela:", err));
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
