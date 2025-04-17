"use client"
import { useRef, useEffect, useState } from "react"
import { motion, useInView, useAnimation } from "framer-motion"

export default function AnimatedSection({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isInView && !hasAnimated) {
      controls.start("visible")
      setHasAnimated(true)
    }
  }, [isInView, controls, hasAnimated])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            delay: delay,
            ease: "easeOut",
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}