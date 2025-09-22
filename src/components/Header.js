import React from "react";

export default function Header() {
  return (
    <div style={{
      width: "100%",
      height: 50,display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      color: "#1f1f1fff",
      textAlign: "center",
      fontWeight: "bolder",
      fontStyle: "italic",
      background: "rgba(252, 252, 252, 0.92)",
      boxShadow: "0 4px 10px rgba(0,0,0,0.78)",
      borderBottom: "1px solid #0000006b",
      fontFamily: "Arial, sans-serif",
    }}>
      SiCAV
    </div>
  );
}
