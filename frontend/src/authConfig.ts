import { PublicClientApplication, Configuration, AccountInfo } from "@azure/msal-browser";

// Read from Vite env (configure in frontend/.env or environment when building)

const clientId =  "70c57ebf-c461-4c21-ad98-706fb9b0f05b" as string;
const tenantId = "99a51936-ff2a-4a4f-9029-8273ea890147";
const redirectUri =  window.location.origin;

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

