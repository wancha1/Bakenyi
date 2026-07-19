import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

// ==========================================
// 1. FADE IN ANIMATION CONTAINER
// ==========================================
interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
  direction?: 'none' | 'up' | 'down' | 'left' | 'right';
  distance?: number;
  viewportOnce?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 16,
  viewportOnce = true,
  ...props
}) => {
  const directions = {
    none: { x: 0, y: 0 },
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: viewportOnce, margin: '-40px' }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1], // Custom premium easeOutExpo
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 2. LIST STAGGER WRAPPERS
// ==========================================
interface ListStaggerProps extends HTMLMotionProps<'div'> {
  staggerChildren?: number;
  delayChildren?: number;
  viewportOnce?: boolean;
}

export const ListStagger: React.FC<ListStaggerProps> = ({
  children,
  className = '',
  staggerChildren = 0.08,
  delayChildren = 0,
  viewportOnce = true,
  ...props
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, margin: '-20px' }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerChildren,
            delayChildren: delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface ListItemProps extends HTMLMotionProps<'div'> {
  distance?: number;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  className = '',
  distance = 12,
  ...props
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: distance },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring', damping: 20, stiffness: 220 },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 3. HOVER SCALE INTERACTIVE BOX
// ==========================================
interface HoverScaleProps extends HTMLMotionProps<'div'> {
  scale?: number;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  className = '',
  scale = 1.02,
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ scale: scale, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
