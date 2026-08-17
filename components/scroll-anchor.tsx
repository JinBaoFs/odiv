'use client';

import {useEffect, useRef, type ReactNode} from 'react';

type ScrollAnchorProps = {
  children: ReactNode;
  className?: string;
  id: string;
  offset?: number;
};

function resetDocumentScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function ScrollAnchor({children, className, id, offset = 0}: ScrollAnchorProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToAnchor = () => {
      let hash = window.location.hash.slice(1);

      try {
        hash = decodeURIComponent(hash);
      } catch {
        return;
      }

      if (hash !== id || !anchorRef.current) return;

      const scrollContainer = anchorRef.current.closest<HTMLElement>('.content');
      if (!scrollContainer) return;

      const overflowY = window.getComputedStyle(scrollContainer).overflowY;
      if (overflowY !== 'auto' && overflowY !== 'scroll') {
        anchorRef.current.scrollIntoView();
        return;
      }

      resetDocumentScroll();

      const containerTop = scrollContainer.getBoundingClientRect().top;
      const anchorTop = anchorRef.current.getBoundingClientRect().top;
      const nextScrollTop = scrollContainer.scrollTop + anchorTop - containerTop - offset;

      scrollContainer.scrollTo({
        top: Math.max(0, nextScrollTop),
        behavior: 'auto'
      });

      requestAnimationFrame(resetDocumentScroll);
    };

    const frameId = requestAnimationFrame(scrollToAnchor);
    window.addEventListener('hashchange', scrollToAnchor);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('hashchange', scrollToAnchor);
    };
  }, [id, offset]);

  return (
    <div ref={anchorRef} className={className} id={id}>
      {children}
    </div>
  );
}
