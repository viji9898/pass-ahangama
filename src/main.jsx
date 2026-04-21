import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Comp from "./Comp.jsx";
import Promo from "./Promo.jsx";
import PromoVerify from "./PromoVerify.jsx";
import Success from "./Success.jsx";
import Verify from "./Verify.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/comp" element={<Comp />} />
        <Route path="/promo" element={<Promo />} />
        <Route path="/pv" element={<PromoVerify />} />
        <Route path="/success" element={<Success />} />
        <Route path="/v" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
