# Celebrations

Celebrations are floating modals with confetti for festivals, anniversaries, events, or welcoming
someone. Each one appears only on its own dates and can be switched off at any time.

Find them in the admin under **Content → Celebrations**. Admins always have access; Site Managers
need the **Celebrations** feature.

## Scheduling

- **Start Date** and **End Date** are calendar days in the site timezone (Site Settings). Leave End
  Date blank for a single day. Several celebrations can be planned in advance; each shows only on its
  own dates.
- **Enabled** (sidebar) hides a celebration everywhere without deleting it.
- **Show On**: _Every page_ shows it across the site. _Only pages with a Celebration block_ shows it
  only where you add the **Celebration** block to a Page or Reusable Section.
- Only one celebration opens per page. A page's Celebration block wins over a site-wide celebration on
  the same day; between site-wide celebrations, the one starting first wins.
- Publish the celebration for it to appear. Drafts never show to visitors.

## Content

Eyebrow, Heading with an italic Accent Heading, Message, Image, Signature and Signed By, and one
optional Button. **Image only** shows just the image (for example a festival poster made in Canva);
the heading is still used for screen readers. **Highlight** is the large gold number in the
Medallion style, such as "25".

When **Image only** is enabled, **Image Size** selects Small (560px), Medium (720px), or
Large (960px). Medium is the default, including existing celebrations without a saved size.
The popup and live preview use the same width independently of Style. Images fit smaller screens
and retain their full aspect ratio without cropping.

## Display

- **Style**: Aurora Halo (navy card with a portrait in a gold ring), Holographic Ticket (an event
  ticket with a date stub; the foil follows the cursor), Floating Poster (your image in a glass
  frame), Glass Bloom (light frosted card), or Medallion (circular seal).
- **How Often**, remembered in each visitor's browser: once per visitor per day, every page load,
  once for the whole celebration, or a set number of times per day.
- **Open After** delays the modal by a few seconds after the page loads.
- After closing, an optional **reopen badge** in the corner lets visitors open it again.

## Confetti

Two navy-and-gold party cones sit in the bottom-left and bottom-right corners while the modal is
open. Confetti launches from their openings, angled upward and inward, then drifts down. Cones
scale down on phones and remain after the final burst. Closing removes both cones and confetti.
Reduced-motion visitors see static cones only. Disabling confetti hides the cones too. Settings on the **Confetti**
tab:

- **Bursts**: how many times the corners fire (1–8, default 5).
- **Pieces per Burst**: pieces from each corner per burst (20–300, default 160). Larger values make
  a bigger splash.
- **Speed**: Very slow, Slow, Normal (default), or Lively. Every speed reaches the same height;
  slower settings play the same splash in slow motion, Lively a little faster.

Switch confetti off entirely with **Celebrate with confetti**. Visitors who prefer reduced motion
see the modal without confetti.

## Local examples

With `pnpm dev` running, open `/celebration-examples` to compare all five styles and open each
as a real modal with party cones. This development-only gallery uses illustrative content and
does not create or change CMS records. It returns 404 in production.
