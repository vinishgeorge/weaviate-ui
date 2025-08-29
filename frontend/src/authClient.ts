import { pca, loginRequest } from "./authConfig";
import type { AuthenticationResult } from "@azure/msal-browser";

export async function login(): Promise<void> {
  await pca.loginRedirect(loginRequest);
}

export async function logout(): Promise<void> {
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0] || undefined;
  await pca.logoutRedirect({ account });
}

// Acquire token; we use idToken here for backend validation with audience = clientId
export async function getBearerToken(): Promise<string | null> {
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
    await pca.acquireTokenRedirect(loginRequest);
    return null;
  }
}
