import React from "react";

export default function RemoteVideos() {
  return (
    <div style={{
      width:"80%",
      height: 340,
      padding: 10,
      border: "1px solid #0000006b",
      borderRadius: 5,
      background: "#f8f1f1da",
      boxShadow: "0 4px 10px rgba(0,0,0,0.78)"
    }}>
      <div style={{
        fontSize: 15,
        color: "#1a0404ff",
        background: "rgba(132, 129, 130, 0.61)",
        borderRadius: 4,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bolder",
        height: 25,
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        padding: 4,
        marginBottom: 5,
        userSelect: "none",
      }}>
        Usuário Online
      </div>
      <div id="remote-videos" style={{width: 100}} />
    </div>
  );
}
