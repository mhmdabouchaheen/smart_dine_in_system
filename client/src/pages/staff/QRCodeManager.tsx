import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Plus, Download } from 'lucide-react'
import { fetchQRCodes, createTable } from '../../services/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TextInput, Select } from '../../components/ui/FormField'
import type { QRCodeRecord } from '../../types'
import { validatePositiveNumber, hasErrors, type FieldErrors } from '../../utils/validation'

interface FormState {
  tableNumber: string
  capacity: string
  zone: string
}

const emptyForm: FormState = { tableNumber: '', capacity: '', zone: 'Hearth' }

export default function QRCodeManager() {
  const [codes, setCodes] = useState<QRCodeRecord[]>([])
  const [isLoading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<keyof FormState>>({})
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const data = await fetchQRCodes()
    setCodes(data)
    setLoading(false)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    const nextErrors: FieldErrors<keyof FormState> = {
      tableNumber: validatePositiveNumber(form.tableNumber, 'Table number'),
      capacity: validatePositiveNumber(form.capacity, 'Capacity'),
      zone: form.zone.trim() ? undefined : 'Zone is required.',
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    try {
      const { qrCode } = await createTable({
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
        zone: form.zone,
      })
      setCodes((prev) => [qrCode, ...prev])
      setModalOpen(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  function downloadQR(tableNumber: number) {
    const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `table-${tableNumber}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">Floor Setup</p>
          <h1 className="font-display text-4xl leading-[1.05]">
            Tables &amp; <em className="text-ember italic">QR codes.</em>
          </h1>
          <p className="text-bone-dim text-sm max-w-lg mt-3">
            Add a new table and generate its QR code — printed on the table, it opens the digital
            menu pre-loaded with that table&rsquo;s number for ordering.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={14} /> New Table
        </Button>
      </div>

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading tables…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {codes.map((code) => (
            <div key={code._id} className="border border-white/10 p-6 flex flex-col items-center text-center">
              <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-1">Table</p>
              <p className="font-display text-3xl mb-5">{String(code.tableNumber).padStart(2, '0')}</p>
              <div className="bg-white p-3 mb-5">
                <QRCodeCanvas id={`qr-${code.tableNumber}`} value={code.url} size={140} level="M" />
              </div>
              <p className="text-xs text-bone-faint break-all mb-1">{code.qrToken}</p>
              <p className="text-[11px] text-bone-faint mb-5">
                Created {new Date(code.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => downloadQR(code.tableNumber)}
                className="flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-ember"
              >
                <Download size={13} /> Download PNG
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Table" subtitle="Generates a QR code automatically.">
        <div className="grid gap-5">
          <TextInput
            label="Table Number"
            type="number"
            min={1}
            value={form.tableNumber}
            onChange={(e) => update('tableNumber', e.target.value)}
            error={errors.tableNumber}
            placeholder="10"
          />
          <TextInput
            label="Capacity (seats)"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => update('capacity', e.target.value)}
            error={errors.capacity}
            placeholder="4"
          />
          <Select label="Zone" value={form.zone} onChange={(e) => update('zone', e.target.value)} error={errors.zone}>
            <option value="Hearth">Hearth</option>
            <option value="Cellar">Cellar</option>
            <option value="Forge">Forge</option>
          </Select>
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isSaving}>{isSaving ? 'Creating…' : 'Create & Generate QR'}</Button>
        </div>
      </Modal>
    </div>
  )
}
