'use client'
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-fast ease-out focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-fg-on-brand shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px] active:translate-y-[2px] active:shadow-none',
        secondary: 'bg-paper-100 text-fg-1 border border-default hover:bg-paper-200',
        ghost: 'bg-transparent text-fg-2 hover:bg-paper-100',
        danger: 'bg-danger text-fg-on-brand shadow-btn-danger hover:translate-y-[1px] active:translate-y-[2px] active:shadow-none',
      },
      size: {
        sm: 'min-h-9 px-3.5 text-sm rounded-sm',
        default: 'min-h-12 px-5 text-base rounded-md',
        lg: 'min-h-14 px-7 text-lg rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
