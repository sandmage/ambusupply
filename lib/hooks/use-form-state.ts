"use client"

import type React from "react"

import { useState, useCallback } from "react"

interface UseFormStateOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void>
  validate?: (values: T) => Record<string, string>
}

interface UseFormStateResult<T> {
  values: T
  errors: Record<string, string>
  loading: boolean
  setValue: (key: keyof T, value: any) => void
  setValues: (values: Partial<T>) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
}

export function useFormState<T extends Record<string, any>>(options: UseFormStateOptions<T>): UseFormStateResult<T> {
  const [values, setValuesState] = useState<T>(options.initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const setValue = useCallback(
    (key: keyof T, value: any) => {
      setValuesState((prev) => ({ ...prev, [key]: value }))
      // Clear error when user starts typing
      if (errors[key as string]) {
        setErrors((prev) => ({ ...prev, [key as string]: "" }))
      }
    },
    [errors],
  )

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }))
  }, [])

  const reset = useCallback(() => {
    setValuesState(options.initialValues)
    setErrors({})
    setLoading(false)
  }, [options.initialValues])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      // Validate if validator provided
      if (options.validate) {
        const validationErrors = options.validate(values)
        setErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
          return
        }
      }

      try {
        setLoading(true)
        setErrors({})
        await options.onSubmit(values)
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : "An error occurred",
        })
        if (process.env.NODE_ENV === "development") {
          console.error("Form submission error:", error)
        }
      } finally {
        setLoading(false)
      }
    },
    [values, options],
  )

  return {
    values,
    errors,
    loading,
    setValue,
    setValues,
    handleSubmit,
    reset,
  }
}
