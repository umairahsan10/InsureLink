import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors";
  const variants: Record<string, string> = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "bg-neutral-200 text-black hover:bg-neutral-300",
    ghost: "bg-transparent text-black hover:bg-neutral-100",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export default Button;


