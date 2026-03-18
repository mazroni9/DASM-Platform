"use client";

import Link from "next/link";
import { useLoading } from "@/contexts/LoadingContext";
import { useCallback, useRef } from "react";

interface LoadingLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
}

export default function LoadingLink({
  children,
  href,
  onClick,
  ...props
}: LoadingLinkProps) {
  const loadingContext = useLoading();
  const isNavigatingRef = useRef(false);

  // Handle SSR case where context might not be available
  const { startLoading, stopLoading } = loadingContext || {
    startLoading: () => {},
    stopLoading: () => {},
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call the original onClick if provided
      if (onClick) {
        onClick(e);
      }

      // Only start loading if it's an internal link and we're not already navigating
      // Check if we're in the browser (not SSR)
      if (
        !isNavigatingRef.current &&
        typeof href === "string" &&
        typeof window !== "undefined"
      ) {
        const currentPath = window.location.pathname + window.location.search;
        const targetPath = href.split("?")[0]; // Remove query params for comparison

        // Check if it's actually a different route
        if (
          targetPath !== currentPath &&
          !href.startsWith("http") &&
          !href.startsWith("#")
        ) {
          isNavigatingRef.current = true;
          startLoading();

          // Stop loading after navigation completes
          // This will be handled by NavigationProgressProvider, but we add a fallback
          setTimeout(() => {
            if (isNavigatingRef.current) {
              isNavigatingRef.current = false;
              stopLoading();
            }
          }, 2000); // Fallback timeout
        }
      }
    },
    [href, onClick, startLoading, stopLoading]
  );

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
