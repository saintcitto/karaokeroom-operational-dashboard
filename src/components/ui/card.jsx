import React from "react";
import clsx from "clsx";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-700/40 bg-gray-900/50 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-black/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "p-4 sm:p-6 md:p-8 text-gray-100 font-sans",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
