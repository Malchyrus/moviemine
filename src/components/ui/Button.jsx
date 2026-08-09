import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-white text-neutral-950 hover:bg-neutral-200 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(255,255,255,0.15)]',
  ghost: 'bg-transparent text-neutral-200 hover:bg-white/10 border border-white/10',
  outline:
    'bg-white/5 text-neutral-100 border border-white/10 hover:bg-white/10 backdrop-blur',
  danger:
    'bg-red-500/90 text-white hover:bg-red-500 shadow-[0_8px_30px_rgba(239,68,68,0.3)]',
  accent:
    'bg-gradient-to-r from-cyan-500 to-sky-500 text-white hover:from-cyan-400 hover:to-sky-400 shadow-[0_8px_30px_rgba(34,211,238,0.35)]',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2',
  icon: 'h-10 w-10',
}

const Button = forwardRef(function Button(
  { className = '', variant = 'primary', size = 'md', as = 'button', children, ...props },
  ref,
) {
  const Component = motion[as]
  return (
    <Component
      ref={ref}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={`inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
})

export default Button
