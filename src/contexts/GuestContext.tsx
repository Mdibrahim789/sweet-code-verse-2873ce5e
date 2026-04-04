import React, { createContext, useContext, useState } from 'react';

interface GuestContextType {
  isGuestMode: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);

  const enterGuestMode = () => setIsGuestMode(true);
  const exitGuestMode = () => setIsGuestMode(false);

  return (
    <GuestContext.Provider value={{ isGuestMode, enterGuestMode, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within GuestProvider');
  }
  return context;
};
