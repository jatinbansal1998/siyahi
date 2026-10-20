import "./index.css";
import { SiyahiProvider } from "@siyahi/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

// 0.1.6 trial of flat cards: ?cards=flat or ?cards=flat-tiles; see siyahi.css.
const cards = new URLSearchParams(location.search).get("cards");
if (cards) document.documentElement.dataset.siyahiCards = cards;

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root");
createRoot(root).render(
  <StrictMode>
    <SiyahiProvider>
      <App />
    </SiyahiProvider>
  </StrictMode>,
);
