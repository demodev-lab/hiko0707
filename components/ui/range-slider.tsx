'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface RangeSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  formatValue?: (value: number) => string
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ 
  className, 
  formatValue = (v) => v.toString(),
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 1,
  ...props 
}, ref) => {
  const value = props.value || props.defaultValue || [min, max]
  
  return (
    <div className="relative">
      <SliderPrimitive.Root
        ref={ref}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={minStepsBetweenThumbs}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <SliderPrimitive.Range className="absolute h-full bg-blue-600 dark:bg-blue-500" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-blue-600 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-blue-500 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-500" />
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-blue-600 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-blue-500 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-500" />
      </SliderPrimitive.Root>
      
      {/* Value labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
        <span>{formatValue((value as number[])[0])}</span>
        <span>{formatValue((value as number[])[1])}</span>
      </div>
    </div>
  )
})

RangeSlider.displayName = 'RangeSlider'

export { RangeSlider }