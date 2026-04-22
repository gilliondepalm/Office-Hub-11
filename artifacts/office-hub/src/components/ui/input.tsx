import * as React from "react"
import { useState } from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const isDate = type === "date";

    const input = (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onFocus={(e) => {
          if (isDate) setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          if (isDate) setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    );

    if (isDate) {
      return (
        <div className="w-full">
          {input}
          {isFocused && (
            <p className="text-[10px] text-muted-foreground mt-1 print:hidden">
              Spatiebalk voor activeren kalender
            </p>
          )}
        </div>
      );
    }

    return input;
  }
)
Input.displayName = "Input"

export { Input }
