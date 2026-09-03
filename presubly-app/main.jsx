import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import AuthGate from "./AuthGate.jsx";
import Presubly from "./Presubly.jsx";
import { LangProvider } from "./lang.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <AuthGate>
        <Presubly />
      </AuthGate>
    </LangProvider>
  </React.StrictMode>
);
