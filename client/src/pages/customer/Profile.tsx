import { useState, useEffect } from 'react'
import { fetchCustomerProfile, updateCustomerProfile } from '../../services/api'
import { TextInput } from '../../components/ui/FormField'
import Button from '../../components/ui/Button'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setIsLoading(true)
      const data = await fetchCustomerProfile()
      setProfile(data.customer)
      setEditName(data.customer.name || '')
      setEditPhone(data.customer.phone || '')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSaving(true)
      const { customer } = await updateCustomerProfile({ name: editName, phone: editPhone })
      setProfile(customer)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-bone">
        Loading...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center min-h-screen text-bone">
        Failed to load profile.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pt-32">
      <h1 className="font-display text-4xl mb-10">
        My <em className="text-ember italic">Profile.</em>
      </h1>

      <div className="space-y-8">
        {/* Personal Info */}
        <section className="border border-white/10 p-6 rounded-xl bg-noir-900/60 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl text-bone">Personal Info</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-ember hover:underline uppercase tracking-widest2"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <TextInput
                label="Full Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <TextInput
                label="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditing(false)
                    setEditName(profile.name || '')
                    setEditPhone(profile.phone || '')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-bone-faint mb-1">Name</p>
                  <p className="font-medium text-bone">{profile.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-bone-faint mb-1">Email</p>
                  <p className="font-medium text-bone">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-bone-faint mb-1">Phone</p>
                  <p className="font-medium text-bone">{profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-bone-faint mb-1">Member Since</p>
                  <p className="font-medium text-bone">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Loyalty Rewards */}
        <section className="border border-ember/20 p-6 rounded-xl bg-ember/5 backdrop-blur-sm">
          <h2 className="font-display text-2xl text-bone mb-6">Loyalty Rewards</h2>

          <div className="flex items-end gap-3 mb-4">
            <span className="font-display text-6xl text-ember leading-none">
              {profile.loyaltyPoints ?? 0}
            </span>
            <span className="text-sm uppercase tracking-wider text-bone-dim pb-1">Points Available</span>
          </div>

          <p className="text-sm text-bone-dim mb-6">
            Earn points every time you dine. Redeem them at checkout for discounts on your next meal.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
            <div>
              <p className="text-xs uppercase tracking-widest text-bone-faint mb-1">Lifetime Earned</p>
              <p className="font-display text-xl text-bone">{profile.totalPointsEarned ?? 0} <span className="text-sm text-bone-dim">pts</span></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-bone-faint mb-1">Lifetime Redeemed</p>
              <p className="font-display text-xl text-bone">{profile.totalPointsRedeemed ?? 0} <span className="text-sm text-bone-dim">pts</span></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
