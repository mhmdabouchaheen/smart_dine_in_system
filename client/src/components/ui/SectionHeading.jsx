export default function SectionHeading({
  eyebrow,
  title,
  accent,
  align = 'left',
  description,
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="font-display text-4xl md:text-5xl leading-[1.05]">
        {title} {accent && <em className="text-ember not-italic font-medium italic">{accent}</em>}
      </h2>
      {description && (
        <p className="mt-4 max-w-md text-bone-dim text-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
