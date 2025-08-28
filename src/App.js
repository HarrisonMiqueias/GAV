// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateUser from "./CreateUser";
import GatherLite from "./GatherLite";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateUser />} />
        <Route path="/gather" element={<GatherLite />} />
      </Routes>
    </Router>
  );
}

export default App;
