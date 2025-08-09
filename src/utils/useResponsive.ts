import { useState, useEffect, useMemo } from "react"
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
// Semantics:
// - medium: min-width for medium screens
// - large:  min-width for large screens
// Classification:
//   small:  width < medium
//   medium: medium <= width < large
//   large:  width >= large
// Note: `small` value is retained for backward compatibility but is not used in classification.
const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  small: 768, // retained for backward compatibility (unused in classification)
  medium: 1024, // min-width for medium screens
  large: 1440, // min-width for large screens
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

  // Stabilize breakpoints so consumers can pass inline objects without causing unnecessary resubscribes
  const stableBreakpoints = useMemo<ResponsiveBreakpoints>(
    () => ({
      small: breakpoints.small,
      medium: breakpoints.medium,
      large: breakpoints.large,
    }),
    [breakpoints.small, breakpoints.medium, breakpoints.large],
  )

  useEffect(() => {
    // Recompute immediately in case breakpoints changed without a dimension event
    const current = Dimensions.get("window")
    setScreenData(calculateScreenSize(current.width, current.height, stableBreakpoints))

    const onChange = ({ window }: { window: ScaledSize }) => {
      setScreenData(calculateScreenSize(window.width, window.height, stableBreakpoints))
    }

    const subscription = Dimensions.addEventListener("change", onChange)

    // Cleanup supports both new and legacy React Native APIs
    return () => {
      // Newer RN returns an EventSubscription with remove()
      const subAny = subscription as any
      if (subAny && typeof subAny.remove === "function") {
        subAny.remove()
      } else {
        // Legacy API: removeEventListener
        const dimsAny = Dimensions as any
        if (typeof dimsAny.removeEventListener === "function") {
          dimsAny.removeEventListener("change", onChange)
        }
      }
    }
  }, [stableBreakpoints])

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
  // Use medium and large as min-width thresholds
  const isSmall = width < breakpoints.medium
  const isMedium = width >= breakpoints.medium && width < breakpoints.large
  const isLarge = width >= breakpoints.large

  // Define a consistent rule when width === height:
  // Treat square screens as portrait to ensure mutual exclusivity and full coverage
  const isPortrait = height >= width
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
