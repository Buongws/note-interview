"use client";
import { ThemeProvider as NextThemes } from "next-themes";
import { SWRConfig } from "swr";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 5000, keepPreviousData: true }}>
        {children}
      </SWRConfig>
    </NextThemes>
  );
}
