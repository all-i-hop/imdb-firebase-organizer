export function Card({ children }) {
    return (
      <div className="rounded-xl border shadow-sm bg-white overflow-hidden">
        {children}
      </div>
    );
  }
  
  export function CardContent({ children, className = "" }) {
    return <div className={`p-4 ${className}`}>{children}</div>;
  }
  