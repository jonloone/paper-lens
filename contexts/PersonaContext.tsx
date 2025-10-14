'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getCurrentUser,
  getProductDetailPersona,
  getDefaultTabForPersona,
  type ProductDetailPersona
} from '@/lib/services/persona-detection';
import type { UserRole } from '@/lib/types/persona';

interface PersonaContextType {
  persona: ProductDetailPersona;
  userRole: UserRole;
  setPersona: (persona: ProductDetailPersona) => void;
  getDefaultTab: () => string;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<ProductDetailPersona>('data_analyst');
  const [userRole, setUserRole] = useState<UserRole>('data_analyst');

  useEffect(() => {
    // Get user role from auth/localStorage
    const user = getCurrentUser();
    setUserRole(user.role);

    // Check if user has manually overridden persona
    const savedPersona = localStorage.getItem('nexusone_product_persona') as ProductDetailPersona;
    if (savedPersona) {
      setPersonaState(savedPersona);
    } else {
      // Map user role to product detail persona
      const detectedPersona = getProductDetailPersona(user.role);
      setPersonaState(detectedPersona);
    }
  }, []);

  const setPersona = (newPersona: ProductDetailPersona) => {
    setPersonaState(newPersona);
    localStorage.setItem('nexusone_product_persona', newPersona);
  };

  const getDefaultTab = () => {
    return getDefaultTabForPersona(persona);
  };

  return (
    <PersonaContext.Provider value={{ persona, userRole, setPersona, getDefaultTab }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
