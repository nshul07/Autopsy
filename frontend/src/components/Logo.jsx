import { ShieldCheck } from 'lucide-react'

export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ShieldCheck size={20} strokeWidth={2.25} className="text-navy-500" />
      <span className="font-semibold text-[17px] tracking-tight text-ink">AppAutopsy</span>
    </div>
  )
}
