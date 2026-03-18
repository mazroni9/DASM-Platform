"use client";

import { useRouter } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";
import { useCallback, useMemo } from "react";

export function useLoadingRouter() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const push = useCallback(
    async (href: string, options?: { scroll?: boolean }) => {
      startLoading();
      try {
        router.push(href, options);
      } finally {
        setTimeout(() => stopLoading(), 50);
      }
    },
    [router, startLoading, stopLoading]
  );

  const replace = useCallback(
    async (href: string, options?: { scroll?: boolean }) => {
      startLoading();
      try {
        router.replace(href, options);
      } finally {
        setTimeout(() => stopLoading(), 50);
      }
    },
    [router, startLoading, stopLoading]
  );

  const refresh = useCallback(async () => {
    startLoading();
    try {
      router.refresh();
    } finally {
      setTimeout(() => stopLoading(), 200);
    }
  }, [router, startLoading, stopLoading]);

  const back = useCallback(async () => {
    startLoading();
    try {
      router.back();
    } finally {
      setTimeout(() => stopLoading(), 50);
    }
  }, [router, startLoading, stopLoading]);

  const forward = useCallback(async () => {
    startLoading();
    try {
      router.forward();
    } finally {
      setTimeout(() => stopLoading(), 50);
    }
  }, [router, startLoading, stopLoading]);

  return useMemo(
    () => ({
      push,
      replace,
      refresh,
      back,
      forward,
      ...router,
    }),
    [push, replace, refresh, back, forward, router]
  );
}
