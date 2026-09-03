import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Field, SelectField, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BankDetailsBlockComponent } from '@/blocks/BankDetails/Component'
import { BankDetailsBlock, validateBankAccounts } from '@/blocks/BankDetails/config'
import {
  bankDetailsLedgerTextDefaults,
  formatBankAccountCopyText,
  normalizeBankAccounts,
  normalizeBankDetailsLedgerText,
} from '@/blocks/BankDetails/normalizeBankDetails'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const found = findNamedField(tab.fields, name)
        if (found) return found
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const found = findNamedField(field.fields, name)
      if (found) return found
    }
  }
}

const findOwningTabLabel = (fields: Field[], name: string): string | undefined => {
  for (const field of fields) {
    if (field.type !== 'tabs') continue

    for (const tab of field.tabs) {
      if (findNamedField(tab.fields, name)) {
        return typeof tab.label === 'string' ? tab.label : undefined
      }
    }
  }
}

const admissionsAccount = {
  id: 'admissions',
  purpose: 'Admissions',
  accountHolder: 'SHREE NARAYAN FOUNDATION',
  accountNumber: '50100411312877',
  ifscCode: 'HDFC0007592',
  bankName: 'HDFC Bank',
  branch: 'LEE ROAD (KOLKATA)',
  instructions: 'Mention the applicant name and course in the transfer reference.',
  upiId: 'snmih.admissions@sbi',
}

const hostelAccount = {
  id: 'hostel',
  purpose: 'Hostel',
  accountHolder: 'SHREE NARAYAN FOUNDATION HOSTEL',
  accountNumber: '5010 0411 39999',
  ifscCode: 'HDFC 000 7592',
  bankName: 'HDFC Bank',
  branch: 'SALT LAKE (KOLKATA)',
}

describe('Bank Details normalization', () => {
  it('resolves complete ledger copy defaults and trims safe per-field overrides', () => {
    expect(normalizeBankDetailsLedgerText()).toEqual(bankDetailsLedgerTextDefaults)
    expect(
      normalizeBankDetailsLedgerText({
        accountHolderLabel: ' Holder name ',
        ledgerTitle: ' Transfer Account ',
        verifiedLabel: ' ',
      }),
    ).toEqual({
      ...bankDetailsLedgerTextDefaults,
      accountHolderLabel: 'Holder name',
      ledgerTitle: 'Transfer Account',
    })
    expect(normalizeBankDetailsLedgerText('legacy-value')).toEqual(
      bankDetailsLedgerTextDefaults,
    )
    expect(normalizeBankDetailsLedgerText({ ledgerTitle: 42 })).toEqual(
      bankDetailsLedgerTextDefaults,
    )
  })

  it('requires only core transfer fields and preserves optional values in source order', () => {
    expect(
      normalizeBankAccounts([
        {
          ...admissionsAccount,
          id: ' ',
          purpose: ' Admissions ',
          accountNumber: ' 5010  0411-312877 ',
          ifscCode: ' HDFC 0007592 ',
          instructions: ' Transfer from your registered account. ',
        },
        { ...hostelAccount, purpose: ' admissions ' },
        hostelAccount,
        { ...hostelAccount, purpose: 'Incomplete', ifscCode: ' ' },
        {
          accountHolder: 'MINIMUM ACCOUNT',
          accountNumber: '0001',
          ifscCode: 'MINI000001',
          purpose: 'Minimum',
        },
      ]),
    ).toEqual([
      {
        accountHolder: admissionsAccount.accountHolder,
        accountNumber: '5010  0411-312877',
        bankName: admissionsAccount.bankName,
        branch: admissionsAccount.branch,
        id: 'bank-account-1',
        ifscCode: 'HDFC 0007592',
        instructions: 'Transfer from your registered account.',
        purpose: 'Admissions',
        upiId: admissionsAccount.upiId,
      },
      hostelAccount,
      {
        accountHolder: 'MINIMUM ACCOUNT',
        accountNumber: '0001',
        id: 'bank-account-5',
        ifscCode: 'MINI000001',
        purpose: 'Minimum',
      },
    ])
  })

  it('formats one canonical Copy All and QR payload with optional lines only when present', () => {
    const [account] = normalizeBankAccounts([admissionsAccount])

    expect(account && formatBankAccountCopyText(account)).toBe(
      [
        'Account holder: SHREE NARAYAN FOUNDATION',
        'Account number: 50100411312877',
        'IFSC code: HDFC0007592',
        'Bank: HDFC Bank',
        'Branch & type: LEE ROAD (KOLKATA)',
        'UPI ID: snmih.admissions@sbi',
      ].join('\n'),
    )

    const [minimum] = normalizeBankAccounts([
      {
        accountHolder: 'MINIMUM ACCOUNT',
        accountNumber: '0001',
        ifscCode: 'MINI000001',
        purpose: 'Minimum',
      },
    ])

    expect(minimum && formatBankAccountCopyText(minimum)).toBe(
      [
        'Account holder: MINIMUM ACCOUNT',
        'Account number: 0001',
        'IFSC code: MINI000001',
      ].join('\n'),
    )
    expect(account && formatBankAccountCopyText(account)).not.toContain('Payment purpose:')
  })
})

