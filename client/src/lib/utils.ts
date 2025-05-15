import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a hex color to RGBA
 * @param hex The hex color code
 * @param alpha The alpha value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
  let g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
  let b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
  
  // Return the RGBA string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
