import { useEffect, useRef } from 'react';

const SCRAPE_INTERVAL_MS = 35_000;

export function BackgroundScraper() {
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const triggerScrape = async () => {
      if (!active || inFlight.current || document.visibilityState === 'hidden') return;
      inFlight.current = true;

      try {
        await fetch('/api/scrape-psx', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
      } catch {
        // The scraper is best-effort and must not interrupt the dashboard.
      } finally {
        inFlight.current = false;
      }
    };

    triggerScrape();
    const intervalId = window.setInterval(triggerScrape, SCRAPE_INTERVAL_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
