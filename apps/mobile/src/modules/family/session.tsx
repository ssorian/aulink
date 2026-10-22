import { createContext, useContext, useState, type ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { children, type Child } from './demo';

const FamilyContext = createContext<{ child: Child | undefined; select: (id: string) => void }>({ child: undefined, select: () => {} });

export function FamilyProvider({ children: content }: { children: ReactNode }) {
  const [id, setId] = useState<string>();
  return <FamilyContext.Provider value={{ child: children.find(child => child.id === id), select: setId }}>{content}</FamilyContext.Provider>;
}

export const useFamily = () => useContext(FamilyContext);

export function RequireChild({ children }: { children: ReactNode }) {
  const { child } = useFamily();
  return child ? children : <Redirect href="/" />;
}
