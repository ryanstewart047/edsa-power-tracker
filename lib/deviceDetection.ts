/**
 * Mobile Device Detection Utility
 */

export interface DeviceInfo {
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  userAgent: string
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { isMobile: false, isAndroid: false, isIOS: false, userAgent: '' }
  }

  const userAgent = navigator.userAgent || navigator.vendor || ''
  const isAndroid = /android/i.test(userAgent) && !/windows phone/i.test(userAgent)
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent) && !(window as { MSStream?: unknown }).MSStream
  
  return {
    isMobile: isAndroid || isIOS,
    isAndroid,
    isIOS,
    userAgent
  }
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return isStandalone || isIOSStandalone || window.location.search.includes('source=pwa')
}
