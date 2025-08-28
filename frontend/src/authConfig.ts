import { PublicClientApplication, Configuration, AccountInfo } from "@azure/msal-browser";

// Read from Vite env (configure in frontend/.env or environment when building)
const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID as string;
const tenantId = (import.meta.env.VITE_AZURE_AD_TENANT_ID as string) || "common";
const redirectUri = (import.meta.env.VITE_AUTH_REDIRECT_URI as string) || window.location.origin;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const pca = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

export function getActiveAccount(): AccountInfo | null {
  return pca.getActiveAccount() || pca.getAllAccounts()[0] || null;
}

