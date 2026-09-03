import { QRCodeSVG } from 'qrcode.react'

import { formatBankAccountCopyText } from './normalizeBankDetails'
import type { ResolvedBankAccount } from './types'

const maximumQrPayloadBytes = 1_800

export function BankDetailsQRCode({ account }: { account: ResolvedBankAccount }) {
  const payload = formatBankAccountCopyText(account)

  if (new TextEncoder().encode(payload).byteLength > maximumQrPayloadBytes) {
    return (
      <p
        className="text-sm leading-6 text-current/75"
        data-bank-details-qr-unavailable="true"
        role="status"
      >
        QR unavailable. Use the visible bank details instead.
      </p>
    )
  }

  return (
    <figure className="flex flex-col items-center gap-3" data-bank-details-qr="true">
      <div className="rounded-compact bg-white p-3">
        <QRCodeSVG
          aria-hidden="true"
          bgColor="#ffffff"
          fgColor="#092956"
          level="M"
          size={184}
          value={payload}
        />
      </div>
      <figcaption className="text-center text-sm leading-6 text-current/75">
        Scan the {account.purpose} account details
      </figcaption>
    </figure>
  )
}
