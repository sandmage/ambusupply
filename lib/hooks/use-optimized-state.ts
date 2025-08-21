"use client"

import { useReducer, useMemo } from "react"

interface OptimizedState {
  loading: boolean
  error: string | null
  data: any
  filters: Record<string, any>
  selectedItems: string[]
  searchTerm: string
}

type OptimizedAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: any }
  | { type: "SET_FILTER"; payload: { key: string; value: any } }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_SELECTED_ITEMS"; payload: string[] }
  | { type: "TOGGLE_SELECTED_ITEM"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "RESET_STATE" }

const initialState: OptimizedState = {
  loading: false,
  error: null,
  data: [],
  filters: {},
  selectedItems: [],
  searchTerm: "",
}

function optimizedReducer(state: OptimizedState, action: OptimizedAction): OptimizedState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_DATA":
      return { ...state, data: action.payload, loading: false, error: null }
    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value },
      }
    case "CLEAR_FILTERS":
      return { ...state, filters: {} }
    case "SET_SELECTED_ITEMS":
      return { ...state, selectedItems: action.payload }
    case "TOGGLE_SELECTED_ITEM":
      const isSelected = state.selectedItems.includes(action.payload)
      return {
        ...state,
        selectedItems: isSelected
          ? state.selectedItems.filter((id) => id !== action.payload)
          : [...state.selectedItems, action.payload],
      }
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload }
    case "RESET_STATE":
      return initialState
    default:
      return state
  }
}

export function useOptimizedState(customInitialState?: Partial<OptimizedState>) {
  const [state, dispatch] = useReducer(optimizedReducer, { ...initialState, ...customInitialState })

  const actions = useMemo(
    () => ({
      setLoading: (loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading }),
      setError: (error: string | null) => dispatch({ type: "SET_ERROR", payload: error }),
      setData: (data: any) => dispatch({ type: "SET_DATA", payload: data }),
      setFilter: (key: string, value: any) => dispatch({ type: "SET_FILTER", payload: { key, value } }),
      clearFilters: () => dispatch({ type: "CLEAR_FILTERS" }),
      setSelectedItems: (items: string[]) => dispatch({ type: "SET_SELECTED_ITEMS", payload: items }),
      toggleSelectedItem: (id: string) => dispatch({ type: "TOGGLE_SELECTED_ITEM", payload: id }),
      setSearchTerm: (term: string) => dispatch({ type: "SET_SEARCH_TERM", payload: term }),
      resetState: () => dispatch({ type: "RESET_STATE" }),
    }),
    [],
  )

  return { state, actions }
}
