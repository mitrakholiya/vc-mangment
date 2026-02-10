"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import React from "react";
import { Toaster } from "react-hot-toast";
import ProfileBar from "@/components/ProfileBar";

const queryClient = new QueryClient();

// const theme = createTheme({
//   palette: {
//     primary: { main: "#4f46e5" },
//   },
// });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <ThemeProvider theme={theme}> */}
      <Toaster position="top-center" />
      {children}
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  );
}
