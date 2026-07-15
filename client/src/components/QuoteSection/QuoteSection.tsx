import coal from '../../../assets/coal.jpg'

export default function QuoteSection() {
  return (
    <section id="kitchen" className="grid md:grid-cols-2 min-h-[420px]">
      <div className="relative bg-noir-900 overflow-hidden">
        <img
          src={coal}
          alt="Live coals and smoke"
          className="
            w-full
            h-full
            object-cover
            grayscale
            hover:grayscale-0
            contrast-125
            opacity-80
            transition-all
            duration-700
            ease-in-out
          "
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