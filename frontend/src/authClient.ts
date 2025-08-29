import { pca, loginRequest } from "./authConfig";
import type { AuthenticationResult } from "@azure/msal-browser";

async function ensureMsalReady() {
  try {
    await pca.initialize();
    const result = await pca.handleRedirectPromise();
    if (result?.account) {
      pca.setActiveAccount(result.account);
    } else if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
      pca.setActiveAccount(pca.getAllAccounts()[0]);
    }
  } catch (e) {
    // swallow
  }
}

export async function login(): Promise<void> {
  await ensureMsalReady();
  try {
    await pca.loginRedirect(loginRequest);
  } catch (e: any) {
    const msg = (e?.errorCode || e?.message || "").toString();
    if (msg.includes("interaction_in_progress")) {
      // Let the current interaction finish; user can retry
      return;
    }
    throw e;
  }
}

export async function logout(): Promise<void> {
  await ensureMsalReady();
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0] || undefined;
  await pca.logoutRedirect({ account });
}

// Acquire token; we use idToken here for backend validation with audience = clientId
export async function getBearerToken(): Promise<string | null> {
  await ensureMsalReady();
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0] || null;
  if (!account) return null;
  try {
    const result: AuthenticationResult = await pca.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    // Always use ID token for backend auth (aud = SPA client id)
    return result.idToken || null;
  } catch (e) {
    // If silent fails (e.g., interaction required), try interactive login
    try {
      await pca.acquireTokenRedirect(loginRequest);
    } catch (err: any) {
      const msg = (err?.errorCode || err?.message || "").toString();
      if (msg.includes("interaction_in_progress")) return null;
      throw err;
    }
    return null;
  }
}
