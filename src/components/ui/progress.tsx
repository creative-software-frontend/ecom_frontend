import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "@/lib/utils" // আপনার প্রজেক্টের সঠিক cn পাথ দিন

// প্রপসের ইন্টারফেস ডিফাইন করুন যাতে টাইপস্ক্রিপ্ট এরর না দেয়
interface ProgressProps extends ProgressPrimitive.Root.Props {
  indicatorClassName?: string
}

function Progress({
  className,
  children,
  value,
  indicatorClassName, // এখানে প্রপসটি রিসিভ করুন
  ...props
}: ProgressProps) {
  // এখানে টাইপ পরিবর্তন করে ProgressProps দিন
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {/* 
        যদি আপনি বাইরে থেকে কোনো চিলড্রেন (যেমন Label বা Value) না দেন, 
        তবে এটি ডিফল্টভাবে Track এবং Indicator রেন্ডার করবে এবং 
        indicatorClassName-কে পাস করে দেবে।
      */}
      {children || (
        <ProgressTrack>
          <ProgressIndicator className={indicatorClassName} />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      // bg-primary এর বদলে bg-current দিলে কালার হ্যান্ডেল করা সহজ হয়, তবে bg-primary রাখলেও সমস্যা নেই
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