describe('BankDetailsBlock schema', () => {
  it('defines the approved block identity, fields, limits, and collapsed purpose labels', () => {
    expect(BankDetailsBlock).toMatchObject({
      slug: 'bankDetails',
      interfaceName: 'BankDetailsBlock',
      labels: { singular: 'Bank Details', plural: 'Bank Details' },
    })
    expect(BankDetailsBlock.admin?.images?.thumbnail).toEqual({
      alt: 'Bank Details block preview',
      url: '/block-thumbnails/bank-details.jpg',
    })

    const tabs = BankDetailsBlock.fields[0] as TabsField
    const accounts = findNamedField(BankDetailsBlock.fields, 'accounts')

    expect(tabs.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(accounts).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: { RowLabel: expect.stringContaining('RowLabel#BankAccountRowLabel') },
      },
    })
    expect(findNamedField(BankDetailsBlock.fields, 'officialAccountLabel')).toMatchObject({
      defaultValue: 'Official college account',
    })
    expect(findNamedField(BankDetailsBlock.fields, 'panelTitle')).toMatchObject({
      defaultValue: 'Bank transfer details',
    })
    expect(findNamedField(BankDetailsBlock.fields, 'panelTitle')).not.toHaveProperty('required', true)
    expect(findNamedField(BankDetailsBlock.fields, 'panelDescription')).toMatchObject({
      type: 'textarea',
    })
    expect(findNamedField(BankDetailsBlock.fields, 'ledgerText')).toMatchObject({
      label: 'Ledger Text',
      type: 'group',
    })
    expect(findOwningTabLabel(BankDetailsBlock.fields, 'ledgerText')).toBe('Content')
    expect(findNamedField(BankDetailsBlock.fields, 'purposeSuffix')).toBeUndefined()
    const ledgerTextDefaults = {
      ledgerTitle: 'Bank Account Information',
      verifiedLabel: 'Verified',
      accountHolderLabel: 'Account Holder',
      accountNumberLabel: 'Account Number',
      bankNameLabel: 'Bank Name',
      ifscCodeLabel: 'IFSC Code',
      branchLabel: 'Branch & Type',
      upiIdLabel: 'UPI ID',
      copyAllLabel: 'Copy all details',
    }
    for (const [fieldName, defaultValue] of Object.entries(ledgerTextDefaults)) {
      expect(findNamedField(BankDetailsBlock.fields, fieldName)).toMatchObject({ defaultValue })
      expect(findNamedField(BankDetailsBlock.fields, fieldName)).not.toHaveProperty(
        'required',
        true,
      )
    }
    expect(findNamedField(BankDetailsBlock.fields, 'displayMode')).toMatchObject({
      defaultValue: 'text',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Scanner', value: 'scanner' },
      ],
      type: 'select',
    })
    expect(findNamedField(BankDetailsBlock.fields, 'panelPosition')).toMatchObject({
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      type: 'select',
    })
    expect(findOwningTabLabel(BankDetailsBlock.fields, 'displayMode')).toBe('Theme Settings')
    expect(findOwningTabLabel(BankDetailsBlock.fields, 'panelPosition')).toBe('Theme Settings')
    expect(findOwningTabLabel(BankDetailsBlock.fields, 'panelTitle')).toBe('Content')
    for (const fieldName of ['purpose', 'accountHolder', 'accountNumber', 'ifscCode']) {
      expect(findNamedField(BankDetailsBlock.fields, fieldName)).toMatchObject({ required: true })
    }
    for (const fieldName of ['bankName', 'branch', 'upiId']) {
      expect(findNamedField(BankDetailsBlock.fields, fieldName)).not.toHaveProperty('required', true)
    }
    expect(findNamedField(BankDetailsBlock.fields, 'footerActions')).toMatchObject({
      type: 'array',
      maxRows: 2,
    })
  })

  it('shows tab controls only for multiple saved accounts and validates duplicate purposes', async () => {
    const tabStyle = findNamedField(BankDetailsBlock.fields, 'tabStyle') as SelectField
    const tabWidth = findNamedField(BankDetailsBlock.fields, 'tabWidth') as SelectField

    expect(tabStyle).toMatchObject({ defaultValue: 'underline', required: true })
    expect(tabWidth).toMatchObject({ defaultValue: 'content', required: true })
    expect(tabStyle.admin?.condition?.({}, { accounts: [admissionsAccount] }, {} as never)).toBe(
      false,
    )
    expect(
      tabStyle.admin?.condition?.(
        {},
        { accounts: [admissionsAccount, hostelAccount] },
        {} as never,
      ),
    ).toBe(true)
    expect(tabWidth.admin?.condition?.({}, { accounts: [admissionsAccount] }, {} as never)).toBe(
      false,
    )
    expect(
      await validateBankAccounts(
        [{ purpose: 'Admissions' }, { purpose: ' admissions ' }],
        {} as never,
      ),
    ).toBe('Bank account 2 duplicates an earlier payment purpose.')
  })
})

