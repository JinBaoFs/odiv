'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

type MobileNavContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error('useMobileNav must be used within MobileNavProvider');
  }
  return context;
}

interface MobileNavProviderProps {
  children: ReactNode;
}

export function MobileNavProvider({ children }: MobileNavProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function MobileNavToggle() {
  const { isOpen, setIsOpen } = useMobileNav();

  return (
    <button
      className="iconButton"
      onClick={() => setIsOpen(!isOpen)}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}

interface MobileNavContentProps {
  children: ReactNode;
}

export function MobileNavContent({ children }: MobileNavContentProps) {
  const { isOpen } = useMobileNav();

  return (
    <div className={`mobileNavContent ${isOpen ? 'open' : ''}`}>
      {children}
    </div>
  );
}
