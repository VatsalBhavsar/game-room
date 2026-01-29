import * as React from "react";
import { cn } from "../../lib/utils";

const Badge = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-white/80",
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
