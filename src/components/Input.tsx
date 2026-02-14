"use client";
import React from "react";
import { TextField, SxProps, Theme } from "@mui/material";

type InputProps = {
  type: string;
  placeholder: string;
  value: string | number;
  setValue: (value: string) => void;
  variant?: "outlined" | "filled" | "standard";
  sx?: SxProps<Theme>;
};

export const Input = ({
  type,
  placeholder,
  value,
  setValue,
  variant = "outlined",
  sx,
}: InputProps) => {
  return (
    <TextField
      type={type}
      label={placeholder}
      variant={variant}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      size="small"
      fullWidth
      InputProps={{
        sx: {
          height: 48, // 👈 control height here
          alignItems: "center", // vertical centering
        },
      }}
      sx={{
        "& .MuiInputLabel-root": { color: "black" },
        "& .MuiInputBase-input::placeholder": { color: "teal", opacity: 1 },
      }}
    />
  );
};
