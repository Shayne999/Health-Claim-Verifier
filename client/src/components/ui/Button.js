import { cn } from '../../lib/utils';

export function Button({ className, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'bg-blue-500 text-white hover:bg-blue-600',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}