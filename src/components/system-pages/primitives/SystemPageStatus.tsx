export function SystemPageStatus({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={[
        'animate-[fade-in_.7s_ease-out_both] select-none font-semibold leading-none tracking-tight text-foreground/10',
        className ?? 'text-[clamp(4rem,15vw,7rem)]',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </div>
  )
}
