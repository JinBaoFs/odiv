'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode
} from 'react';
import {usePathname, useSearchParams} from 'next/navigation';
import {OwlCanvas} from './owl-canvas';
import styles from './route-loading-provider.module.css';

type LoadingStatus = 'idle' | 'visible' | 'leaving';

type RouteLoadingProviderProps = {
  children: ReactNode;
  labels: {
    zh: string;
    en: string;
  };
};

type RouteLoadingContextValue = {
  startLoading: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(null);

const MIN_VISIBLE_TIME = 420;
const EXIT_DURATION = 180;
const MAX_VISIBLE_TIME = 10_000;

type TimerRef = MutableRefObject<ReturnType<typeof setTimeout> | null>;

function clearTimer(timer: TimerRef) {
  if (timer.current) {
    clearTimeout(timer.current);
    timer.current = null;
  }
}

function RouteChangeObserver({onRouteChange}: {onRouteChange: () => void}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRouteKey = useRef(routeKey);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;

    previousRouteKey.current = routeKey;
    onRouteChange();
  }, [onRouteChange, routeKey]);

  return null;
}

export function useRouteLoading() {
  const context = useContext(RouteLoadingContext);

  if (!context) {
    throw new Error('useRouteLoading must be used within RouteLoadingProvider');
  }

  return context;
}

export function RouteLoadingProvider({children, labels}: RouteLoadingProviderProps) {
  const statusRef = useRef<LoadingStatus>('idle');
  const startedAt = useRef(0);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [activeLabel, setActiveLabel] = useState(labels.zh);

  const setLoadingStatus = useCallback((nextStatus: LoadingStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const beginExit = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'leaving') return;

    clearTimer(safetyTimer);
    setLoadingStatus('leaving');
    clearTimer(exitTimer);
    exitTimer.current = setTimeout(() => {
      setLoadingStatus('idle');
      exitTimer.current = null;
    }, EXIT_DURATION);
  }, [setLoadingStatus]);

  const startLoading = useCallback(() => {
    if (statusRef.current === 'visible') return;

    clearTimer(finishTimer);
    clearTimer(exitTimer);
    clearTimer(safetyTimer);
    startedAt.current = performance.now();
    setActiveLabel(window.location.pathname.split('/')[1] === 'en' ? labels.en : labels.zh);
    setLoadingStatus('visible');
    safetyTimer.current = setTimeout(beginExit, MAX_VISIBLE_TIME);
  }, [beginExit, labels.en, labels.zh, setLoadingStatus]);

  const completeLoading = useCallback(() => {
    if (statusRef.current !== 'visible') return;

    clearTimer(finishTimer);
    const remainingTime = Math.max(0, MIN_VISIBLE_TIME - (performance.now() - startedAt.current));
    finishTimer.current = setTimeout(() => {
      finishTimer.current = null;
      beginExit();
    }, remainingTime);
  }, [beginExit]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.hasAttribute('download') || anchor.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const targetWindow = anchor.getAttribute('target');
      if (targetWindow && targetWindow.toLowerCase() !== '_self') return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== current.origin) {
        return;
      }

      const destinationRoute = `${destination.pathname}${destination.search}`;
      const currentRoute = `${current.pathname}${current.search}`;
      if (destinationRoute === currentRoute) return;

      startLoading();
    };

    const handleHistoryNavigation = () => startLoading();

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handleHistoryNavigation);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handleHistoryNavigation);
    };
  }, [startLoading]);

  useEffect(() => {
    return () => {
      clearTimer(finishTimer);
      clearTimer(exitTimer);
      clearTimer(safetyTimer);
    };
  }, []);

  const contextValue = useMemo(() => ({startLoading}), [startLoading]);

  return (
    <RouteLoadingContext.Provider value={contextValue}>
      {children}
      <Suspense fallback={null}>
        <RouteChangeObserver onRouteChange={completeLoading} />
      </Suspense>
      {status !== 'idle' ? (
        <div
          className={`${styles.overlay}${status === 'leaving' ? ` ${styles.leaving}` : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className={styles.content}>
            <OwlCanvas width={132} height={132} variant="loading" decorative />
            <p className={styles.label}>{activeLabel}</p>
          </div>
        </div>
      ) : null}
    </RouteLoadingContext.Provider>
  );
}
