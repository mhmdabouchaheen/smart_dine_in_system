import { useState } from 'react'
import { createReservation } from '../../services/api'
import Button from '../ui/Button'

const PARTY_SIZES = ['2 Guests', '3 Guests', '4 Guests', '5+ Guests']

const initialForm = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  partySize: PARTY_SIZES[0],
  notes: '',
}

export default function ReservationForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
  e.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const tableId = params.get('tableId');

  if (!tableId) {
    setStatus('error');
    return;
  }

  setStatus('submitting');

  try {
    await createReservation({
      tableId,
      customerDetails: {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
      },
      dateTime: new Date(
        `${form.date}T${form.time}`,
      ).toISOString(),
      partySize: parseInt(form.partySize, 10),
      notes: form.notes,
    });

    setStatus('success');
    setForm(initialForm);
  } catch {
    setStatus('error');
  }
}

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
      <Field label="Full Name">
        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Your name"
          className="field"
        />
      </Field>

      <Field label="Email">
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@example.com"
          className="field"
        />
      </Field>

      <Field label="Phone">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="+1 (___) ___-____"
          className="field"
        />
      </Field>

      <Field label="Party Size">
        <select
          value={form.partySize}
          onChange={(e) => update('partySize', e.target.value)}
          className="field"
        >
          {PARTY_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Date">
        <input
          required
          type="date"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          className="field"
        />
      </Field>

      <Field label="Time">
        <input
          required
          type="time"
          value={form.time}
          onChange={(e) => update('time', e.target.value)}
          className="field"
        />
      </Field>

      <Field label="Notes" full>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Allergies, occasions, seating preferences…"
          className="field resize-none"
        />
      </Field>

      <div className="md:col-span-2 flex items-center gap-6 pt-2">
        <Button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Request Table'}
        </Button>
        {status === 'success' && (
          <p className="text-sm text-ember">Request received — we'll confirm by email.</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-ember">Something went wrong. Please try again.</p>
        )}
      </div>

      <style>{`
        .field {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 0.9rem 1rem;
          font-size: 0.875rem;
          color: #F5F3EE;
          width: 100%;
          transition: border-color 0.2s ease;
        }
        .field:focus {
          outline: none;
          border-color: #E55A2B;
        }
        .field::placeholder { color: #7A7872; }
        .field option { background-color: #111110; }
      `}</style>
    </form>
  )
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}
