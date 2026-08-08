import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { vehiclesApi } from '../../services/masterApi'
import { vehicleDetailAdapter, blankVehicleDetail } from '../../services/adapters'
import { useData } from '../../context/DataContext'

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

function TypeSelect({ options, value, onChange, placeholder = 'Select…' }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </Select>
  )
}

// Full vehicle master, mirroring the legacy ss_save_vehicles save shape — see
// vehicleDetailAdapter in services/adapters.js for exactly which fields were
// left out (license_state_id, fleet_group_id) and why.
export function VehicleDrawer({ open, onClose, vehicleId, onSaved }) {
  const { carriers, terminals, typeOptions } = useData()
  const [form, setForm] = useState(blankVehicleDetail())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (vehicleId) {
      setLoading(true)
      vehiclesApi
        .getById(vehicleId)
        .then((row) => setForm(vehicleDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load vehicle'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankVehicleDetail())
    }
  }, [open, vehicleId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  // Lease carrier is an external/broker carrier you lease the vehicle from —
  // matches the reference frontend's authority_type !== 'Managed Authority' filter.
  const leaseCarriers = carriers.filter((c) => c.authorityType === 2)

  const handleSave = async () => {
    if (!form.regNumber.trim()) {
      toast.error('Truck number is required')
      return
    }
    setSaving(true)
    try {
      const payload = vehicleDetailAdapter.toApi(form)
      if (vehicleId) {
        await vehiclesApi.update(vehicleId, payload)
        toast.success('Vehicle updated')
      } else {
        await vehiclesApi.create(payload)
        toast.success('Vehicle created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={vehicleId ? `Edit Vehicle${form.regNumber ? ' — ' + form.regNumber : ''}` : 'Add Vehicle'}
      subtitle="Full vehicle master"
      width="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Vehicle'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading vehicle…</div>
      ) : (
        <div className="space-y-5">
          <Section title="Basic Info">
            <Grid>
              <Field label="Truck No." required>
                <Input value={form.regNumber} onChange={(e) => set({ regNumber: e.target.value })} placeholder="e.g., VEH-0001" />
              </Field>
              <Field label="Truck Alias">
                <Input value={form.trackName} onChange={(e) => set({ trackName: e.target.value })} placeholder="e.g., Big Red" />
              </Field>
              <Field label="Vehicle Type">
                <TypeSelect options={typeOptions[8] || []} value={form.vehicleTypeId} onChange={(v) => set({ vehicleTypeId: v })} placeholder="Select type" />
              </Field>
              <Field label="Terminal">
                <Select value={form.terminalId} onChange={(e) => set({ terminalId: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Carrier">
                <Select value={form.carrierId} onChange={(e) => set({ carrierId: e.target.value })}>
                  <option value="">Select carrier</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </Grid>
            <div className="mt-3 flex flex-wrap gap-6">
              <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Active" />
              <Toggle checked={form.isOwnerOperated} onChange={(v) => set({ isOwnerOperated: v })} label="Owner operated" />
              <Toggle checked={form.isCameraInstalled} onChange={(v) => set({ isCameraInstalled: v })} label="Camera installed" />
              <Toggle checked={form.isApuInstalled} onChange={(v) => set({ isApuInstalled: v })} label="APU installed" />
            </div>
          </Section>

          <Section title="Vehicle Details">
            <Grid>
              <Field label="Make">
                <Input value={form.make} onChange={(e) => set({ make: e.target.value })} placeholder="e.g., Freightliner" />
              </Field>
              <Field label="Model">
                <Input value={form.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g., Cascadia" />
              </Field>
              <Field label="Year">
                <Input type="number" value={form.year} onChange={(e) => set({ year: e.target.value })} placeholder="2020" />
              </Field>
              <Field label="VIN">
                <Input value={form.vin} onChange={(e) => set({ vin: e.target.value })} />
              </Field>
              <Field label="Integration ID">
                <Input value={form.integrationId} onChange={(e) => set({ integrationId: e.target.value })} />
              </Field>
              <Field label="Prepass Number">
                <Input value={form.prepassNumber} onChange={(e) => set({ prepassNumber: e.target.value })} />
              </Field>
            </Grid>
            <Field label="Notes" className="mt-3">
              <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
          </Section>

          <Section title="License & Registration">
            <Grid>
              <Field label="License Number">
                <Input value={form.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} placeholder="CA 123456" />
              </Field>
              <Field label="Registration Date">
                <Input type="date" value={form.registrationDate} onChange={(e) => set({ registrationDate: e.target.value })} />
              </Field>
              <Field label="License Expiration Date">
                <Input type="date" value={form.regExpiryDate} onChange={(e) => set({ regExpiryDate: e.target.value })} />
              </Field>
              <Field label="Purchase Date">
                <Input type="date" value={form.purchaseDate} onChange={(e) => set({ purchaseDate: e.target.value })} />
              </Field>
              <Field label="In Service From">
                <Input type="date" value={form.inServiceFrom} onChange={(e) => set({ inServiceFrom: e.target.value })} />
              </Field>
              <Field label="Expire Date">
                <Input type="date" value={form.expireDate} onChange={(e) => set({ expireDate: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Dates & Inspection">
            <Grid>
              <Field label="Inspection Expiration">
                <Input type="date" value={form.inspectionExpiration} onChange={(e) => set({ inspectionExpiration: e.target.value })} />
              </Field>
              <Field label="Insurance Renewal Date">
                <Input type="date" value={form.insuranceRenewalDate} onChange={(e) => set({ insuranceRenewalDate: e.target.value })} />
              </Field>
              <Field label="Last Maintenance Date">
                <Input type="date" value={form.lastMaintenanceDate} onChange={(e) => set({ lastMaintenanceDate: e.target.value })} />
              </Field>
              <Field label="Sold Date">
                <Input type="date" value={form.soldDate} onChange={(e) => set({ soldDate: e.target.value })} />
              </Field>
              <Field label="Sold Price">
                <Input type="number" value={form.soldPrice} onChange={(e) => set({ soldPrice: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Performance & Financials">
            <Grid>
              <Field label="Tank Capacity">
                <Input type="number" value={form.tankCapacity} onChange={(e) => set({ tankCapacity: e.target.value })} placeholder="150" />
              </Field>
              <Field label="Average MPG">
                <Input type="number" step="0.1" value={form.averageMpg} onChange={(e) => set({ averageMpg: e.target.value })} placeholder="6.5" />
              </Field>
              <Field label="DEF Level">
                <Input type="number" min="0" max="100" value={form.defLevel} onChange={(e) => set({ defLevel: e.target.value })} placeholder="75" />
              </Field>
              <Field label="Starting Mileage">
                <Input type="number" value={form.startingMileage} onChange={(e) => set({ startingMileage: e.target.value })} />
              </Field>
              <Field label="Current Mileage">
                <Input type="number" value={form.currentMileage} onChange={(e) => set({ currentMileage: e.target.value })} />
              </Field>
              <Field label="Mortgage Cost">
                <Input type="number" value={form.mortgageCost} onChange={(e) => set({ mortgageCost: e.target.value })} />
              </Field>
              <Field label="Annual Insurance Cost">
                <Input type="number" value={form.annualInsuranceCost} onChange={(e) => set({ annualInsuranceCost: e.target.value })} />
              </Field>
              <Field label="Annual Plate Cost">
                <Input type="number" value={form.annualPlateCost} onChange={(e) => set({ annualPlateCost: e.target.value })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Lease Information">
            <Toggle checked={form.isLease} onChange={(v) => set({ isLease: v })} label="Is lease" />
            <div className="mt-3">
              <Grid>
                <Field label="Lease Carrier" className="sm:col-span-2" hint="External/broker carriers only">
                  <Select value={form.leaseCarrierId} onChange={(e) => set({ leaseCarrierId: e.target.value })}>
                    <option value="">Select lease carrier</option>
                    {leaseCarriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Lease Start Date">
                  <Input type="date" value={form.leaseStartDate} onChange={(e) => set({ leaseStartDate: e.target.value })} />
                </Field>
                <Field label="Lease End Date">
                  <Input type="date" value={form.leaseEndDate} onChange={(e) => set({ leaseEndDate: e.target.value })} />
                </Field>
              </Grid>
            </div>
          </Section>
        </div>
      )}
    </Drawer>
  )
}
