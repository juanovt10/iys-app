'use client'

import * as React from "react"
import { createContext, useContext } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// Minimal session role context for client components
export type AppRole = 'admin' | 'site_manager' | null
export const SessionRoleContext = createContext<{ role: AppRole }>({ role: null })
export function useSessionRole() { return useContext(SessionRoleContext) }

export function RoleProvider({ role, children }: { role: AppRole; children: React.ReactNode }) {
  return (
    <SessionRoleContext.Provider value={{ role }}>
      {children}
    </SessionRoleContext.Provider>
  )
}