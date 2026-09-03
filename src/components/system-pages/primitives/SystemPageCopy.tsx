export function SystemPageCopy({
  description,
  descriptionClassName,
  heading,
  headingClassName,
}: {
  description?: string | null
  descriptionClassName?: string
  heading: string
  headingClassName?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1
        className={[
          'max-w-2xl animate-[fade-in_.7s_ease-out_.12s_both] text-balance text-[clamp(1.8rem,7vw,3.25rem)] font-semibold leading-[0.95] text-foreground',
          headingClassName ?? '',
        ]
          .join(' ')
          .trim()}
      >
        {heading}
      </h1>
      {description ? (
        <p
          className={[
            'max-w-2xl animate-[fade-in_.7s_ease-out_.2s_both] text-balance text-[clamp(1rem,1.6vw,1.125rem)] leading-7 text-muted-foreground',
            descriptionClassName ?? '',
          ]
            .join(' ')
            .trim()}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
