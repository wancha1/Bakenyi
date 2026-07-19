import React from 'react';
import { AlertCircle, CheckCircle2, Search, X } from 'lucide-react';

interface InputHelperProps {
  error?: string;
  success?: string;
  description?: string;
}

const FormFieldHelper: React.FC<InputHelperProps> = ({ error, success, description }) => {
  if (error) {
    return (
      <span className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-slide-up">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{error}</span>
      </span>
    );
  }
  if (success) {
    return (
      <span className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-slide-up">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{success}</span>
      </span>
    );
  }
  if (description) {
    return (
      <span className="block mt-1.5 text-[10px] text-heritage-brown/40 dark:text-heritage-brown/30 font-semibold tracking-wider uppercase leading-relaxed">
        {description}
      </span>
    );
  }
  return null;
};

// ==========================================
// 1. REGULAR INPUT COMPONENT
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  floating?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      success,
      description,
      leftIcon,
      rightIcon,
      floating = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    // Build borders depending on success/error/focus states
    const borderClasses = error
      ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/10'
      : success
      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500/10'
      : 'border-heritage-brown/15 dark:border-white/15 focus:border-heritage-terracotta focus:ring-heritage-terracotta/20';

    const inputBase = 'w-full px-4 py-3 text-xs md:text-sm font-medium bg-heritage-cream/35 dark:bg-black/10 rounded-xl outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:bg-heritage-brown/5';
    const paddingLeft = leftIcon ? 'pl-11' : '';
    const paddingRight = rightIcon ? 'pr-11' : '';

    if (floating) {
      return (
        <div className="relative w-full group">
          <div className="relative">
            {leftIcon && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 dark:text-white/40 group-focus-within:text-heritage-terracotta transition-colors z-10">
                {leftIcon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              disabled={disabled}
              placeholder=" " // Required for CSS peer-placeholder-shown selectors
              className={`${inputBase} ${paddingLeft} ${paddingRight} pt-6 pb-2 peer ${borderClasses} ${className}`}
              {...props}
            />
            <label
              htmlFor={inputId}
              className={`absolute top-2 left-4 text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 dark:text-white/30 transition-all duration-300 pointer-events-none origin-[0]
                peer-placeholder-shown:text-xs peer-placeholder-shown:font-bold peer-placeholder-shown:top-4 peer-placeholder-shown:uppercase
                peer-focus:text-[9px] peer-focus:font-black peer-focus:top-2 peer-focus:text-heritage-terracotta
                ${leftIcon ? 'peer-placeholder-shown:left-11 peer-focus:left-4' : ''}`}
            >
              {label}
            </label>
            {rightIcon && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 dark:text-white/40">
                {rightIcon}
              </span>
            )}
          </div>
          <FormFieldHelper error={error} success={success} description={description} />
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-white/60 mb-2 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 dark:text-white/40">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${inputBase} ${paddingLeft} ${paddingRight} ${borderClasses} ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 dark:text-white/40">
              {rightIcon}
            </span>
          )}
        </div>
        <FormFieldHelper error={error} success={success} description={description} />
      </div>
    );
  }
);

Input.displayName = 'Input';

// ==========================================
// 2. TEXTAREA COMPONENT
// ==========================================
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, success, description, disabled, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    const borderClasses = error
      ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/10'
      : success
      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500/10'
      : 'border-heritage-brown/15 dark:border-white/15 focus:border-heritage-terracotta focus:ring-heritage-terracotta/20';

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-white/60 mb-2 select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={`w-full px-4 py-3.5 text-xs md:text-sm font-medium bg-heritage-cream/35 dark:bg-black/10 rounded-xl outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:bg-heritage-brown/5 leading-relaxed ${borderClasses} ${className}`}
          {...props}
        />
        <FormFieldHelper error={error} success={success} description={description} />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ==========================================
