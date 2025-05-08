import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

const Input: React.FC<InputProps> = ({ 
  id, 
  label, 
  className = "", 
  type = "text",
  disabled,
  required,
  ...props 
}) => {
  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium"
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        disabled={disabled}
        className={`
          w-full 
          px-3 
          py-2 
          border 
          border-gray-300 
          rounded-md 
          shadow-sm 
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-500 
          focus:border-blue-500
          disabled:opacity-70
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          ${className}
        `}
        required={required}
        {...props}
      />
    </div>
  );
};

export default Input; 