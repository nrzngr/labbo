import * as React from "react"
import { cn } from "@/lib/utils"

interface AccessibleWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  focusable?: boolean
  skipLink?: boolean
}

export const AccessibleWrapper = React.forwardRef<HTMLDivElement, AccessibleWrapperProps>(
  ({
    className,
    children,
    role,
    ariaLabel,
    ariaDescribedBy,
    focusable = false,
    skipLink = false,
    tabIndex,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }, [props.onFocus])

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLDivElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }, [props.onBlur])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const element = e.currentTarget
        if (element) {
          element.click()
        }
      }
      props.onKeyDown?.(e)
    }, [props.onKeyDown])

    return (
      <>
        {skipLink && (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white z-50"
          >
            Skip to main content
          </a>
        )}
        <div
          ref={ref}
          role={role}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          tabIndex={focusable ? 0 : tabIndex}
          className={cn(
            "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-lg",
            isFocused && "ring-2 ring-black ring-offset-2",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={focusable ? handleKeyDown : undefined}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)

AccessibleWrapper.displayName = "AccessibleWrapper"

// Skip Links component for accessibility
export function SkipLinks() {
  return (
    <div className="sr-only">
      <a href="#main-content" className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-black text-white px-4 py-2 rounded-md z-50">
        Skip to main content
      </a>
      <a href="#navigation" className="focus:not-sr-only focus:absolute focus:top-16 focus:left-4 bg-black text-white px-4 py-2 rounded-md z-50">
        Skip to navigation
      </a>
    </div>
  )
}

// Announcer for screen readers
export function useAnnouncer() {
  const [announcement, setAnnouncement] = React.useState("")

  const announce = React.useCallback((message: string) => {
    setAnnouncement("")
    setTimeout(() => setAnnouncement(message), 100)
  }, [])

  const AnnouncerComponent = React.useCallback(() => (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  ), [announcement])

  return { announce, AnnouncerComponent }
}

// Focus trap for modals
export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    previousFocusRef.current = document.activeElement as HTMLElement

    if (firstElement) {
      firstElement.focus()
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}