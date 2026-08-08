import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { MasterCrudPage } from '../../components/masters/MasterCrudPage'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ActiveBadge } from '../../components/ui/ActiveBadge'
import { UserPermissionsModal } from '../../components/users/UserPermissionsModal'

const blank = () => ({ fullName: '', email: '', password: '', carrierId: '', active: true })

export default function Users() {
  const { users, usersCrud, carriers, mastersLoading, mastersError } = useData()
  const [permUser, setPermUser] = useState(null)

  const columns = [
    { key: 'fullName', header: 'Full Name', render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.fullName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'carrier', header: 'Carrier', render: (r) => carriers.find((c) => c.id === r.carrierId)?.name || '—', filterValue: (r) => carriers.find((c) => c.id === r.carrierId)?.name || '' },
    { key: 'active', header: 'Status', render: (r) => <ActiveBadge active={r.active} />, filterValue: (r) => (r.active ? 'Active' : 'Inactive') },
    {
      key: 'actions',
      header: 'Actions',
      filterable: false,
      render: (r) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            setPermUser(r)
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Page Access
        </Button>
      ),
    },
  ]

  return (
    <>
      <MasterCrudPage
        title="Users"
        description={`${users.length} users`}
        entityLabel="User"
        data={users}
        crud={usersCrud}
        columns={columns}
        loading={mastersLoading}
        loadError={mastersError}
        searchFn={(row, q) => `${row.fullName} ${row.email}`.toLowerCase().includes(q.toLowerCase())}
        searchPlaceholder="Search users..."
        blankRecord={blank}
        renderForm={({ form, set }) => (
          <div className="space-y-4">
            <Field label="Full Name" required>
              <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
            </Field>
            <Field label="Email" required hint="Used as both the login username and contact email">
              <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field
              label="Password"
              required={!form.id}
              hint={form.id ? 'Leave blank to keep the current password' : undefined}
            >
              <Input type="password" value={form.password || ''} onChange={(e) => set({ password: e.target.value })} placeholder={form.id ? '••••••••' : 'Set an initial password'} />
            </Field>
            <Field label="Carrier">
              <Select value={form.carrierId} onChange={(e) => set({ carrierId: e.target.value })}>
                <option value="">Unassigned</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      />

      <UserPermissionsModal
        open={!!permUser}
        onClose={() => setPermUser(null)}
        userId={permUser?.id}
        userName={permUser?.fullName}
      />
    </>
  )
}
