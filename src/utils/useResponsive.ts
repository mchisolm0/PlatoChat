import { useState, useEffect } from "react"
import { Dimensions, ScaledSize } from "react-native"

export interface ScreenSize {
  width: number
  height: number
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
  isPortrait: boolean
  isLandscape: boolean
}

export interface ResponsiveBreakpoints {
  small: number
  medium: number
  large: number
}

// Default breakpoints (can be customized)
const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  small: 768, // Below this is considered small (mobile)
  medium: 1024, // Between small and medium is tablet
  large: 1440, // Above medium is large desktop
}

/**
 * Custom hook for responsive screen size detection
 * Automatically updates on screen size changes and device rotation
 *
 * @param breakpoints - Optional custom breakpoints
 * @returns ScreenSize object with current dimensions and responsive flags
 */
export const useResponsive = (
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS,
): ScreenSize => {
  const [screenData, setScreenData] = useState<ScreenSize>(() => {
    const { width, height } = Dimensions.get("window")
    return calculateScreenSize(width, height, breakpoints)
  })

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ window }: { window: ScaledSize }) => {
        const newScreenData = calculateScreenSize(window.width, window.height, breakpoints)
        setScreenData(newScreenData)
      },
    )

    return () => subscription?.remove()
  }, [breakpoints])

  return screenData
}

/**
 * Helper function to calculate screen size properties
 */
function calculateScreenSize(
  width: number,
  height: number,
  breakpoints: ResponsiveBreakpoints,
): ScreenSize {
  const isSmall = width < breakpoints.small
  const isMedium = width >= breakpoints.small && width < breakpoints.large
  const isLarge = width >= breakpoints.large
  const isPortrait = height > width
  const isLandscape = width > height

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isPortrait,
    isLandscape,
  }
}

/**
 * Utility function to get current screen size without hook (for non-component usage)
 */
export const getScreenSize = (
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS,
): ScreenSize => {
  const { width, height } = Dimensions.get("window")
  return calculateScreenSize(width, height, breakpoints)
}

/**
 * Common responsive utilities
 */
export const ResponsiveUtils = {
  /**
   * Check if current screen is mobile-sized
   */
  isMobile: (breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS): boolean => {
    return getScreenSize(breakpoints).isSmall
  },

  /**
   * Check if current screen is tablet-sized
   */
  isTablet: (breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS): boolean => {
    return getScreenSize(breakpoints).isMedium
  },

  /**
   * Check if current screen is desktop-sized
   */
  isDesktop: (breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS): boolean => {
    return getScreenSize(breakpoints).isLarge
  },

  /**
   * Get responsive value based on screen size
   */
  getValue: <T>(
    values: { small?: T; medium?: T; large?: T },
    fallback: T,
    breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS,
  ): T => {
    const { isSmall, isMedium, isLarge } = getScreenSize(breakpoints)

    if (isSmall && values.small !== undefined) return values.small
    if (isMedium && values.medium !== undefined) return values.medium
    if (isLarge && values.large !== undefined) return values.large

    // Fallback logic: try to find the closest available value
    if (isSmall && values.medium !== undefined) return values.medium
    if (isSmall && values.large !== undefined) return values.large
    if (isMedium && values.small !== undefined) return values.small
    if (isMedium && values.large !== undefined) return values.large
    if (isLarge && values.medium !== undefined) return values.medium
    if (isLarge && values.small !== undefined) return values.small

    return fallback
  },
}
