import React from "react";

export default function ScreenShareModal({ screenVideoRef, stopScreenShare }) {
  return (
    <div style={{
      position: "fixed",
      top: 50,
      left: 50,
      width: "80%",
      height: "80%",
      background: "#fff",
      borderRadius: 10,
      zIndex: 9999,
      boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      border: "2px solid #000"
    }}>
      <div style={{
        padding: "3px 10px",
        background: "#588adbff",
        color: "#fff",
        fontWeight: "bold",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        Compartilhando Tela
        <button onClick={stopScreenShare} style={{
          background: "red",
          border: "none",
          color: "#fff",
          borderRadius: 4,
          padding: "2px 8px",
          cursor: "pointer"
        }}>X</button>
      </div>
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          borderBottomRightRadius: 10,
          borderBottomLeftRadius: 10
        }}
      />
    </div>
  );
}
