"use client";
import React from "react";
import TextField from "@mui/material/TextField";

type InputProps = {
  type: string;
  placeholder: string;
  value: string | number;
  setValue: (value: string) => void;
  variant?: "outlined" | "filled" | "standard";
};

export const Input = ({
  type,
  placeholder,
  value,
  setValue,
  variant = "outlined",
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
    />
  );
};