describe('BankDetailsBlockComponent', () => {
  it('returns no visitor markup when there are no valid accounts', () => {
    expect(
      renderToStaticMarkup(
        <BankDetailsBlockComponent accounts={[{ ...admissionsAccount, accountNumber: ' ' }]} />,
      ),
    ).toBe('')
  })

  it('renders Text mode without tabs in the approved responsive 36/64 panel', () => {
    const { container } = render(
      <BankDetailsBlockComponent
        accounts={[admissionsAccount]}
        displayMode="text"
        officialAccountLabel="Official college account"
        panelDescription="Use this account for admissions payments."
        panelPosition="left"
        panelTitle="Bank transfer details"
        title="Payment Information"
      />,
    )

    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByText('Official college account')).toBeTruthy()
    expect(screen.getByText('Use this account for admissions payments.')).toBeTruthy()
    expect(screen.getByText('Payment Information')).toBeTruthy()
    expect(screen.getByText(admissionsAccount.instructions)).toBeTruthy()
    expect(screen.getByText('Bank Account Information')).toBeTruthy()
    expect(screen.getByText('Verified')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy UPI ID' })).toBeTruthy()
    expect(screen.queryByText('Scanner mode')).toBeNull()
    expect(screen.queryByText('Text mode')).toBeNull()
    expect(screen.getByText('Account Holder').closest('dl')).toBeTruthy()
    expect(screen.getByText(admissionsAccount.accountNumber).className).toContain('font-mono')
    expect(screen.getByText(admissionsAccount.ifscCode).className).toContain('tabular-nums')

    const frame = container.querySelector('[data-bank-details-panel="true"]')
    const primary = container.querySelector('[data-bank-details-context="true"]')
    const card = container.querySelector('[data-bank-details-card="true"]')
    const contextTitle = container.querySelector('[data-bank-details-context-title="true"]')
    const ledgerTitle = container.querySelector('[data-bank-details-ledger-title="true"]')
    const officialLabel = container.querySelector('[data-bank-details-official-label="true"]')
    const purposeLabel = container.querySelector('[data-bank-details-purpose-label="true"]')
    const detailLabel = screen.getByText('Account Holder')
    const detailRow = detailLabel.closest('[class*="border-b"]')
    const instructions = container.querySelector('[data-bank-details-instructions="true"]')
    const rowCopyControl = screen.getByRole('button', { name: 'Copy account holder' })
    const copyAllControl = screen.getByRole('button', { name: 'Copy all details' })

    expect(frame?.className).toContain('rounded-card')
    expect(frame?.className).toContain('lg:grid-cols-[minmax(0,9fr)_minmax(0,16fr)]')
    expect(frame?.getAttribute('data-panel-position')).toBe('left')
    expect(frame?.className).not.toContain('overflow-y-auto')
    expect(primary?.className).toContain('bg-primary')
    expect(primary?.className).toContain('text-primary-foreground')
    expect(primary?.className).toContain('order-1')
    expect(card?.className).toContain('bg-white')
    expect(card?.className).toContain('text-light-overlay-foreground')
    expect(card?.className).not.toContain('text-primary')
    expect(card?.className).toContain('order-2')
    expect(contextTitle?.getAttribute('class')).toContain(
      'font-[family-name:var(--font-display)]',
    )
    expect(contextTitle?.getAttribute('class')).not.toContain('italic')
    expect(ledgerTitle?.getAttribute('class')).toContain('font-[family-name:var(--font-text)]')
    expect(ledgerTitle?.getAttribute('class')).not.toContain('italic')
    expect(officialLabel?.getAttribute('data-section-eyebrow-surface')).toBe('brand')
    expect(purposeLabel?.getAttribute('data-section-eyebrow-surface')).toBe('lightOverlay')
    expect(purposeLabel?.textContent).toBe('Admissions')
    expect(detailLabel.getAttribute('data-section-eyebrow-surface')).toBeNull()
    expect(detailLabel.getAttribute('class')).toContain('text-light-overlay-foreground/65')
    expect(detailRow?.getAttribute('class')).toContain('border-light-overlay-foreground/15')
    expect(instructions?.getAttribute('class')).toContain('mt-8')
    expect(instructions?.getAttribute('class')).toContain('lg:mt-auto')
    expect(rowCopyControl.className).toContain('min-h-11')
    expect(rowCopyControl.className).toContain('min-w-11')
    expect(rowCopyControl.className).toContain('lg:min-h-8')
    expect(rowCopyControl.className).toContain('text-light-overlay-foreground')
    expect(copyAllControl.className).toContain('min-h-11')
    expect(copyAllControl.className).toContain('lg:min-h-8')
    expect(copyAllControl.className).toContain('text-xs')
    expect(copyAllControl.className).toContain('border-light-overlay-foreground/70')
  })

  it('renders Scanner mode from the active account payload and reverses desktop panel order', () => {
    const { container } = render(
      <BankDetailsBlockComponent
        accounts={[admissionsAccount]}
        displayMode="scanner"
        panelDescription="Scan to open the official account information."
        panelPosition="right"
      />,
    )

    const frame = container.querySelector('[data-bank-details-panel="true"]')
    const context = container.querySelector('[data-bank-details-context="true"]')
    const card = container.querySelector('[data-bank-details-card="true"]')

    expect(frame?.getAttribute('data-panel-position')).toBe('right')
    expect(frame?.className).toContain('lg:grid-cols-[minmax(0,16fr)_minmax(0,9fr)]')
    expect(context?.className).toContain('lg:order-2')
    expect(card?.className).toContain('lg:order-1')
    expect(container.querySelector('[data-bank-details-qr="true"] svg')).toBeTruthy()
    expect(screen.getByText('Scan the Admissions account details')).toBeTruthy()
    expect(screen.queryByText(admissionsAccount.instructions)).toBeNull()
    expect(screen.getByText(admissionsAccount.accountNumber)).toBeTruthy()
  })

  it('renders customized persistent ledger text without changing operational copy labels', () => {
    const { container } = render(
      <BankDetailsBlockComponent
        accounts={[admissionsAccount]}
        ledgerText={{
          accountHolderLabel: 'Holder name',
          accountNumberLabel: 'Reference number',
          bankNameLabel: 'Financial institution',
          branchLabel: 'Branch',
          copyAllLabel: 'Copy credentials',
          ifscCodeLabel: 'Routing code',
          ledgerTitle: 'Transfer Account',
          upiIdLabel: 'UPI address',
          verifiedLabel: 'Published',
        }}
      />,
    )

    expect(screen.getByText('Admissions')).toBeTruthy()
    expect(screen.queryByText('Admissions payment details')).toBeNull()
    expect(screen.getByText('Transfer Account')).toBeTruthy()
    expect(screen.getByText('Published')).toBeTruthy()
    expect(screen.getByText('Holder name')).toBeTruthy()
    expect(screen.getByText('Reference number')).toBeTruthy()
    expect(screen.getByText('Financial institution')).toBeTruthy()
    expect(screen.getByText('Routing code')).toBeTruthy()
    expect(screen.getByText('Branch')).toBeTruthy()
    expect(screen.getByText('UPI address')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy account holder' })).toBeTruthy()

    const copyAll = screen.getByRole('button', { name: 'Copy credentials' })
    expect(copyAll.textContent).toContain('Copy credentials')
    expect(copyAll.className).toContain('text-xs')
    expect(container.querySelector('[data-bank-details-ledger-title="true"]')).toBeTruthy()
  })

  it('keeps the visible ledger when a malformed historical payload is too large for Scanner mode', () => {
    const { container } = render(
      <BankDetailsBlockComponent
        accounts={[{ ...admissionsAccount, accountHolder: 'A'.repeat(1_900) }]}
        displayMode="scanner"
      />,
    )

    expect(container.querySelector('[data-bank-details-qr="true"]')).toBeNull()
    expect(container.querySelector('[data-bank-details-qr-unavailable="true"]')?.textContent).toBe(
      'QR unavailable. Use the visible bank details instead.',
    )
    expect(screen.getByText('A'.repeat(1_900))).toBeTruthy()
  })

  it('omits absent optional rows and copy controls without invalidating the account', () => {
    render(
      <BankDetailsBlockComponent
        accounts={[
          {
            accountHolder: 'MINIMUM ACCOUNT',
            accountNumber: '0001',
            ifscCode: 'MINI000001',
            purpose: 'Minimum',
          },
        ]}
      />,
    )

    expect(screen.getByText('MINIMUM ACCOUNT')).toBeTruthy()
    expect(screen.queryByText('Bank Name')).toBeNull()
    expect(screen.queryByText('Branch & Type')).toBeNull()
    expect(screen.queryByText('UPI ID')).toBeNull()
    expect(screen.getByRole('button', { name: 'Copy account holder' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy account number' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy IFSC code' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Copy bank name' })).toBeNull()
  })

  it('hides the official badge when its authored label is blank', () => {
    const { container } = render(
      <BankDetailsBlockComponent accounts={[admissionsAccount]} officialAccountLabel=" " />,
    )

    expect(container.querySelector('[data-bank-details-official-label]')).toBeNull()
  })

  it('switches complete accounts through the shared adaptive tab rail', () => {
    const { container } = render(
      <BankDetailsBlockComponent
        accounts={[admissionsAccount, hostelAccount]}
        tabStyle="boxed"
        tabWidth="centered"
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Admissions',
      'Hostel',
    ])
    expect(container.querySelector('[data-scrollable-content-tab-frame="true"]')).toBeTruthy()
    expect(container.querySelector('[data-content-tab-variant="contained"]')).toBeTruthy()
    expect(container.querySelector('[data-bank-details-tab-width="centered"]')).toBeTruthy()
    expect(screen.getByText(admissionsAccount.accountNumber)).toBeTruthy()

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Hostel' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(screen.getByText(hostelAccount.accountNumber)).toBeTruthy()
    expect(screen.queryByText(admissionsAccount.accountNumber)).toBeNull()
  })

  it('copies exact values and Copy All text with polite success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const account = normalizeBankAccounts([hostelAccount])[0]!

    render(<BankDetailsBlockComponent accounts={[hostelAccount]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy account holder' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(account.accountHolder))

    fireEvent.click(screen.getByRole('button', { name: 'Copy account number' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(account.accountNumber))
    expect(screen.getByRole('button', { name: 'Copied account number' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Account number copied.')

    fireEvent.click(screen.getByRole('button', { name: 'Copy IFSC code' }))
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(account.ifscCode))

    fireEvent.click(screen.getByRole('button', { name: 'Copy bank name' }))
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(account.bankName))

    fireEvent.click(screen.getByRole('button', { name: 'Copy branch and account type' }))
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(account.branch))

    fireEvent.click(screen.getByRole('button', { name: 'Copy all details' }))
    await waitFor(() =>
      expect(writeText).toHaveBeenLastCalledWith(formatBankAccountCopyText(account)),
    )
  })

  it('clears success after two seconds and whenever the active account changes', async () => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })

    render(<BankDetailsBlockComponent accounts={[admissionsAccount, hostelAccount]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy account number' }))
    await act(async () => Promise.resolve())
    expect(screen.getByRole('button', { name: 'Copied account number' })).toBeTruthy()

    act(() => vi.advanceTimersByTime(2_000))
    expect(screen.getByRole('button', { name: 'Copy account number' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Copy account number' }))
    await act(async () => Promise.resolve())
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Hostel' }), {
      button: 0,
      ctrlKey: false,
    })
    expect(screen.queryByRole('button', { name: 'Copied account number' })).toBeNull()
  })

  it('announces unavailable clipboard access while keeping visible values', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })

    render(<BankDetailsBlockComponent accounts={[admissionsAccount]} />)
    const button = screen.getByRole('button', { name: 'Copy account number' })
    button.focus()
    fireEvent.click(button)

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'Copy unavailable. Select and copy the value manually.',
      ),
    )
    expect(document.activeElement).toBe(button)
    expect(screen.getByText(admissionsAccount.accountNumber)).toBeTruthy()
  })
})
