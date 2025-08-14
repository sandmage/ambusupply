"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface TouchNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}

export function TouchNumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  className = "",
}: TouchNumberInputProps) {
  const [isPressed, setIsPressed] = useState<"increment" | "decrement" | null>(null)

  const increment = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10)
    }
  }

  const decrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="icon"
          className={`touch-target h-12 w-12 rounded-full transition-all duration-150 ${
            isPressed === "decrement" ? "scale-95 bg-accent" : ""
          }`}
          onTouchStart={() => setIsPressed("decrement")}
          onTouchEnd={() => setIsPressed(null)}
          onMouseDown={() => setIsPressed("decrement")}
          onMouseUp={() => setIsPressed(null)}
          onClick={decrement}
          disabled={value <= min}
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="flex-1 text-center">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            className="text-center text-lg font-semibold border-2 h-12 touch-target"
            readOnly
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className={`touch-target h-12 w-12 rounded-full transition-all duration-150 ${
            isPressed === "increment" ? "scale-95 bg-accent" : ""
          }`}
          onTouchStart={() => setIsPressed("increment")}
          onTouchEnd={() => setIsPressed(null)}
          onMouseDown={() => setIsPressed("increment")}
          onMouseUp={() => setIsPressed(null)}
          onClick={increment}
          disabled={value >= max}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

interface TouchSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}

export function TouchSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className = "",
}: TouchSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    onChange(newValue)
    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(5)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <span className="text-sm font-semibold text-primary">{value}</span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer touch-target slider"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`,
          }}
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: hsl(var(--primary));
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            transition: all 0.15s ease;
          }
          .slider::-webkit-slider-thumb:active {
            transform: scale(1.2);
          }
          .slider::-moz-range-thumb {
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: hsl(var(--primary));
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>
    </div>
  )
}
