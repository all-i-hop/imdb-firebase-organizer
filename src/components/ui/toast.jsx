import { useEffect } from "react";

export default function Toast({ message, onClose, type = "success" }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const base = "fixed bottom-4 right-4 z-50 px-4 py-2 text-white rounded shadow";
  const color =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-gray-600";

  return (
    <div className={`${base} ${color}`}>
      {message}
    </div>
  );
}
