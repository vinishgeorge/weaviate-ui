import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConfigProvider } from "antd";
import en_US from "antd/locale/en_US";
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./authConfig";
const root = ReactDOM.createRoot(document.getElementById("root")!);

// Ensure MSAL is initialized and any pending redirects are handled
async function bootstrap() {
  try {
    await pca.initialize();
    const result = await pca.handleRedirectPromise();
    if (result && result.account) {
      pca.setActiveAccount(result.account);
    } else if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
      pca.setActiveAccount(pca.getAllAccounts()[0]);
    }
  } catch (e) {
    // ignore
  }
  root.render(
    <MsalProvider instance={pca}>
      <ConfigProvider locale={en_US}>
        <App />
      </ConfigProvider>
    </MsalProvider>,
  );
}

bootstrap();
