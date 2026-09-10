import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id
}) => {
  const switchId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      {(label || description) && (
        <div className="flex flex-col cursor-pointer select-none" onClick={() => !disabled && onChange(!checked)}>
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-walnut-200 cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-walnut-400 mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 focus:ring-offset-2 focus:ring-offset-walnut-950 disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? 'bg-brand-primary' : 'bg-walnut-800'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
