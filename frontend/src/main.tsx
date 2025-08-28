import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConfigProvider } from "antd";
import en_US from "antd/locale/en_US";
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./authConfig";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MsalProvider instance={pca}>
    <ConfigProvider locale={en_US}>
      <App />
    </ConfigProvider>
  </MsalProvider>,
);
