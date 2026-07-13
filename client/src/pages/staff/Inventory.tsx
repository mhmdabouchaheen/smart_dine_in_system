import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { fetchIngredients, createIngredient, updateIngredient, deleteIngredient } from '../../services/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TextInput } from '../../components/ui/FormField'
import type { Ingredient } from '../../types'
import { required, validatePositiveNumber, hasErrors, type FieldErrors } from '../../utils/validation'

interface Form {
  name: string
  unit: string
  quantityInStock: string
  lowStockThreshold: string
}

const emptyForm: Form = { name: '', unit: '', quantityInStock: '', lowStockThreshold: '' }

type IngredientWithThreshold = Ingredient & { lowStockThreshold: number }

export default function Inventory() {
  const [ingredients, setIngredients] = useState<IngredientWithThreshold[]>([])
  const [isLoading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<keyof Form>>({})
  const [isSaving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const fetched = await fetchIngredients() as Ingredient[]
    setIngredients(fetched.map((ing) => ({ ...ing, lowStockThreshold: ing.reorderThreshold })))
    setLoading(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(ing: IngredientWithThreshold) {
    setEditingId(ing._id)
    setForm({
      name: ing.name,
      unit: ing.unit,
      quantityInStock: String(ing.quantityInStock),
      lowStockThreshold: String(ing.lowStockThreshold),
    })
    setErrors({})
    setModalOpen(true)
  }

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const nextErrors: FieldErrors<keyof Form> = {
      name: required(form.name, 'Name'),
      unit: required(form.unit, 'Unit'),
      quantityInStock: validatePositiveNumber(form.quantityInStock || '0', 'Quantity in stock'),
      lowStockThreshold: validatePositiveNumber(form.lowStockThreshold, 'Low-stock threshold'),
    }
    // quantityInStock of 0 is valid (out of stock) — only block truly empty/invalid input
    if (form.quantityInStock === '') nextErrors.quantityInStock = 'Quantity in stock is required.'
    else if (Number(form.quantityInStock) < 0) nextErrors.quantityInStock = 'Cannot be negative.'
    else nextErrors.quantityInStock = undefined

    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        unit: form.unit as "kg" | "g" | "L" | "ml" | "pieces",
        quantityInStock: Number(form.quantityInStock),
        reorderThreshold: Number(form.lowStockThreshold),
      }
      if (editingId) {
        const updated = await updateIngredient(editingId, payload) as Ingredient
        setIngredients((prev) => prev.map((i) => (i._id === editingId ? { ...updated, lowStockThreshold: updated.reorderThreshold } : i)))
      } else {
        const created = await createIngredient(payload) as Ingredient
        setIngredients((prev) => [{ ...created, lowStockThreshold: created.reorderThreshold }, ...prev])
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteIngredient(deleteTarget._id)
    setIngredients((prev) => prev.filter((i) => i._id !== deleteTarget._id))
    setDeleteTarget(null)
  }

  const lowStockCount = ingredients.filter((i) => i.quantityInStock < i.lowStockThreshold).length

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">Kitchen Stock</p>
          <h1 className="font-display text-4xl leading-[1.05] mb-3">
            Inventory <em className="text-ember italic">levels.</em>
          </h1>
          <p className="text-bone-dim text-sm max-w-lg">
            Menu items check this stock before an order can be placed. Anything below its threshold
            also raises a notification automatically.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14} /> Add Ingredient
        </Button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 mb-8 px-5 py-4 border border-ember/30 bg-ember/5 text-sm text-ember">
          <AlertTriangle size={16} />
          {lowStockCount} ingredient{lowStockCount > 1 ? 's are' : ' is'} below its low-stock threshold.
        </div>
      )}

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading inventory…</p>
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest2 text-bone-faint border-b border-white/10">
                <th className="px-6 py-4 font-normal">Ingredient</th>
                <th className="px-6 py-4 font-normal">In Stock</th>
                <th className="px-6 py-4 font-normal">Threshold</th>
                <th className="px-6 py-4 font-normal">Status</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const low = ing.quantityInStock < ing.lowStockThreshold
                return (
                  <tr key={ing._id} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-4 text-bone">{ing.name}</td>
                    <td className="px-6 py-4 text-bone-dim">
                      {ing.quantityInStock} {ing.unit}
                    </td>
                    <td className="px-6 py-4 text-bone-dim">
                      {ing.lowStockThreshold} {ing.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-widest2 ${low ? 'text-ember' : 'text-emerald-400'}`}>
                        {low ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(ing)} className="text-bone-dim hover:text-ember" aria-label={`Edit ${ing.name}`}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(ing)} className="text-bone-dim hover:text-red-400" aria-label={`Remove ${ing.name}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Ingredient' : 'Add Ingredient'} maxWidth="max-w-md">
        <div className="grid gap-5">
          <TextInput label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} placeholder="Diver Scallop" />
          <TextInput label="Unit" value={form.unit} onChange={(e) => update('unit', e.target.value)} error={errors.unit} placeholder="pcs, g, kg, ml…" />
          <TextInput label="Quantity In Stock" type="number" min={0} value={form.quantityInStock} onChange={(e) => update('quantityInStock', e.target.value)} error={errors.quantityInStock} />
          <TextInput label="Low-Stock Threshold" type="number" min={0} value={form.lowStockThreshold} onChange={(e) => update('lowStockThreshold', e.target.value)} error={errors.lowStockThreshold} hint="A notification fires the moment stock drops below this number." />
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Ingredient'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Ingredient" subtitle={deleteTarget ? `Any dish using "${deleteTarget.name}" will no longer be stock-checked.` : undefined} maxWidth="max-w-sm">
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>
  )
}
