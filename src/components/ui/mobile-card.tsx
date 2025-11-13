import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Card component optimized for mobile views
 * Used to replace table rows on small screens
 */
export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-3 sm:p-4 shadow-soft hover:shadow-hover transition-all",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      {children}
    </Card>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-start gap-2 py-1.5", className)}>
      <span className="text-xs sm:text-sm text-muted-foreground font-medium min-w-[80px]">
        {label}:
      </span>
      <div className="text-xs sm:text-sm font-medium text-right flex-1">
        {value}
      </div>
    </div>
  );
}
