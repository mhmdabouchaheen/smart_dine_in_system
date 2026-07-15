import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import Button from '../ui/Button'

import type {
  CreateNotificationPayload,
  NotificationRole,
  NotificationType,
} from '../../types'

interface NotificationFormProps {
  onSend: (
    payload: CreateNotificationPayload,
  ) => Promise<unknown>
  allowedRecipientRoles?: NotificationRole[]
}

interface NotificationFormState {
  recipientOptions: NotificationRole[]
}

const ROLES: NotificationRole[] = [
  'Admin',
  'Waiter',
  'Customer',
  'Kitchen',
  'Manager',
]

const TYPES: NotificationType[] = [
  'General',
  'Urgent',
  'Assistance',
  'Order',
  'Reservation',
]

export default function NotificationForm({
  onSend,
  allowedRecipientRoles,
}: NotificationFormProps) {
  const [message, setMessage] =
    useState('')

  const [type, setType] =
    useState<NotificationType>(
      'General',
    )

  const recipientOptions =
    allowedRecipientRoles ?? ROLES

  const [
    recipientRole,
    setRecipientRole,
  ] = useState<NotificationRole>(
    recipientOptions[0] ?? 'Waiter',
  )

  useEffect(() => {
    setRecipientRole((current) =>
      recipientOptions.includes(current)
        ? current
        : recipientOptions[0] ?? 'Waiter',
    )
  }, [recipientOptions])

  const [
    recipientId,
    setRecipientId,
  ] = useState('')

  const [status, setStatus] =
    useState<
      'idle' |
      'sending' |
      'success' |
      'error'
    >('idle')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!message.trim()) {
      return
    }

    try {
      setStatus('sending')

      await onSend({
        message: message.trim(),
        type,
        recipientRole,
        recipientId:
          recipientId.trim() ||
          undefined,
      })

      setMessage('')
      setRecipientId('')
      setStatus('success')

      window.setTimeout(() => {
        setStatus('idle')
      }, 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/10 bg-noir-900/40 p-6"
    >
      <div className="mb-6">
        <p className="eyebrow mb-2">
          Send Notification
        </p>

        <h2 className="font-display italic text-2xl">
          Contact another role
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <label>
          <span className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">
            Notification Type
          </span>

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target
                  .value as NotificationType,
              )
            }
            className="field"
          >
            {TYPES.map(
              (notificationType) => (
                <option
                  key={notificationType}
                  value={notificationType}
                >
                  {notificationType}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">
            Send To
          </span>

          <select
            value={recipientRole}
            onChange={(event) =>
              setRecipientRole(
                event.target
                  .value as NotificationRole,
              )
            }
            className="field"
          >
            {recipientOptions.map((role) => (
              <option
                key={role}
                value={role}
              >
                All {role}s
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">
            Specific Recipient ID
            <span className="normal-case tracking-normal ml-2">
              Optional
            </span>
          </span>

          <input
            type="text"
            value={recipientId}
            onChange={(event) =>
              setRecipientId(
                event.target.value,
              )
            }
            placeholder="Leave empty to send to everyone in the selected role"
            className="field"
          />
        </label>

        <label className="md:col-span-2">
          <span className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">
            Message
          </span>

          <textarea
            required
            rows={4}
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value,
              )
            }
            placeholder="Write your notification..."
            className="field resize-none"
          />
        </label>
      </div>

      <div className="flex items-center gap-5 mt-6">
        <Button
          type="submit"
          disabled={
            status === 'sending'
          }
        >
          {status === 'sending'
            ? 'Sending...'
            : 'Send Notification'}
        </Button>

        {status === 'success' && (
          <p className="text-sm text-ember">
            Notification sent.
          </p>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-400">
            Notification could not be sent.
          </p>
        )}
      </div>

      <style>{`
        .field {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.9rem 1rem;
          color: #f5f3ee;
          font-size: 0.875rem;
        }

        .field:focus {
          outline: none;
          border-color: #e55a2b;
        }

        .field::placeholder {
          color: #7a7872;
        }

        .field option {
          background: #111110;
        }
      `}</style>
    </form>
  )
}