// 3. SELECT DROP-DOWN COMPONENT
// ==========================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, success, description, options, disabled, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    const borderClasses = error
      ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/10'
      : success
      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500/10'
      : 'border-heritage-brown/15 dark:border-white/15 focus:border-heritage-terracotta focus:ring-heritage-terracotta/20';

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-white/60 mb-2 select-none"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full px-4 py-3.5 text-xs md:text-sm font-bold bg-heritage-cream/35 dark:bg-black/10 rounded-xl outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:bg-heritage-brown/5 text-heritage-ink ${borderClasses} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-stone-900 text-heritage-ink">
              {opt.label}
            </option>
          ))}
        </select>
        <FormFieldHelper error={error} success={success} description={description} />
      </div>
    );
  }
);

Select.displayName = 'Select';

// ==========================================
// 4. CUSTOM REUSABLE CHECKBOX
// ==========================================
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string | React.ReactNode;
  error?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, description, disabled, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="flex items-start gap-3 cursor-pointer group select-none">
          <div className="relative flex items-center h-5 mt-0.5 shrink-0">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              disabled={disabled}
              className="peer sr-only"
              {...props}
            />
            <div className={`w-5 h-5 rounded-md border-2 border-heritage-brown/25 dark:border-white/20 transition-all duration-300 flex items-center justify-center bg-white dark:bg-stone-900
              peer-checked:bg-heritage-terracotta peer-checked:border-transparent peer-focus:ring-4 peer-focus:ring-heritage-terracotta/20 group-hover:border-heritage-terracotta
              ${disabled ? 'opacity-50' : ''}`}
            >
              {/* Checkmark icon */}
              <svg
                className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs md:text-sm font-medium text-heritage-ink/80 group-hover:text-heritage-ink ${disabled ? 'opacity-50' : ''}`}>
              {label}
            </span>
            {description && (
              <span className="text-[10px] text-heritage-brown/40 dark:text-heritage-brown/30 uppercase font-black tracking-wider mt-0.5">
                {description}
              </span>
            )}
          </div>
        </label>
        {error && (
          <span className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ==========================================
// 5. SEARCH BOX WITH INTEGRATED CONTROLS
// ==========================================
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  value: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', onClear, value, disabled, id, ...props }, ref) => {
    const searchId = id || `search-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="relative w-full group shadow-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage-terracotta w-5 h-5 group-focus-within:scale-110 transition-transform duration-300 shrink-0" />
        <input
          ref={ref}
          id={searchId}
          type="text"
          value={value}
          disabled={disabled}
          className={`w-full pl-12 pr-11 py-4 rounded-full bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-white/10 focus:border-heritage-terracotta focus:ring-4 focus:ring-heritage-terracotta/10 focus:outline-none text-heritage-ink transition-all font-medium text-xs md:text-sm ${className}`}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-heritage-brown/30 hover:text-heritage-terracotta hover:bg-heritage-brown/5 rounded-full transition-all cursor-pointer shrink-0"
            title="Clear Search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ==========================================
// 6. TOGGLE SWITCH COMPONENT
// ==========================================
export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', label, error, description, disabled, id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="flex flex-col">
        <label htmlFor={switchId} className="flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative">
            <input
              ref={ref}
              id={switchId}
              type="checkbox"
              disabled={disabled}
              className="peer sr-only"
              {...props}
            />
            {/* Track */}
            <div className={`w-10 h-6 bg-heritage-brown/15 dark:bg-white/15 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-heritage-terracotta/20 rounded-full transition-all duration-300 peer-checked:bg-heritage-terracotta ${disabled ? 'opacity-50' : ''}`} />
            {/* Thumb */}
            <div className={`absolute left-0.5 top-0.5 bg-white dark:bg-stone-900 w-5 h-5 rounded-full transition-all duration-300 shadow-sm peer-checked:translate-x-4 ${disabled ? 'opacity-50' : ''}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-bold text-heritage-ink dark:text-heritage-cream">
              {label}
            </span>
            {description && (
              <span className="text-[9px] text-heritage-brown/40 dark:text-heritage-brown/30 uppercase font-black tracking-wider mt-0.5">
                {description}
              </span>
            )}
          </div>
        </label>
        {error && (
          <span className="text-[11px] font-bold text-rose-600 mt-1">{error}</span>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
