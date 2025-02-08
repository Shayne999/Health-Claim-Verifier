import { cn } from '../../lib/utils';

export function Input({ className, ...props }) {
    return (
      <input
        className={cn(
          'w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-blue-300 focus:outline-none',
          className
        )}
        {...props}
      />
    );
  }