'use client'

import React, { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { ScreenReaderOnly } from './screen-reader-only'

interface AccessibleFormProps {
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export function AccessibleForm({
  children,
  onSubmit,
  className,
  ...ariaProps
}: AccessibleFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('space-y-4', className)}
      noValidate
      {...ariaProps}
    >
      {children}
    </form>
  )
}

interface AccessibleFieldProps {
  label: string
  id: string
  children: ReactNode
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

export function AccessibleField({
  label,
  id,
  children,
  error,
  hint,
  required = false,
  className
}: AccessibleFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <ScreenReaderOnly>(필수)</ScreenReaderOnly>
          </>
        )}
      </label>
      
      {hint && (
        <p
          id={hintId}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {hint}
        </p>
      )}
      
      <div>
        {children}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(({
  error = false,
  className,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        'block w-full px-3 py-2 border rounded-md shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        error
          ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
        'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
        'dark:focus:ring-blue-400 dark:focus:border-blue-400',
        className
      )}
      aria-invalid={error}
    />
  )
})

AccessibleInput.displayName = 'AccessibleInput'

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function AccessibleTextarea({
  error = false,
  className,
  ...props
}: AccessibleTextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'block w-full px-3 py-2 border rounded-md shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        'resize-vertical min-h-[100px]',
        error
          ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
        'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
        'dark:focus:ring-blue-400 dark:focus:border-blue-400',
        className
      )}
      aria-invalid={error}
    />
  )
}

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
  error?: boolean
}

export function AccessibleSelect({
  options,
  placeholder,
  error = false,
  className,
  ...props
}: AccessibleSelectProps) {
  return (
    <select
      {...props}
      className={cn(
        'block w-full px-3 py-2 border rounded-md shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        error
          ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
        'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
        'dark:focus:ring-blue-400 dark:focus:border-blue-400',
        className
      )}
      aria-invalid={error}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}

interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
}

export function AccessibleCheckbox({
  label,
  description,
  className,
  id,
  ...props
}: AccessibleCheckboxProps) {
  const [isChecked, setIsChecked] = useState(props.checked || false)

  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <input
        {...props}
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={(e) => {
          setIsChecked(e.target.checked)
          props.onChange?.(e)
        }}
        className={cn(
          'mt-1 h-4 w-4 rounded border-gray-300 text-blue-600',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:bg-gray-800 dark:border-gray-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-describedby={description ? `${id}-description` : undefined}
      />
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p
            id={`${id}-description`}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

interface AccessibleRadioGroupProps {
  name: string
  options: Array<{ value: string; label: string; description?: string }>
  value?: string
  onChange: (value: string) => void
  label: string
  error?: string
  required?: boolean
  className?: string
}

export function AccessibleRadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  error,
  required = false,
  className
}: AccessibleRadioGroupProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <fieldset className={cn('space-y-3', className)} aria-describedby={errorId}>
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <ScreenReaderOnly>(필수)</ScreenReaderOnly>
          </>
        )}
      </legend>
      
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className={cn(
                'mt-1 h-4 w-4 border-gray-300 text-blue-600',
                'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'dark:bg-gray-800 dark:border-gray-600'
              )}
              aria-describedby={option.description ? `${name}-${option.value}-description` : undefined}
            />
            <div className="flex-1">
              <label
                htmlFor={`${name}-${option.value}`}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {option.label}
              </label>
              {option.description && (
                <p
                  id={`${name}-${option.value}-description`}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </fieldset>
  )
}