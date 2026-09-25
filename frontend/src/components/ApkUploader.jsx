import { useRef, useState } from 'react'
import { FileArchive, UploadCloud } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function ApkUploader({ onFileSelected }) {
  const { t } = useLanguage()
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const inputRef = useRef(null)

  function handleFiles(files) {
    const file = files?.[0]
    if (!file) return
    setFileName(file.name)
    onFileSelected?.(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={[
          'rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors duration-150',
          dragging ? 'border-navy-500 bg-navy-50' : 'border-line bg-white',
        ].join(' ')}
      >
        <div className="mx-auto w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center">
          {fileName ? (
            <FileArchive size={18} className="text-navy-500" />
          ) : (
            <UploadCloud size={18} className="text-navy-500" />
          )}
        </div>

        {fileName ? (
          <p className="mt-3 text-[14.5px] font-medium text-ink">{fileName}</p>
        ) : (
          <p className="mt-3 text-[14.5px] font-medium text-ink">{t.scanner.drop}</p>
        )}

        <p className="mt-1 text-[13.5px] text-ink-muted">{t.scanner.or}</p>

        <button
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center rounded-md border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink hover:border-navy-400 hover:text-navy-500 transition-colors duration-150"
        >
          {t.scanner.browse}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".apk"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <p className="mt-3 text-[12px] text-ink-faint">{t.scanner.maxSize}</p>
      </div>
    </div>
  )
}
