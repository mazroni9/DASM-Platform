"use client";

import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';
import { useCallback } from 'react';

export function useLoadingRouter() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const push = useCallback(
    async (href: string, options?: { scroll?: boolean }) => {
      startLoading();
      try {
        router.push(href, options);
      } finally {
        setTimeout(() => {
          stopLoading();
        }, 100);
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
        setTimeout(() => {
          stopLoading();
        }, 100);
      }
    },
    [router, startLoading, stopLoading]
  );

  const refresh = useCallback(
    async () => {
      startLoading();
      try {
        router.refresh();
      } finally {
        setTimeout(() => {
          stopLoading();
        }, 500);
      }
    },
    [router, startLoading, stopLoading]
  );

  const back = useCallback(
    async () => {
      startLoading();
      try {
        router.back();
      } finally {
        setTimeout(() => {
          stopLoading();
        }, 100);
      }
    },
    [router, startLoading, stopLoading]
  );

  const forward = useCallback(
    async () => {
      startLoading();
      try {
        router.forward();
      } finally {
        setTimeout(() => {
          stopLoading();
        }, 100);
      }
    },
    [router, startLoading, stopLoading]
  );

  return {
    push,
    replace,
    refresh,
    back,
    forward,
    ...router,
  };
}
