const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params)
}

export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: path })
}
