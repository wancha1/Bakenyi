import React from 'react';
import { motion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'heritage' | 'stats' | 'interactive' | 'glass';
  hoverEffect?: boolean;
  accentBorder?: boolean | 'always' | 'hover';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      variant = 'default',
      hoverEffect = true,
      accentBorder = 'hover',
      id,
      ...props
    },
    ref
  ) => {
    // Determine card background, border, shadow styles
    const styles = {
      default: 'bg-white border border-heritage-brown/10 dark:border-white/10 rounded-[24px] overflow-hidden',
      heritage: 'bg-white border border-heritage-brown/8 rounded-[28px] overflow-hidden shadow-xs relative',
      stats: 'bg-white border border-heritage-brown/10 dark:border-white/10 rounded-2xl p-6 shadow-xs',
      interactive: 'bg-white border border-heritage-brown/10 dark:border-white/10 rounded-3xl overflow-hidden cursor-pointer',
      glass: 'glass-panel rounded-[32px] overflow-hidden shadow-sm relative',
    };

    const hoverClass = hoverEffect && variant !== 'stats'
      ? 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-heritage-terracotta/25 hover:shadow-[0_20px_35px_-10px_rgba(86,61,45,0.08),0_10px_20px_-5px_rgba(188,108,37,0.03)]'
      : '';

    const hasAccent = accentBorder === 'always' || (accentBorder === 'hover' && hoverEffect);

    const accentBar = hasAccent ? (
      <span 
        className={`absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-heritage-terracotta to-heritage-sand transition-opacity duration-300 z-10 ${
          accentBorder === 'hover' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`} 
      />
    ) : null;

    const computedId = id || `card-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div
        ref={ref}
        id={computedId}
        className={`group relative ${styles[variant]} ${hoverClass} ${className}`}
        {...props}
      >
        {accentBar}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 sm:p-8 border-b border-heritage-brown/5 dark:border-white/5 ${className}`} {...props}>
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

// Card Title
export const CardTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-xl sm:text-2xl font-serif font-bold text-heritage-brown dark:text-heritage-brown leading-tight tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);
CardTitle.displayName = 'CardTitle';

// Card Description
export const CardDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-xs text-heritage-brown/50 dark:text-heritage-brown/40 font-bold uppercase tracking-widest mt-1.5 ${className}`} {...props}>
    {children}
  </p>
);
CardDescription.displayName = 'CardDescription';

// Card Content
export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 sm:p-8 leading-relaxed text-sm text-heritage-ink/80 ${className}`} {...props}>
    {children}
  </div>
);
CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 sm:p-8 border-t border-heritage-brown/5 dark:border-white/5 bg-heritage-cream/10 dark:bg-black/5 flex items-center justify-between gap-4 ${className}`} {...props}>
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';
