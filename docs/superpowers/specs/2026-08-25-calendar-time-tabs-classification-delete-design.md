# Calendar Time, Tabs, and Classification Delete Design

## Goal

Make Calendar metadata and controls visually correct while making News & Events classification deletion understandable and recoverable without corrupting required relationships.

## Calendar date and time

Calendar and News & Events dates continue to be calculated in the Site Settings IANA timezone. Visitor-facing time labels omit the technical timezone suffix and use a simple 12-hour label such as `1:30 AM`. Date labels retain their existing concise public formats.

## Tabs and hover behavior

The shared shadcn-style Tabs primitive must style Radix's actual `data-state="active"` attribute. Selected, hover, focus, line-indicator, light-theme, and dark-theme behavior remain semantic-token driven. Calendar keeps its framed 44px controls.

## Classification selection and deletion

Every News & Events entry continues to require one `news-event-classifications` relationship in the Content tab. Active classifications remain available for new selection.

Deletion stays non-cascading. If a classification is referenced, Payload blocks deletion and identifies the first concrete reference by resource label, record title when available, and record ID. The message directs the editor to remove or replace that reference and retry, while offering archive-in-place as the safe alternative. Unused classifications remain deletable.

No content migration, automatic unlinking, automatic reassignment, staging, or commit is part of this change.
