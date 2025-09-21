"use client";

interface ToggleSliderProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ToggleSlider({ 
  checked, 
  onChange, 
  label, 
  disabled = false, 
  size = "md",
  className = ""
}: ToggleSliderProps) {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-12 h-6", 
    lg: "w-16 h-8"
  };

  const thumbSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7"
  };

  const thumbPositionClasses = {
    sm: checked ? "translate-x-4" : "translate-x-0.5",
    md: checked ? "translate-x-6" : "translate-x-0.5", 
    lg: checked ? "translate-x-8" : "translate-x-0.5"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none border-0
          ${sizeClasses[size]}
          ${checked 
            ? "bg-blue-600" 
            : "bg-gray-200 dark:bg-gray-700"
          }
          ${disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "cursor-pointer hover:bg-blue-700 dark:hover:bg-gray-600"
          }
        `}
      >
        <span
          className={`
            inline-block transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
            ${thumbSizeClasses[size]}
            ${thumbPositionClasses[size]}
          `}
        />
      </button>
      {label && (
        <label className={`text-sm font-medium text-black dark:text-white ${disabled ? "opacity-50" : ""}`}>
          {label}
        </label>
      )}
    </div>
  );
}

export default ToggleSlider;
