'use client'

import { Check, CheckCircle2, Copy, Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
import { getContentTabClasses, type ContentTabVariant } from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { BankDetailsQRCode } from './BankDetailsQRCode'
import { formatBankAccountCopyText } from './normalizeBankDetails'
import type {
  BankDetailsDisplayMode,
  BankDetailsPanelPosition,
  BankDetailsTabStyle,
  BankDetailsTabWidth,
  ResolvedBankAccount,
  ResolvedBankDetailsLedgerText,
} from './types'

type CredentialCopyKey =
  'accountHolder' | 'accountNumber' | 'bankName' | 'branch' | 'ifscCode' | 'upiId'
type CopyKey = CredentialCopyKey | 'all'
type CopyState = {
  accountID: string
  key: CopyKey
  result: 'copied' | 'error'
} | null

export const resolveBankDetailsTabVariant = (
  value?: BankDetailsTabStyle | null,
): ContentTabVariant => {
  if (value === 'pills') return 'pill'
  if (value === 'boxed') return 'contained'
  return 'underline'
}

const tabRailWidthClasses = {
  centered: 'mx-auto w-max',
  content: 'w-max min-w-full',
  equal: 'w-full min-w-0',
} as const satisfies Record<BankDetailsTabWidth, string>

const tabFrameWidthClasses = {
  centered: 'mx-auto w-fit max-w-full',
  content: 'w-full',
  equal: 'w-full',
} as const satisfies Record<BankDetailsTabWidth, string>

const copyLabels = {
  accountHolder: {
    copied: 'Account holder copied.',
    copiedAria: 'Copied account holder',
    defaultAria: 'Copy account holder',
  },
  accountNumber: {
    copied: 'Account number copied.',
    copiedAria: 'Copied account number',
    defaultAria: 'Copy account number',
  },
  all: {
    copied: 'Bank details copied.',
    copiedAria: 'Copied all bank details',
    defaultAria: 'Copy all bank details',
  },
  bankName: {
    copied: 'Bank name copied.',
    copiedAria: 'Copied bank name',
    defaultAria: 'Copy bank name',
  },
  branch: {
    copied: 'Branch and account type copied.',
    copiedAria: 'Copied branch and account type',
    defaultAria: 'Copy branch and account type',
  },
  ifscCode: {
    copied: 'IFSC code copied.',
    copiedAria: 'Copied IFSC code',
    defaultAria: 'Copy IFSC code',
  },
  upiId: {
    copied: 'UPI ID copied.',
    copiedAria: 'Copied UPI ID',
    defaultAria: 'Copy UPI ID',
  },
} as const satisfies Record<CopyKey, { copied: string; copiedAria: string; defaultAria: string }>

type CopyControlProps = {
  copyKey: CopyKey
  onCopy: (copyKey: CopyKey, value: string) => Promise<void>
  state: CopyState
  value: string
  visibleLabel?: string
}

function CopyControl({ copyKey, onCopy, state, value, visibleLabel }: CopyControlProps) {
  const copied = state?.key === copyKey && state.result === 'copied'
  const labels = copyLabels[copyKey]
  const isCopyAll = copyKey === 'all'
  const accessibleLabel = copied
    ? labels.copiedAria
    : isCopyAll && visibleLabel
      ? visibleLabel
      : labels.defaultAria

  return (
    <Button
      aria-label={accessibleLabel}
      className={cn(
        'min-h-11 text-light-overlay-foreground lg:min-h-8',
        isCopyAll
          ? 'border-light-overlay-foreground/70 text-xs hover:border-light-overlay-foreground hover:bg-light-overlay-foreground/5'
          : 'min-w-11 hover:bg-light-overlay-foreground/10 hover:text-light-overlay-foreground lg:min-w-8',
      )}
      onClick={() => void onCopy(copyKey, value)}
      size={isCopyAll ? 'xs' : 'icon-sm'}
      type="button"
      variant={isCopyAll ? 'outline' : 'ghost'}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {isCopyAll ? (copied ? 'Copied' : visibleLabel) : null}
    </Button>
  )
}

type BankDetailsContextPanelProps = {
  account: ResolvedBankAccount
  displayMode: BankDetailsDisplayMode
  officialAccountLabel?: string
  panelDescription?: string
  panelPosition: BankDetailsPanelPosition
  panelTitle?: string
}

function BankDetailsContextPanel({
  account,
  displayMode,
  officialAccountLabel,
  panelDescription,
  panelPosition,
  panelTitle,
}: BankDetailsContextPanelProps) {
  const hasIntroduction = Boolean(officialAccountLabel || panelTitle || panelDescription)

  return (
    <div
      className={cn(
        'order-1 flex min-h-[22rem] min-w-0 flex-col bg-primary p-6 text-primary-foreground sm:p-8 lg:p-10',
        panelPosition === 'right' && 'lg:order-2',
      )}
      data-bank-details-context="true"
    >
      {hasIntroduction ? (
        <div className="flex flex-col gap-3">
          {officialAccountLabel ? (
            <SectionEyebrow data-bank-details-official-label="true" surface="brand">
              {officialAccountLabel}
            </SectionEyebrow>
          ) : null}
          {panelTitle ? (
            <h3
              className="max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl"
              data-bank-details-context-title="true"
            >
              {panelTitle}
            </h3>
          ) : null}
          {panelDescription ? (
            <p className="max-w-prose text-sm leading-6 text-current/80 sm:text-base">
              {panelDescription}
            </p>
          ) : null}
        </div>
      ) : null}

      {displayMode === 'scanner' ? (
        <div className={cn('flex flex-1 items-center justify-center', hasIntroduction && 'pt-8')}>
          <BankDetailsQRCode account={account} />
        </div>
      ) : account.instructions ? (
        <div
          className={hasIntroduction ? 'mt-8 sm:mt-10 lg:mt-auto lg:pt-10' : 'mt-auto'}
          data-bank-details-instructions="true"
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-compact border border-current/15 bg-current/5 p-4 text-sm leading-6 text-current/80">
            <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-current" />
            <p>{account.instructions}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

type BankDetailsLedgerProps = {
  account: ResolvedBankAccount
  copyState: CopyState
  ledgerText: ResolvedBankDetailsLedgerText
  onCopy: (copyKey: CopyKey, value: string) => Promise<void>
  panelPosition: BankDetailsPanelPosition
}

type DetailRow = {
  copyKey: CredentialCopyKey
  label: string
  mono?: boolean
  value: string
}

function BankDetailsLedger({
  account,
  copyState,
  ledgerText,
  onCopy,
  panelPosition,
}: BankDetailsLedgerProps) {
  const statusMessage =
    copyState?.result === 'error'
      ? 'Copy unavailable. Select and copy the value manually.'
      : copyState?.result === 'copied'
        ? copyLabels[copyState.key].copied
        : ''
  const detailRows: DetailRow[] = [
    {
      copyKey: 'accountHolder',
      label: ledgerText.accountHolderLabel,
      value: account.accountHolder,
    },
    {
      copyKey: 'accountNumber',
      label: ledgerText.accountNumberLabel,
      mono: true,
      value: account.accountNumber,
    },
  ]

  if (account.bankName) {
    detailRows.push({
      copyKey: 'bankName',
      label: ledgerText.bankNameLabel,
      value: account.bankName,
    })
  }

  detailRows.push({
    copyKey: 'ifscCode',
    label: ledgerText.ifscCodeLabel,
    mono: true,
    value: account.ifscCode,
  })

  if (account.branch) {
    detailRows.push({ copyKey: 'branch', label: ledgerText.branchLabel, value: account.branch })
  }

  if (account.upiId) {
    detailRows.push({
      copyKey: 'upiId',
      label: ledgerText.upiIdLabel,
      mono: true,
      value: account.upiId,
    })
  }

  return (
    <div
      className={cn(
        'order-2 flex min-h-[22rem] min-w-0 flex-col bg-white p-6 text-light-overlay-foreground sm:p-8 lg:p-10',
        panelPosition === 'right' && 'lg:order-1',
      )}
      data-bank-details-card="true"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6">
        <div>
          <SectionEyebrow
            className="tracking-[0.14em]"
            data-bank-details-purpose-label="true"
            surface="lightOverlay"
          >
            {account.purpose}
          </SectionEyebrow>
          <h3
            className="mt-2 font-[family-name:var(--font-text)] text-2xl font-bold tracking-[-0.025em] text-balance sm:text-3xl"
            data-bank-details-ledger-title="true"
          >
            {ledgerText.ledgerTitle}
          </h3>
        </div>
        <p
          className="inline-flex items-center gap-2 text-xs font-semibold text-current"
          data-section-eyebrow-surface="lightOverlay"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {ledgerText.verifiedLabel}
        </p>
      </div>

      <dl className="mt-6 grid sm:grid-cols-2 sm:gap-x-8">
        {detailRows.map((row) => (
          <div
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-light-overlay-foreground/15 py-5 first:pt-0"
            key={row.copyKey}
          >
            <div className="min-w-0">
              <dt
                className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-light-overlay-foreground/65"
              >
                {row.label}
              </dt>
              <dd
                className={cn(
                  'mt-2 min-w-0 font-semibold leading-6 break-words [overflow-wrap:anywhere]',
                  row.mono && 'font-mono tabular-nums',
                )}
              >
                {row.value}
              </dd>
            </div>
            <CopyControl
              copyKey={row.copyKey}
              onCopy={onCopy}
              state={copyState}
              value={row.value}
            />
          </div>
        ))}
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
        <p
          aria-live="polite"
          className="min-h-5 text-sm text-light-overlay-foreground/70"
          role="status"
        >
          {statusMessage}
        </p>
        <CopyControl
          copyKey="all"
          onCopy={onCopy}
          state={copyState}
          value={formatBankAccountCopyText(account)}
          visibleLabel={ledgerText.copyAllLabel}
        />
      </div>
    </div>
  )
}

type BankAccountPanelProps = {
  account: ResolvedBankAccount
  copyState: CopyState
  displayMode: BankDetailsDisplayMode
  ledgerText: ResolvedBankDetailsLedgerText
  officialAccountLabel?: string
  onCopy: (copyKey: CopyKey, value: string) => Promise<void>
  panelDescription?: string
  panelPosition: BankDetailsPanelPosition
  panelTitle?: string
}

function BankAccountPanel({
  account,
  copyState,
  displayMode,
  ledgerText,
  officialAccountLabel,
  onCopy,
  panelDescription,
  panelPosition,
  panelTitle,
}: BankAccountPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-border lg:grid',
        panelPosition === 'right'
          ? 'lg:grid-cols-[minmax(0,16fr)_minmax(0,9fr)]'
          : 'lg:grid-cols-[minmax(0,9fr)_minmax(0,16fr)]',
      )}
      data-bank-details-panel="true"
      data-panel-position={panelPosition}
    >
      <BankDetailsContextPanel
        account={account}
        displayMode={displayMode}
        officialAccountLabel={officialAccountLabel}
        panelDescription={panelDescription}
        panelPosition={panelPosition}
        panelTitle={panelTitle}
      />
      <BankDetailsLedger
        account={account}
        copyState={copyState}
        ledgerText={ledgerText}
        onCopy={onCopy}
        panelPosition={panelPosition}
      />
    </div>
  )
}

type BankDetailsClientProps = {
  accounts: ResolvedBankAccount[]
  displayMode: BankDetailsDisplayMode
  ledgerText: ResolvedBankDetailsLedgerText
  officialAccountLabel?: string
  panelDescription?: string
  panelPosition: BankDetailsPanelPosition
  panelTitle?: string
  sectionBackground?: BlockBackground | null
  tabStyle?: BankDetailsTabStyle | null
  tabWidth?: BankDetailsTabWidth | null
}

export function BankDetailsClient({
  accounts,
  displayMode,
  ledgerText,
  officialAccountLabel,
  panelDescription,
  panelPosition,
  panelTitle,
  sectionBackground,
  tabStyle,
  tabWidth,
}: BankDetailsClientProps) {
  const storedStyle = tabStyle === 'boxed' || tabStyle === 'pills' ? tabStyle : 'underline'
  const variant = resolveBankDetailsTabVariant(storedStyle)
  const tabSurface = resolveBlockSurface(sectionBackground)
  const resolvedTabWidth: BankDetailsTabWidth =
    tabWidth === 'centered' || tabWidth === 'equal' ? tabWidth : 'content'
  const [selectedAccountID, setSelectedAccountID] = useState(accounts[0]?.id ?? '')
  const [copyState, setCopyState] = useState<CopyState>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeAccountID = accounts.some(({ id }) => id === selectedAccountID)
    ? selectedAccountID
    : (accounts[0]?.id ?? '')

  const clearCopyState = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = null
    setCopyState(null)
  }

  useEffect(() => clearCopyState, [])

  if (accounts.length === 0) return null

  const copyValue = async (copyKey: CopyKey, value: string) => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.')

      await navigator.clipboard.writeText(value)
      setCopyState({ accountID: activeAccountID, key: copyKey, result: 'copied' })
      clearTimerRef.current = setTimeout(() => {
        setCopyState(null)
        clearTimerRef.current = null
      }, 2_000)
    } catch {
      clearTimerRef.current = null
      setCopyState({ accountID: activeAccountID, key: copyKey, result: 'error' })
    }
  }

  const renderPanel = (account: ResolvedBankAccount) => (
    <BankAccountPanel
      account={account}
      copyState={copyState?.accountID === account.id ? copyState : null}
      displayMode={displayMode}
      ledgerText={ledgerText}
      officialAccountLabel={officialAccountLabel}
      onCopy={copyValue}
      panelDescription={panelDescription}
      panelPosition={panelPosition}
      panelTitle={panelTitle}
    />
  )

  if (accounts.length === 1) {
    return <div data-bank-details-accounts="true">{renderPanel(accounts[0]!)}</div>
  }

  return (
    <TabsPrimitive.Root
      className="flex flex-col gap-6"
      data-bank-details-accounts="true"
      data-bank-details-tab-style={storedStyle}
      onValueChange={(value) => {
        clearCopyState()
        setSelectedAccountID(value)
      }}
      value={activeAccountID}
    >
      <div className="pb-1">
        <ScrollableContentTabRail
          className={tabFrameWidthClasses[resolvedTabWidth]}
          surface={tabSurface}
          variant={variant}
        >
          <TabsPrimitive.List
            aria-label="Payment purposes"
            className={cn('flex flex-nowrap', tabRailWidthClasses[resolvedTabWidth])}
            data-bank-details-tab-width={resolvedTabWidth}
            data-content-tab-variant={variant}
          >
            {accounts.map((account) => (
              <TabsPrimitive.Trigger
                className={cn(
                  getContentTabClasses(variant, account.id === activeAccountID, tabSurface),
                  resolvedTabWidth === 'equal' && 'w-0 min-w-0 flex-1 shrink truncate px-2',
                )}
                key={account.id}
                value={account.id}
              >
                {account.purpose}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </ScrollableContentTabRail>
      </div>
      {accounts.map((account) => (
        <TabsPrimitive.Content className="mt-0 outline-none" key={account.id} value={account.id}>
          {renderPanel(account)}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
