import React, { useState } from 'react';
import { logout } from './authClient';

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log("Logout already in progress, ignoring click");
      return;
    }
    
    console.log("Logout button clicked");
    setIsLoggingOut(true);
    setError(null);
    
    try {
      await logout();
      console.log("Logout completed successfully");
    } catch (error: any) {
      console.error('Logout failed in button handler:', error);
      setError(error?.message || 'Logout failed');
      // Reset state if logout fails so user can try again
      setIsLoggingOut(false);
    }
  };

  return (
    <div>
      <a 
        onClick={handleLogout}
        style={{ 
          opacity: isLoggingOut ? 0.6 : 1,
          cursor: isLoggingOut ? 'not-allowed' : 'pointer',
          pointerEvents: isLoggingOut ? 'none' : 'auto',
          color: error ? '#ff4d4f' : undefined
        }}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </a>
      {error && (
        <div style={{ 
          fontSize: '12px', 
          color: '#ff4d4f', 
          marginTop: '4px',
          maxWidth: '200px',
          wordBreak: 'break-word'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}