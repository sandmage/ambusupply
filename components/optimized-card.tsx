import { memo, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface OptimizedCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
  variant?: "default" | "apple" | "glass"
  hover?: boolean
}

export const OptimizedCard = memo<OptimizedCardProps>(
  ({ title, description, children, className, headerAction, variant = "apple", hover = true }) => {
    const cardVariants = {
      default: "",
      apple: "apple-card",
      glass: "apple-glass",
    }

    const cardClasses = cn(
      cardVariants[variant],
      hover && "group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
      className,
    )

    return (
      <Card className={cardClasses}>
        {(title || description || headerAction) && (
          <CardHeader className={cn("pb-6", !children && "pb-4")}>
            <div className="flex items-center justify-between">
              <div>
                {title && <CardTitle className="text-2xl font-serif font-bold text-primary">{title}</CardTitle>}
                {description && <CardDescription className="text-base font-medium mt-2">{description}</CardDescription>}
              </div>
              {headerAction}
            </div>
          </CardHeader>
        )}
        <CardContent className={cn(!title && !description && !headerAction && "p-6")}>{children}</CardContent>
      </Card>
    )
  },
)

OptimizedCard.displayName = "OptimizedCard"
