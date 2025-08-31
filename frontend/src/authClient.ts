import { pca, loginRequest } from "./authConfig";
import type { AuthenticationResult } from "@azure/msal-browser";

async function ensureMsalReady() {
  console.log("🔧 Ensuring MSAL is ready...");
  try {
    await pca.initialize();
    console.log("✅ MSAL initialized");
    
    const result = await pca.handleRedirectPromise();
    console.log("🔄 Redirect promise result:", result ? "has result" : "no result");
    
    if (result?.account) {
      pca.setActiveAccount(result.account);
      console.log("👤 Set active account from redirect:", result.account.username);
    } else if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
      pca.setActiveAccount(pca.getAllAccounts()[0]);
      console.log("👤 Set active account from existing accounts:", pca.getAllAccounts()[0].username);
    } else {
      console.log("👤 No account to set as active");
    }
  } catch (e) {
    console.error("❌ Error in ensureMsalReady:", e);
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
  console.log("🚪 Logout initiated");
  
  try {
    await ensureMsalReady();
    console.log("✅ MSAL ready for logout");
    
    // Get current MSAL state info
    const activeAccount = pca.getActiveAccount();
    const allAccounts = pca.getAllAccounts();
    console.log("👤 Active account:", activeAccount?.username || "none");
    console.log("📊 Total accounts:", allAccounts.length);
    
    // Check if MSAL thinks there's an interaction in progress
    // Note: This is internal MSAL state, we'll try to access it safely
    try {
      const msalState = (pca as any).browserStorage?.getInteractionInProgress();
      console.log("🔄 MSAL interaction in progress:", msalState);
    } catch (stateError) {
      console.log("⚠️ Could not check MSAL interaction state:", stateError);
    }
    
    const account = activeAccount || allAccounts[0] || undefined;
    console.log("🎯 Account selected for logout:", account?.username || "none");
    
    // Try to clear any pending interactions first
    try {
      // Force clear interaction status - this is a workaround
      (pca as any).browserStorage?.setInteractionInProgress(false);
      console.log("🧹 Attempted to clear interaction status");
    } catch (clearError) {
      console.log("⚠️ Could not clear interaction status:", clearError);
    }
    
    console.log("🚀 Starting logout redirect...");
    await pca.logoutRedirect({ 
      account,
      postLogoutRedirectUri: window.location.origin 
    });
    
  } catch (e: any) {
    const msg = (e?.errorCode || e?.message || "").toString();
    console.error("❌ Logout failed:", {
      error: e,
      errorCode: e?.errorCode,
      errorMessage: e?.message,
      fullMessage: msg
    });
    
    if (msg.includes("interaction_in_progress")) {
      console.warn("🔄 Interaction in progress detected - using fallback logout");
      
      // Try more aggressive cleanup
      try {
        // Clear MSAL's internal state
        (pca as any).browserStorage?.clear();
        console.log("🧹 Cleared MSAL browser storage");
      } catch (clearErr) {
        console.warn("⚠️ Could not clear MSAL storage:", clearErr);
      }
      
      // Clear all storage
      console.log("🗑️ Clearing all local storage...");
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies (best effort)
      try {
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        });
        console.log("🍪 Attempted to clear cookies");
      } catch (cookieErr) {
        console.warn("⚠️ Could not clear cookies:", cookieErr);
      }
      
      // Force redirect after a short delay to ensure cleanup completes
      console.log("🔄 Forcing page reload in 100ms...");
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
      return;
    }
    
    // For other errors, still try to clear state and redirect
    console.error("💥 Unexpected logout error - forcing cleanup");
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
  }
}

// Acquire token; we use idToken here for backend validation with audience = clientId
export async function getBearerToken(): Promise<string | null> {
  console.log("🎫 Getting bearer token...");
  
  await ensureMsalReady();
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0] || null;
  
  if (!account) {
    console.log("❌ No account available for token");
    return null;
  }
  
  console.log("👤 Using account for token:", account.username);
  
  try {
    const result: AuthenticationResult = await pca.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    console.log("✅ Token acquired silently");
    // Always use ID token for backend auth (aud = SPA client id)
    return result.idToken || null;
  } catch (e: any) {
    const msg = (e?.errorCode || e?.message || "").toString();
    console.log("❌ Silent token acquisition failed:", {
      error: e?.errorCode || e?.message,
      isInteractionInProgress: msg.includes("interaction_in_progress")
    });
    
    // If silent fails and it's not an interaction_in_progress error, try interactive login
    if (!msg.includes("interaction_in_progress")) {
      try {
        console.log("🔄 Attempting interactive token acquisition...");
        await pca.acquireTokenRedirect(loginRequest);
      } catch (err: any) {
        const errMsg = (err?.errorCode || err?.message || "").toString();
        console.error("❌ Interactive token acquisition failed:", err?.errorCode || err?.message);
        if (errMsg.includes("interaction_in_progress")) return null;
        throw err;
      }
    }
    return null;
  }
}