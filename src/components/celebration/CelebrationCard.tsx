'use client'

import { ArrowRight } from 'lucide-react'
import type { ElementType, PointerEvent, ReactNode } from 'react'

import type { CelebrationView } from '@/lib/celebrations/view'
import { cn } from '@/lib/utils'

import styles from './celebration.module.css'

type CelebrationCardProps = {
  /** Close control rendered inside the card (the Dialog close, or nothing in previews). */
  closeSlot?: ReactNode
  /** Element for the message, so dialogs can use their accessible Description. */
  Description?: ElementType
  /** Element for the heading, so dialogs can use their accessible Title. */
  Title?: ElementType
  view: CelebrationView
}

/** Width each style needs; the modal shell applies it so mobile stays within the viewport. */
export const CELEBRATION_WIDTHS: Record<CelebrationView['style'], number> = {
  aurora: 520,
  glass: 540,
  medallion: 520,
  poster: 460,
  ticket: 720,
}

const Heading = ({ Title, view }: { Title: ElementType; view: CelebrationView }) =>
  view.heading || view.accentHeading ? (
    <Title className={styles.heading}>
      {view.heading}
      {view.accentHeading ? (
        <>
          {view.heading ? ' ' : ''}
          <em className={styles.accent}>{view.accentHeading}</em>
        </>
      ) : null}
    </Title>
  ) : null

const Action = ({ view }: { view: CelebrationView }) =>
  view.action ? (
    <a
      className={styles.cta}
      download={view.action.download}
      href={view.action.href}
      rel={view.action.openInNewTab ? 'noopener noreferrer' : undefined}
      target={view.action.openInNewTab ? '_blank' : undefined}
    >
      {view.action.label}
      <ArrowRight aria-hidden="true" strokeWidth={2} />
    </a>
  ) : null

const Signature = ({ view }: { view: CelebrationView }) =>
  view.signature || view.signatureRole ? (
    <p className={styles.signature}>
      {view.signature}
      {view.signatureRole ? <small>{view.signatureRole}</small> : null}
    </p>
  ) : null

/* eslint-disable @next/next/no-img-element -- Media URLs are already sized; next/image would need fixed boxes per style. */
const Img = ({ className, view }: { className?: string; view: CelebrationView }) =>
  view.image ? (
    <img
      alt={view.image.alt}
      className={className}
      decoding="async"
      height={view.image.height}
      src={view.image.src}
      width={view.image.width}
    />
  ) : null
/* eslint-enable @next/next/no-img-element */

/** Holographic foil and 3D tilt follow the pointer on the Ticket style. */
const handleTicketPointer = (event: PointerEvent<HTMLDivElement>) => {
  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  target.style.setProperty('--ry', `${(x - 0.5) * 14}deg`)
  target.style.setProperty('--rx', `${(0.5 - y) * 10}deg`)
  target.style.setProperty('--mx', `${x * 100}%`)
  target.style.setProperty('--my', `${y * 100}%`)
  target.style.setProperty('--hx', `${x * 100}%`)
}

const resetTicketPointer = (event: PointerEvent<HTMLDivElement>) => {
  event.currentTarget.style.setProperty('--rx', '0deg')
  event.currentTarget.style.setProperty('--ry', '0deg')
}

export function CelebrationCard({
  closeSlot,
  Description = 'p',
  Title = 'h2',
  view,
}: CelebrationCardProps) {
  const message = view.message ? (
    <Description className={styles.message}>{view.message}</Description>
  ) : null

  // Image-only: every style shows the image in the poster frame.
  if (view.imageOnly && view.image) {
    return (
      <div
        className={cn(styles.root, styles.posterFrame, styles.poster)}
        data-celebration-style={view.style}
        data-celebration-image-only="true"
      >
        {closeSlot}
        <Title className="sr-only">{view.heading ?? view.image.alt}</Title>
        <Img className={styles.posterImage} view={view} />
        {view.action ? (
          <div className={styles.posterCaption}>
            <Action view={view} />
          </div>
        ) : null}
      </div>
    )
  }

  switch (view.style) {
    case 'ticket':
      return (
        <div className={cn(styles.root, styles.ticketWrap)} data-celebration-style="ticket">
          <div
            className={styles.ticket}
            onPointerLeave={resetTicketPointer}
            onPointerMove={handleTicketPointer}
          >
            {closeSlot}
            <div className={styles.ticketMain}>
              <Img className={styles.ticketImage} view={view} />
              {view.eyebrow ? <p className={styles.eyebrow}>{view.eyebrow}</p> : null}
              <Heading Title={Title} view={view} />
              {message}
              <Signature view={view} />
              <Action view={view} />
            </div>
            <div aria-hidden="true" className={styles.ticketStub}>
              <span className={styles.ticketYear}>ADMIT ONE</span>
              <div>
                <div className={styles.ticketDay}>{view.dateLabel.day}</div>
                <div className={styles.ticketMonth}>{view.dateLabel.month}</div>
              </div>
              <span className={styles.ticketCode} />
            </div>
          </div>
        </div>
      )

    case 'poster':
      return (
        <div
          className={cn(styles.root, styles.posterFrame, styles.poster)}
          data-celebration-style="poster"
        >
          {closeSlot}
          <Img className={styles.posterImage} view={view} />
          <div className={styles.posterCaption}>
            {view.eyebrow ? <p className={styles.eyebrow}>{view.eyebrow}</p> : null}
            <Heading Title={Title} view={view} />
            {message}
            <Action view={view} />
          </div>
        </div>
      )

    case 'glass':
      return (
        <div className={cn(styles.root, styles.glass)} data-celebration-style="glass">
          {closeSlot}
          <Img className={styles.glassImage} view={view} />
          {view.eyebrow ? <p className={styles.eyebrow}>{view.eyebrow}</p> : null}
          <Heading Title={Title} view={view} />
          {message}
          <Signature view={view} />
          <Action view={view} />
        </div>
      )

    case 'medallion':
      return (
        <div className={cn(styles.root, styles.medallion)} data-celebration-style="medallion">
          <span aria-hidden="true" className={styles.medallionTicks} />
          <span aria-hidden="true" className={styles.medallionRing} />
          {closeSlot}
          <div className={styles.medallionInner}>
            {view.eyebrow ? <p className={styles.eyebrow}>{view.eyebrow}</p> : null}
            {view.highlight ? (
              <div className={styles.medallionHighlight}>{view.highlight}</div>
            ) : null}
            <Heading Title={Title} view={view} />
            {message}
            <Action view={view} />
          </div>
        </div>
      )

    case 'aurora':
    default:
      return (
        <div className={cn(styles.root, styles.aurora)} data-celebration-style="aurora">
          <div className={styles.auroraInner}>
            {closeSlot}
            {view.image ? (
              <div className={styles.auroraPortrait}>
                <span aria-hidden="true" className={styles.auroraOrbit} />
                <Img view={view} />
              </div>
            ) : null}
            {view.eyebrow ? <p className={styles.eyebrow}>{view.eyebrow}</p> : null}
            <Heading Title={Title} view={view} />
            {message}
            <Signature view={view} />
            <Action view={view} />
            <p className={styles.auroraDate}>
              {view.dateLabel.day} · {view.dateLabel.month} · {view.dateLabel.year}
            </p>
          </div>
        </div>
      )
  }
}
