"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import React from 'react';

const Toaster = ({ ...props }: ToasterProps) => {
  // Определяем тему по классу на body или html
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
