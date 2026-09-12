"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[#F1EEE1] px-4 text-center text-[#1C2A22]">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm">Please refresh the page.</p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-[#1F3A28] px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
