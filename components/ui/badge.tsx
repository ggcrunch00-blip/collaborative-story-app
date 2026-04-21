import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        waiting: 'bg-ink-100 text-phase-waiting',
        reading: 'bg-plum-50 text-plum-700',
        writing: 'bg-brand-soft text-crayon-700',
        done:    'bg-sprout-50 text-sprout-700',
        offline: 'bg-berry-50 text-berry-700',
        help:    'bg-sun-50 text-sun-700',
      },
    },
    defaultVariants: { variant: 'waiting' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
