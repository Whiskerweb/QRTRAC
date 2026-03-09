import type { Transition, Variants } from 'framer-motion'

export const springSnappy: Transition = { type: 'spring', stiffness: 500, damping: 30 }
export const springSmooth: Transition = { type: 'spring', stiffness: 300, damping: 30 }
export const springGentle: Transition = { type: 'spring', stiffness: 200, damping: 24 }

export const buttonTap = { scale: 0.97 }
export const iconHover = { scale: 1.12 }

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
}

export const scalePop: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: springSnappy },
}

export const dropdownVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -4 },
    visible: { opacity: 1, scale: 1, y: 0, transition: springSnappy },
    exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } },
}

export const modalOverlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContentVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: springSmooth },
    exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
}

export const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04 } },
}

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
}

export const floatVariants: Variants = {
    float: {
        y: [0, -6, 0],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
}

export const checkmarkDraw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}
