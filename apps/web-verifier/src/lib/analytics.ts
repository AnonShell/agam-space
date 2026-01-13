/**
 * Analytics utilities for Umami tracking
 * Only tracks in production environment for privacy
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, any>) => void;
    };
  }
}

/**
 * Track an event with Umami (only in production)
 * @param event - Event name
 * @param data - Optional event data (keeps privacy - no user input)
 */
export function trackEvent(event: string, data?: Record<string, any>) {
  // Only track in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 [DEV] Would track event:', event, data);
    return;
  }

  // Check if Umami is loaded
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track(event, data);
    } catch (error) {
      // Silently fail if tracking fails
      console.warn('Analytics tracking failed:', error);
    }
  }
}

/**
 * Track verify instance button click
 * @param method - Verification method used ('url' or 'manual')
 */
export function trackVerifyInstance(method: 'url' | 'manual') {
  trackEvent('verify_instance', {
    method,
    timestamp: Date.now(),
    // No user input data for privacy
  });
}
