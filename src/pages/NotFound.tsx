import { ArrowLeft, Compass } from "lucide-react"
import { Link } from "react-router"
import { motion } from "motion/react"

export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100svh-2rem)] flex-col items-center justify-center overflow-hidden bg-[#fbfaf8] px-5 py-16 text-[#1a0b15]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-5 border border-[#1a0b15]/10 sm:inset-8"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(12rem,38vw,34rem)] leading-none font-black text-[#1a0b15]/[0.025] select-none"
      >
        404
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 flex max-w-xl flex-col items-center text-center"
      >
        <span className="mb-7 flex size-14 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 text-[#8a6c14]">
          <Compass aria-hidden="true" className="size-6" />
        </span>
        <p className="text-xs font-bold tracking-[0.22em] text-[#8a6c14] uppercase">
          Page not found
        </p>
        <h1 className="mt-4 text-7xl leading-none font-black sm:text-8xl">
          404
        </h1>
        <p className="mt-5 text-xl font-bold sm:text-2xl">
          Looks like this page took a wrong turn.
        </p>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-[#1a0b15]/65">
          The link may be outdated, or the page may have moved. Head back to the
          shop and find something good.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1a0b15] px-6 text-sm font-bold text-white transition-colors hover:bg-[#38172d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to the shop
        </Link>
      </motion.section>

      <span className="absolute right-8 bottom-8 hidden text-xs font-semibold tracking-[0.16em] text-[#1a0b15]/40 uppercase sm:block">
        Power Zenox
      </span>
    </main>
  )
}
