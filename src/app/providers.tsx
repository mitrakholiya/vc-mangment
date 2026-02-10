"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import React from "react";
import { Toaster } from "react-hot-toast";
import ProfileBar from "@/components/ProfileBar";

const queryClient = new QueryClient();

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: { main: "#374151" },
    secondary: { main: "#6b7280" },
    background: { default: "#ffffff", paper: "#f9fafb" },
    text: { primary: "#374151", secondary: "#4b5563" },
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
