import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animateHover?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      animateHover = true,
      disabled,
      type = 'button',
      id,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest text-xs transition-all duration-300 rounded-2xl cursor-pointer outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-98';

    // Variant styles
    const variants = {
      primary: 'bg-heritage-terracotta text-white hover:bg-heritage-brown hover:shadow-[0_12px_24px_-8px_rgba(188,108,37,0.35)] focus:ring-heritage-terracotta/25 border border-transparent',
      secondary: 'bg-heritage-olive text-white hover:bg-heritage-brown hover:shadow-[0_12px_24px_-8px_rgba(96,108,56,0.35)] focus:ring-heritage-olive/25 border border-transparent',
      outline: 'border-2 border-heritage-brown/20 text-heritage-brown dark:text-heritage-cream dark:border-heritage-cream/20 hover:bg-heritage-brown hover:text-white dark:hover:bg-heritage-cream dark:hover:text-heritage-ink hover:border-transparent focus:ring-heritage-brown/15',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-[0_12px_24px_-8px_rgba(225,29,72,0.35)] focus:ring-rose-500/25 border border-transparent',
      ghost: 'text-heritage-brown/80 dark:text-heritage-cream/80 hover:bg-heritage-brown/5 dark:hover:bg-white/5 hover:text-heritage-brown dark:hover:text-white focus:ring-heritage-brown/10 border border-transparent',
      icon: 'p-3 bg-heritage-cream dark:bg-stone-900 text-heritage-brown dark:text-heritage-cream border border-heritage-brown/10 dark:border-white/10 hover:border-heritage-terracotta hover:text-heritage-terracotta hover:shadow-md rounded-full focus:ring-heritage-terracotta/20',
    };

    // Size styles
    const sizes = {
      sm: variant === 'icon' ? 'p-2' : 'px-4 py-2 text-[10px] rounded-xl',
      md: variant === 'icon' ? 'p-3' : 'px-6 py-3.5 text-xs',
      lg: variant === 'icon' ? 'p-4' : 'px-8 py-4.5 text-xs tracking-wider',
    };

    // Construct class name
    const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    const content = (
      <>
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" aria-hidden="true" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex items-center shrink-0">{rightIcon}</span>
        )}
      </>
    );

    // Render with Framer Motion if animation is enabled
    if (animateHover && !disabled && !isLoading) {
      return (
        <motion.button
          ref={ref}
          id={id || `btn-${Math.random().toString(36).substring(2, 9)}`}
          type={type}
          className={buttonClasses}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={disabled || isLoading}
          {...props}
        >
          {content}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        id={id || `btn-${Math.random().toString(36).substring(2, 9)}`}
        type={type}
        className={buttonClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
