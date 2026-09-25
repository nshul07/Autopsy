import { ArrowLeft } from 'lucide-react'

const CONTENT = {
  about: {
    title: 'About AppAutopsy',
    body: [
      "AppAutopsy checks an Android APK or download link before you install it, and explains — in plain English, Hindi or Punjabi — whether the app's requested permissions actually match its purpose.",
      'It was built for people who receive APKs through WhatsApp or Telegram and have no easy way to judge what a permission like "accessibility" or "SMS access" really means.',
      'Every score is rule-based and traceable: each point comes from a specific, readable rule, not a machine-learning model.',
    ],
  },
  privacy: {
    title: 'Privacy',
    body: [
      'Your APK file is stored only in a temporary location, analyzed, and deleted immediately afterward — it is never installed, executed, or kept.',
      'Reputation lookups send only a hash of the file, never the file itself, to any third-party service.',
      'Message text and pasted links are not stored beyond the time needed to produce a result.',
    ],
  },
  limitations: {
    title: 'Limitations',
    body: [
      'This is static analysis: AppAutopsy reads what an app declares in its manifest, not what it does when it runs.',
      'Category detection is an estimate and can be wrong, in both directions.',
      'A green result means no major red flags were found in the checks we ran — it does not mean the app is guaranteed safe.',
      'AppAutopsy cannot inspect code that is downloaded or loaded after installation.',
    ],
  },
}

export default function InfoPage({ page, onBack }) {
  const content = CONTENT[page] || CONTENT.about

  return (
    <div className="container-page py-12 max-w-2xl">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted hover:text-ink">
        <ArrowLeft size={15} />
        Back
      </button>

      <h1 className="mt-4 text-[24px] font-semibold text-ink">{content.title}</h1>

      <div className="mt-4 space-y-3.5">
        {content.body.map((p, i) => (
          <p key={i} className="text-[14.5px] text-ink-soft leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}
