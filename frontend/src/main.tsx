import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConfigProvider } from "antd";
import en_US from "antd/locale/en_US";
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./authConfig";
const root = ReactDOM.createRoot(document.getElementById("root")!);

// Ensure MSAL is initialized before rendering anything that uses it
pca
  .initialize()
  .catch(() => {
    // noop: rendering will proceed regardless, but MSAL APIs will be safe post-init
  })
  .finally(() => {
    root.render(
      <MsalProvider instance={pca}>
        <ConfigProvider locale={en_US}>
          <App />
        </ConfigProvider>
      </MsalProvider>,
    );
  });
