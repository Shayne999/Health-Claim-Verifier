

export function Card({ className, children }) {
    return (
      <div className={`bg-white shadow-md rounded-md p-4 ${className}`}>
        {children}
      </div>
    );
  }

  export function CardContent({ children }) {
    return (
      <div className="text-gray-700">
        {children}
      </div>
    );
  }