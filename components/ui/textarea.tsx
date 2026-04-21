import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full border-[1.5px] border-default rounded-md px-3.5 py-3 text-base font-sans bg-paper-0 text-fg-1 placeholder:text-fg-disabled',
        'focus:outline-none focus:border-brand focus:shadow-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
        'transition-[border-color,box-shadow] duration-[140ms]',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
