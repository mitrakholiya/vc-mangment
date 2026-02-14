"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import React from "react";
import { Toaster } from "react-hot-toast";
import ProfileBar from "@/components/ProfileBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, no loading shown
      refetchOnWindowFocus: true, // Update in background when user returns
      refetchOnMount: false, // Don't refetch if data is still fresh
      retry: 1, // Only retry once to fail fast
      retryDelay: 1000,
      // CRITICAL: Keep showing old data while fetching new data
      placeholderData: (previousData: any) => previousData,
    },
  },
});

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    // primary: { main: "#374151" },
    primary: { main: "#04594A" },
    secondary: { main: "#BF9227" },
    background: { default: "#ffffff", paper: "#f9fafb" },
    text: { primary: "#04594A", secondary: "#BF9227" },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Toaster position="top-center" />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
