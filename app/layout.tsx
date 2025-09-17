import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"
import { ThemeProvider, RoleProvider, type AppRole } from "@/components/themes.provider";
import { getSessionAndRole } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/server";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Infra-Sena App",
  description: "Application for Infra-Sena",
};

export type Permissions = {
  is_superuser: boolean;
  can_view_proyectos: boolean;
  can_create_deliverables: boolean;
  can_manage_cuts: boolean;
  can_view_cotizaciones: boolean;
  can_create_projects: boolean;
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = await getSessionAndRole();

  return (
    <html lang="en">
      <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
      fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <RoleProvider role={role as AppRole}>
            {children}
          </RoleProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
