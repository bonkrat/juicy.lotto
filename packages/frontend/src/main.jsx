import { DAppProvider } from "@usedapp/core";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { networkConfig } from "./constants";
import Currency from "./containers/Currency";
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={networkConfig}>
      <Currency.Provider>
        <App />
      </Currency.Provider>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
