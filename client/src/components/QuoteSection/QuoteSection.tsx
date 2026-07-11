export default function QuoteSection() {
  return (
    <section id="kitchen" className="grid md:grid-cols-2 min-h-[420px]">
      <div className="relative bg-noir-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517705600644-9a3455ec9a55?q=80&w=1200&auto=format&fit=crop"
          alt="Live coals and smoke"
          className="w-full h-full object-cover grayscale contrast-125 opacity-80"
        />
      </div>
      <div className="flex flex-col justify-center px-8 md:px-16 py-16 bg-noir-950">
        <blockquote className="font-display italic text-3xl md:text-4xl leading-tight max-w-lg">
          &ldquo;We don&rsquo;t just cook with fire; we negotiate with it.&rdquo;
        </blockquote>
        <p className="eyebrow mt-8">&mdash; Chef Marcus Thorne</p>
      </div>
    </section>
  )
}
