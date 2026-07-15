import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff  } from 'lucide-react'
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../services/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TextInput, Select } from '../../components/ui/FormField'
import type { Employee, UserRole } from '../../types'
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  hasErrors,
  type FieldErrors,
} from '../../utils/validation'

interface FormState {
  name: string
  email: string
  phone: string
  role: UserRole
  salary: string
  password: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  role: 'Waiter',
  salary: '',
  password: '',
  isActive: true,
}

export default function StaffManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<keyof FormState>>({})
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const data = await fetchEmployees()
    setEmployees(data)
    setLoading(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditingId(emp._id)
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      salary: String(emp.salary),
      password: '',
      isActive: emp.isActive,
    })
    setErrors({})
    setModalOpen(true)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const nextErrors: FieldErrors<keyof FormState> = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      salary: validatePositiveNumber(form.salary, 'Salary'),
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        salary: Number(form.salary),
        password: form.password,
        isActive: form.isActive,
      }
      if (editingId) {
        const updated = await updateEmployee(editingId, payload)
        setEmployees((prev) => prev.map((e) => (e._id === editingId ? { ...e, ...updated } : e)))
      } else {
  const created = await createEmployee(payload)

  console.log("CREATED EMPLOYEE:", created)

  setEmployees((prev) => [created, ...prev])
}
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteEmployee(deleteTarget._id)
    setEmployees((prev) => prev.filter((e) => e._id !== deleteTarget._id))
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">Team</p>
          <h1 className="font-display text-4xl leading-[1.05]">
            Staff &amp; <em className="text-ember italic">employees.</em>
          </h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14} /> Add Employee
        </Button>
      </div>

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading staff…</p>
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest2 text-bone-faint border-b border-white/10">
                <th className="px-6 py-4 font-normal">Name</th>
                <th className="px-6 py-4 font-normal">Role</th>
                <th className="px-6 py-4 font-normal">Salary</th>
                <th className="px-6 py-4 font-normal">Status</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4">
                    <p className="text-bone">{emp.name}</p>
                    <p className="text-xs text-bone-faint">{emp.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] uppercase tracking-widest2 text-ember">{emp.role}</span>
                  </td>
                  <td className="px-6 py-4 text-bone-dim">${(emp.salary ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] uppercase tracking-widest2 ${emp.isActive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                    >
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(emp)} className="text-bone-dim hover:text-ember" aria-label={`Edit ${emp.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(emp)} className="text-bone-dim hover:text-red-400" aria-label={`Remove ${emp.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Employee' : 'Add Employee'}
        maxWidth="max-w-xl"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <TextInput label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} />
          <TextInput label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
          <TextInput label="Phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} />
          <TextInput label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder={editingId ? 'Leave blank to keep current password' : ''} />
          <Select label="Role" value={form.role} onChange={(e) => update('role', e.target.value as UserRole)}>
            <option value="Waiter">Waiter</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </Select>
          <TextInput label="Salary (annual)" type="number" min={0} value={form.salary} onChange={(e) => update('salary', e.target.value)} error={errors.salary} placeholder="52000" />
          <Select
            label="Account Status"
            value={form.isActive ? 'active' : 'suspended'}
            onChange={(e) => update('isActive', e.target.value === 'active')}
            full
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Employee'}</Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Employee"
        subtitle={deleteTarget ? `${deleteTarget.name} will lose access immediately.` : undefined}
        maxWidth="max-w-sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>
  )
}
