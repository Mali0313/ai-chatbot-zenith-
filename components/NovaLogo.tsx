import React from "react";
import { cn } from "@/lib/utils";

interface NovaLogoProps {
  variant?: "icon" | "full";
  size?: number;
  className?: string;
  iconClassName?: string;
  showGradient?: boolean;
}

/**
 * Reusable Nova Logo Component.
 * Features a minimalist, celestial 4-point nova sparkle star
 * with smooth modern curves and a vibrant blue-to-purple gradient.
 */
export const NovaLogo: React.FC<NovaLogoProps> = ({
  variant = "full",
  size = 24,
  className = "",
  iconClassName = "",
  showGradient = true,
}) => {
  const gradientId = "nova-star-gradient";

  const starIcon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200", iconClassName)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" /> {/* Electric sky blue */}
          <stop offset="50%" stopColor="#818cf8" /> {/* Indigo */}
          <stop offset="100%" stopColor="#c084fc" /> {/* Purple */}
        </linearGradient>
      </defs>

      {/* Main 4-point Nova Star with smooth bezier curves */}
      <path
        d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
        fill={showGradient ? `url(#${gradientId})` : "currentColor"}
      />

      {/* Inner diamond facet accentuating the star center */}
      <circle
        cx="12"
        cy="12"
        r="1.8"
        fill="#ffffff"
        opacity={showGradient ? 0.9 : 0.4}
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center justify-center select-none", className)}>
        {starIcon}
      </div>
    );
  }

  // Full variant: Icon + "Nova" wordmark
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 select-none group",
        className
      )}
    >
      {starIcon}
      <span
        style={{ fontSize: `${Math.max(14, Math.round(size * 0.85))}px` }}
        className="font-bold tracking-tight text-black dark:text-white leading-none transition-colors"
      >
        Nova
      </span>
    </div>
  );
};

export default NovaLogo;
