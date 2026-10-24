import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./theme.css";
import "./App.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
