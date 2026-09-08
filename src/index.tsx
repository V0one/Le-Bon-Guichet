import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

import "@codegouvfr/react-dsfr/dsfr/dsfr.main.min.css";
import "@codegouvfr/react-dsfr/dsfr/utility/utility.main.min.css";

startReactDsfr({ defaultColorScheme: "system" });

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
