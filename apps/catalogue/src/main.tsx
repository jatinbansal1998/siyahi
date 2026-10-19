import "./index.css";
import { SiyahiProvider } from "@siyahi/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root");
createRoot(root).render(
  <StrictMode>
    <SiyahiProvider>
      <App />
    </SiyahiProvider>
  </StrictMode>,
);
