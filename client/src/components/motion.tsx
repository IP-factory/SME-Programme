/**
 * Shared motion for the public site. One easing curve and a few patterns, so the site moves the
 * same way everywhere. Everything respects the visitor's "reduce motion" setting (MotionConfig
 * in App.tsx).
 */
import { motion, useScroll, useSpring, type HTMLMotionProps, type Variants } from "framer-motion";
import React from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ delay = 0, y = 24, className, children, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** A list whose items arrive one after another when it scrolls into view. */
export function Stagger({ as = "div", className, children }: { as?: "div" | "ul" | "ol"; className?: string; children: React.ReactNode }) {
  const Component = motion[as];
  return (
    <Component className={className} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </Component>
  );
}

/** Thin bar along the top of the page showing how far the visitor has read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-plum via-highlight-ink to-highlight" style={{ scaleX }} />;
}
