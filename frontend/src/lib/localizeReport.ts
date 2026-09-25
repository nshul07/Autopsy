import type { AnyReport, ApkReport, LinkReport, MessageReport, Lang } from '../types/contract'
import { resolveText } from '../i18n'

function text(lang: Lang, path: string): string | undefined {
  const val = resolveText(lang, path)
  return typeof val === 'string' ? val : undefined
}

export function localizeApkReport(report: ApkReport, lang: Lang): ApkReport {
  // Category label
  const catId = report.category?.id || 'unknown'
  const categoryLabel = text(lang, `category.${catId}`) || text(lang, 'category.unknown') || catId

  // Localized summary
  const summaryTemplate = text(lang, `summary.${report.verdict}`)
  const localizedSummary = summaryTemplate
    ? summaryTemplate.replace(/\{category\}/g, categoryLabel)
    : report.summary

  // Localized reasons
  const newReasons: string[] = []

  // Check breakdown entries
  if (report.breakdown && report.breakdown.length > 0) {
    for (const b of report.breakdown) {
      if (b.status === 'unexpected' || b.rule.startsWith('pattern:') || b.rule === 'mismatch') {
        // Try rule or permission key
        const ruleKey = b.rule.startsWith('pattern:')
          ? `pattern.${b.rule.replace('pattern:', '')}`
          : b.rule === 'mismatch'
          ? 'rule.mismatch'
          : b.rule.replace('group:', 'perm.')

        const localizedReason = text(lang, ruleKey) || text(lang, b.reason_key)
        if (localizedReason && !newReasons.includes(localizedReason)) {
          newReasons.push(localizedReason)
        }
      }
    }
  }

  // Check repackaging
  if (report.repackaging?.detected) {
    const repMsg = text(lang, 'pattern.repackaged_signer') || text(lang, 'repackaging.detectedBody')
    if (repMsg && !newReasons.includes(repMsg)) {
      newReasons.push(repMsg)
    }
  }

  // Check patterns
  if (report.patterns && report.patterns.length > 0) {
    for (const p of report.patterns) {
      const pMsg = text(lang, `pattern.${p.id}`) || text(lang, `patterns.${p.id}.body`)
      if (pMsg && !newReasons.includes(pMsg)) {
        newReasons.push(pMsg)
      }
    }
  }

  // If no localized reasons found from keys, fallback to existing or default message
  const finalReasons = newReasons.length > 0 ? newReasons : report.reasons

  // Localized calibration
  const disclaimer = text(lang, 'disclaimer') || report.limitations

  return {
    ...report,
    lang,
    summary: localizedSummary,
    reasons: finalReasons,
    limitations: disclaimer,
  }
}

export function localizeLinkReport(report: LinkReport, lang: Lang): LinkReport {
  const newReasons: string[] = []

  if (report.lookalike_domain) {
    const r = text(lang, 'link.brand_lookalike')
    if (r) newReasons.push(r)
  }
  if (report.direct_apk) {
    const r = text(lang, 'link.direct_apk')
    if (r) newReasons.push(r)
  }
  if (!report.https) {
    const r = text(lang, 'link.no_https')
    if (r) newReasons.push(r)
  }

  const localizedSummary =
    lang === 'hi'
      ? 'यह पता किसी बैंक या ब्रांड जैसा दिखता है और सीधे एक ऐप फ़ाइल डाउनलोड करता है। इससे डाउनलोड न करें।'
      : lang === 'pa'
      ? 'ਇਹ ਪਤਾ ਕਿਸੇ ਬ੍ਰਾਂਡ ਵਰਗਾ ਲੱਗਦਾ ਹੈ ਅਤੇ ਸਿੱਧੀ ਐਪ ਫ਼ਾਈਲ ਡਾਊਨਲੋਡ ਕਰਦਾ ਹੈ। ਇਸ ਤੋਂ ਡਾਊਨਲੋਡ ਨਾ ਕਰੋ।'
      : report.summary

  return {
    ...report,
    lang,
    summary: localizedSummary,
    reasons: newReasons.length > 0 ? newReasons : report.reasons,
    limitations: text(lang, 'disclaimer') || report.limitations,
  }
}

export function localizeMessageReport(report: MessageReport, lang: Lang): MessageReport {
  const newReasons: string[] = []

  if (report.signals && report.signals.length > 0) {
    for (const sig of report.signals) {
      const msg = text(lang, `message.signals.${sig}.body`)
      if (msg && !newReasons.includes(msg)) {
        newReasons.push(msg)
      }
    }
  }

  const localizedSummary =
    lang === 'hi'
      ? 'इस संदेश में धोखाधड़ी के कई संकेत हैं, जिनमें OTP मांगना और संदिग्ध ऐप डाउनलोड लिंक शामिल हैं।'
      : lang === 'pa'
      ? 'ਇਸ ਸੁਨੇਹੇ ਵਿੱਚ ਧੋਖਾਧੜੀ ਦੇ ਕਈ ਸੰਕੇਤ ਹਨ, ਜਿਵੇਂ ਕਿ OTP ਮੰਗਣਾ ਅਤੇ ਸ਼ੱਕੀ ਐਪ ਡਾਊਨਲੋਡ ਲਿੰਕ।'
      : report.summary

  return {
    ...report,
    lang,
    summary: localizedSummary,
    reasons: newReasons.length > 0 ? newReasons : report.reasons,
    limitations: text(lang, 'disclaimer') || report.limitations,
  }
}

export function localizeReport(report: AnyReport, lang: Lang): AnyReport {
  if (report.type === 'apk') return localizeApkReport(report, lang)
  if (report.type === 'link') return localizeLinkReport(report, lang)
  if (report.type === 'message') return localizeMessageReport(report, lang)
  return report
}
