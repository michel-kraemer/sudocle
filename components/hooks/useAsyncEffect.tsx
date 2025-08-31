import { useEffect, useMemo, useRef, useState } from "react"

export interface UseAsyncEffectResult<T> {
  result: T | undefined
  error: any
  isLoading: boolean
}

/**
 * Hook to run an async effect on mount and another on unmount.
 * Provided "for free" by François Zaninotto
 * See https://marmelab.com/blog/2023/01/11/use-async-effect-react.html
 */
export function useAsyncEffect<T>(
  mountCallback: () => Promise<T>,
  unmountCallback: () => Promise<void>,
  deps: any[] = [],
): UseAsyncEffectResult<T> {
  const isMounted = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>(undefined)
  const [result, setResult] = useState<T>()

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    let ignore = false
    let mountSucceeded = false

    ;(async () => {
      await Promise.resolve() // wait for the initial cleanup in Strict mode - avoids double mutation
      if (!isMounted.current || ignore) {
        return
      }
      setIsLoading(true)
      try {
        const result = await mountCallback()
        mountSucceeded = true
        if (isMounted.current && !ignore) {
          setError(undefined)
          setResult(result)
          setIsLoading(false)
        } else {
          // Component was unmounted before the mount callback returned, cancel it
          unmountCallback()
        }
      } catch (error) {
        console.error(error)
        if (!isMounted.current) return
        setError(error)
        setIsLoading(false)
      }
    })()

    return () => {
      ignore = true
      if (mountSucceeded) {
        unmountCallback()
          .then(() => {
            if (!isMounted.current) return
            setResult(undefined)
          })
          .catch((error: unknown) => {
            console.error(error)
            if (!isMounted.current) return
            setError(error)
          })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return useMemo(
    () => ({ result, error, isLoading }),
    [result, error, isLoading],
  )
}
