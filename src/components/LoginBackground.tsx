"use client";

import React, { useMemo } from "react";
import "./loginBackground.css";

const LoginBackground: React.FC = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 10000; // random delay up to 10s
      return {
        id: i,
        style: {
          top: `${top}%`,
          left: `${left}%`,
          animationDelay: `${delay}ms`,
        },
      };
    });
  }, []);

  return (
    <div className="night">
      {stars.map((star) => (
        <div key={star.id} className="shooting_star" style={star.style} />
      ))}
    </div>
  );
};

export default LoginBackground;
