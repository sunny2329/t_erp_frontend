import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { SearchSelect } from '../ui/SearchSelect'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { carriersApi } from '../../services/masterApi'
import { carrierDetailAdapter, blankCarrierDetail } from '../../services/adapters'
import { useData } from '../../context/DataContext'

// Full carrier master, mirroring the legacy ss_save_carriers_master_v1 save
// shape: general fields + contact + dispatch + liability/cargo insurance +
// certification + settlement (default pay terms, not the excluded
// Settlement/invoicing module) + factoring + remit/billing/bank info.
//
// carrier_details (the ~70-column compliance/transport-mode/equipment-class
// table) is deliberately NOT exposed here. Per SCHEMA_ASSUMPTIONS.md it
// includes a `dtl_*` block that just duplicates the carrier's own identity
// fields (dtl_mc_number mirrors carriers.mc_number, etc.) — the rest is
// dozens of boolean feature flags with no product spec behind them yet.
// Add a "Compliance" tab here if/when that's needed.
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'contact', label: 'Contact' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'certification', label: 'Certification' },
  { id: 'settlement', label: 'Settlement' },
  { id: 'factoring', label: 'Factoring' },
  { id: 'billing', label: 'Remit & Billing' },
]

// Fixed contact-type options, matching the reference Loadx-Youngs-Frontend's
// hardcoded CONTACT_TYPE_OPTIONS (CarriersIndex.jsx) — not type_master-backed,
// since type_id=5 there holds an unrelated "Primary Contact/Remit Details/…"
// category.
const CONTACT_TYPE_OPTIONS = [
  { value: '1', label: 'Primary' },
  { value: '2', label: 'Billing' },
  { value: '3', label: 'Operations' },
  { value: '4', label: 'Dispatch' },
  { value: '5', label: 'Safety' },
]

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

// type_master-backed select — options come live from GET /dropdown/types via
// DataContext.typeOptions, keyed by the category's type_id (see
// t_erp_backend SCHEMA_ASSUMPTIONS.md: type_master(type_id, id, description)).
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

export function CarrierDrawer({ open, onClose, carrierId, onSaved }) {
  const { typeOptions } = useData()
  const [form, setForm] = useState(blankCarrierDetail())
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveTab('general')
    if (carrierId) {
      setLoading(true)
      carriersApi
        .getById(carrierId)
        .then((row) => setForm(carrierDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load carrier'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankCarrierDetail())
    }
  }, [open, carrierId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setSection = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }))

  const setLiabilityRow = (index, patch) =>
    setForm((f) => ({ ...f, liability: f.liability.map((row, i) => (i === index ? { ...row, ...patch } : row)) }))
  const addLiabilityRow = () =>
    setForm((f) => ({ ...f, liability: [...f.liability, { id: null, typeId: '', phone: '', agentName: '', agentPhone: '', agentEmail: '', policyNumber: '', expiration: '', amtLimit: '', city: '', state: '', country: '', fax: '', deductable: '', contactRemark: '', companyName: '', zipcode: '' }] }))
  const removeLiabilityRow = (index) =>
    setForm((f) => ({ ...f, liability: f.liability.filter((_, i) => i !== index) }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Carrier name is required')
      setActiveTab('general')
      return
    }
    setSaving(true)
    try {
      const payload = carrierDetailAdapter.toApi(form)
      if (carrierId) {
        await carriersApi.update(carrierId, payload)
        toast.success('Carrier updated')
      } else {
        await carriersApi.create(payload)
        toast.success('Carrier created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save carrier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={carrierId ? `Edit Carrier${form.name ? ' — ' + form.name : ''}` : 'Add Carrier'}
      subtitle="Full carrier master — general info, contacts, insurance, certification, default pay terms, factoring"
      width="max-w-4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Carrier'}</Button>
        </>
      }
    >
      <div className="-mt-1 mb-5 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading carrier…</div>
      ) : (
        <>
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Carrier Name" required>
                  <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label="Authority Type">
                  <Select value={form.authorityType} onChange={(e) => set({ authorityType: Number(e.target.value) })}>
                    {(typeOptions[2]?.length ? typeOptions[2] : [{ id: 1, label: 'Managed Authority' }, { id: 2, label: 'External Carrier' }]).map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Contact Person">
                  <Input value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} />
                </Field>
                <Field label="DBA Name">
                  <Input value={form.dbaName} onChange={(e) => set({ dbaName: e.target.value })} />
                </Field>
                <Field label="MC Number">
                  <Input value={form.mcNumber} onChange={(e) => set({ mcNumber: e.target.value })} />
                </Field>
                <Field label="DOT Number">
                  <Input value={form.dotNumber} onChange={(e) => set({ dotNumber: e.target.value })} />
                </Field>
                <Field label="SCAC Code">
                  <Input value={form.scacCode} onChange={(e) => set({ scacCode: e.target.value })} />
                </Field>
                <Field label="Fed Tax ID">
                  <Input value={form.fedTaxId} onChange={(e) => set({ fedTaxId: e.target.value })} />
                </Field>
                <Field label="Custom Carrier ID">
                  <Input value={form.customCarrierId} onChange={(e) => set({ customCarrierId: e.target.value })} />
                </Field>
                <Field label="Service Type">
                  <TypeSelect options={typeOptions[1] || []} value={form.serviceTypeId} onChange={(v) => set({ serviceTypeId: v })} placeholder="Select service type" />
                </Field>
                <Field label="Fleet Size">
                  <Input type="number" value={form.fleetSize} onChange={(e) => set({ fleetSize: e.target.value })} />
                </Field>
                <Field label="Total Power Units">
                  <Input type="number" value={form.totalPowerUnits} onChange={(e) => set({ totalPowerUnits: e.target.value })} />
                </Field>
                <Field label="Num Vehicles">
                  <Input type="number" value={form.numVehicles} onChange={(e) => set({ numVehicles: e.target.value })} />
                </Field>
              </Grid>
              <div className="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Toggle checked={form.reeferEquipment} onChange={(v) => set({ reeferEquipment: v })} label="Reefer equipment" />
                <Toggle checked={form.vanEquipment} onChange={(v) => set({ vanEquipment: v })} label="Van equipment" />
                <Toggle checked={form.flatbedStepdeckEquipment} onChange={(v) => set({ flatbedStepdeckEquipment: v })} label="Flatbed / stepdeck" />
                <Toggle checked={form.track1099} onChange={(v) => set({ track1099: v })} label="Track 1099" />
                <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Active" />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Contact Type">
                  <SearchSelect
                    options={CONTACT_TYPE_OPTIONS}
                    value={form.contact.typeId}
                    onChange={(v) => setSection('contact', { typeId: v })}
                    placeholder="Select contact type"
                    clearable={false}
                  />
                </Field>
                <Field label="Contact Person">
                  <Input value={form.contact.contactPerson} onChange={(e) => setSection('contact', { contactPerson: e.target.value })} />
                </Field>
                <Field label="Website">
                  <Input value={form.contact.website} onChange={(e) => setSection('contact', { website: e.target.value })} />
                </Field>
                <Field label="Address Line 1">
                  <Input value={form.contact.addressLine1} onChange={(e) => setSection('contact', { addressLine1: e.target.value })} />
                </Field>
                <Field label="Address Line 2">
                  <Input value={form.contact.addressLine2} onChange={(e) => setSection('contact', { addressLine2: e.target.value })} />
                </Field>
                <Field label="City">
                  <Input value={form.contact.city} onChange={(e) => setSection('contact', { city: e.target.value })} />
                </Field>
                <Field label="State">
                  <Input value={form.contact.state} onChange={(e) => setSection('contact', { state: e.target.value })} />
                </Field>
                <Field label="Country">
                  <Input value={form.contact.country} onChange={(e) => setSection('contact', { country: e.target.value })} />
                </Field>
                <Field label="Zipcode">
                  <Input value={form.contact.zipcode} onChange={(e) => setSection('contact', { zipcode: e.target.value })} />
                </Field>
                <Field label="Phone" hint="Digits only, stored as a number">
                  <Input value={form.contact.phone} onChange={(e) => setSection('contact', { phone: e.target.value })} />
                </Field>
                <Field label="Fax" hint="Digits only, stored as a number">
                  <Input value={form.contact.fax} onChange={(e) => setSection('contact', { fax: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.contact.email} onChange={(e) => setSection('contact', { email: e.target.value })} />
                </Field>
              </Grid>
              <Field label="Notes">
                <Textarea rows={3} value={form.contact.notes} onChange={(e) => setSection('contact', { notes: e.target.value })} />
              </Field>
            </div>
          )}

          {activeTab === 'dispatch' && (
            <Grid>
              <Field label="Contact Name">
                <Input value={form.dispatch.contactName} onChange={(e) => setSection('dispatch', { contactName: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.dispatch.email} onChange={(e) => setSection('dispatch', { email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={form.dispatch.phone} onChange={(e) => setSection('dispatch', { phone: e.target.value })} />
              </Field>
              <Field label="Phone 2">
                <Input value={form.dispatch.phone2} onChange={(e) => setSection('dispatch', { phone2: e.target.value })} />
              </Field>
              <Field label="Phone 3">
                <Input value={form.dispatch.phone3} onChange={(e) => setSection('dispatch', { phone3: e.target.value })} />
              </Field>
            </Grid>
          )}

          {activeTab === 'insurance' && (
            <div className="space-y-5">
              <Section
                title="Liability"
                actions={
                  <Button size="sm" variant="secondary" onClick={addLiabilityRow}>
                    <Plus className="h-3.5 w-3.5" /> Add policy
                  </Button>
                }
              >
                <div className="space-y-4">
                  {form.liability.map((row, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Policy {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeLiabilityRow(i)}
                          disabled={form.liability.length <= 1}
                          className="rounded p-1 text-red-400 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Grid>
                        <Field label="Type">
                          <TypeSelect options={typeOptions[3] || []} value={row.typeId} onChange={(v) => setLiabilityRow(i, { typeId: v })} placeholder="Select policy type" />
                        </Field>
                        <Field label="Company Name">
                          <Input value={row.companyName} onChange={(e) => setLiabilityRow(i, { companyName: e.target.value })} />
                        </Field>
                        <Field label="Policy Number">
                          <Input value={row.policyNumber} onChange={(e) => setLiabilityRow(i, { policyNumber: e.target.value })} />
                        </Field>
                        <Field label="Phone">
                          <Input value={row.phone} onChange={(e) => setLiabilityRow(i, { phone: e.target.value })} />
                        </Field>
                        <Field label="Expiration">
                          <Input type="date" value={row.expiration} onChange={(e) => setLiabilityRow(i, { expiration: e.target.value })} />
                        </Field>
                        <Field label="Amount Limit">
                          <Input type="number" value={row.amtLimit} onChange={(e) => setLiabilityRow(i, { amtLimit: e.target.value })} />
                        </Field>
                        <Field label="Deductible">
                          <Input value={row.deductable} onChange={(e) => setLiabilityRow(i, { deductable: e.target.value })} />
                        </Field>
                        <Field label="Agent Name">
                          <Input value={row.agentName} onChange={(e) => setLiabilityRow(i, { agentName: e.target.value })} />
                        </Field>
                        <Field label="Agent Phone">
                          <Input value={row.agentPhone} onChange={(e) => setLiabilityRow(i, { agentPhone: e.target.value })} />
                        </Field>
                        <Field label="Agent Email">
                          <Input type="email" value={row.agentEmail} onChange={(e) => setLiabilityRow(i, { agentEmail: e.target.value })} />
                        </Field>
                        <Field label="City">
                          <Input value={row.city} onChange={(e) => setLiabilityRow(i, { city: e.target.value })} />
                        </Field>
                        <Field label="State">
                          <Input value={row.state} onChange={(e) => setLiabilityRow(i, { state: e.target.value })} />
                        </Field>
                        <Field label="Fax">
                          <Input value={row.fax} onChange={(e) => setLiabilityRow(i, { fax: e.target.value })} />
                        </Field>
                      </Grid>
                      <Field label="Remark" className="mt-3">
                        <Input value={row.contactRemark} onChange={(e) => setLiabilityRow(i, { contactRemark: e.target.value })} />
                      </Field>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Cargo Insurance">
                <Grid>
                  <Field label="Company">
                    <Input value={form.cargoInsurance.company} onChange={(e) => setSection('cargoInsurance', { company: e.target.value })} />
                  </Field>
                  <Field label="Policy Number">
                    <Input value={form.cargoInsurance.policyNumber} onChange={(e) => setSection('cargoInsurance', { policyNumber: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.cargoInsurance.phone} onChange={(e) => setSection('cargoInsurance', { phone: e.target.value })} />
                  </Field>
                  <Field label="Expiration">
                    <Input type="date" value={form.cargoInsurance.expiration} onChange={(e) => setSection('cargoInsurance', { expiration: e.target.value })} />
                  </Field>
                  <Field label="Coverage Limit">
                    <Input type="number" value={form.cargoInsurance.coverageLimit} onChange={(e) => setSection('cargoInsurance', { coverageLimit: e.target.value })} />
                  </Field>
                  <Field label="Deductible">
                    <Input type="number" value={form.cargoInsurance.deductible} onChange={(e) => setSection('cargoInsurance', { deductible: e.target.value })} />
                  </Field>
                  <Field label="Agent">
                    <Input value={form.cargoInsurance.agent} onChange={(e) => setSection('cargoInsurance', { agent: e.target.value })} />
                  </Field>
                  <Field label="Agent Phone">
                    <Input value={form.cargoInsurance.agentPhone} onChange={(e) => setSection('cargoInsurance', { agentPhone: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={form.cargoInsurance.email} onChange={(e) => setSection('cargoInsurance', { email: e.target.value })} />
                  </Field>
                  <Field label="City">
                    <Input value={form.cargoInsurance.city} onChange={(e) => setSection('cargoInsurance', { city: e.target.value })} />
                  </Field>
                  <Field label="State">
                    <Input value={form.cargoInsurance.state} onChange={(e) => setSection('cargoInsurance', { state: e.target.value })} />
                  </Field>
                  <Field label="Zip Code">
                    <Input value={form.cargoInsurance.zipCode} onChange={(e) => setSection('cargoInsurance', { zipCode: e.target.value })} />
                  </Field>
                  <Field label="Fax">
                    <Input value={form.cargoInsurance.fax} onChange={(e) => setSection('cargoInsurance', { fax: e.target.value })} />
                  </Field>
                </Grid>
                <Field label="Notes" className="mt-3">
                  <Textarea rows={2} value={form.cargoInsurance.notes} onChange={(e) => setSection('cargoInsurance', { notes: e.target.value })} />
                </Field>
              </Section>
            </div>
          )}

          {activeTab === 'certification' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Hazmat Number">
                  <Input value={form.certification.hazmatNumber} onChange={(e) => setSection('certification', { hazmatNumber: e.target.value })} />
                </Field>
                <Field label="CTPAT Number">
                  <Input value={form.certification.ctpatNumber} onChange={(e) => setSection('certification', { ctpatNumber: e.target.value })} />
                </Field>
                <Field label="Tanker Endorsed Number">
                  <Input value={form.certification.tankerEndorsedNumber} onChange={(e) => setSection('certification', { tankerEndorsedNumber: e.target.value })} />
                </Field>
              </Grid>
              <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Toggle checked={form.certification.isHazmat} onChange={(v) => setSection('certification', { isHazmat: v })} label="Hazmat" />
                <Toggle checked={form.certification.isSmartWay} onChange={(v) => setSection('certification', { isSmartWay: v })} label="SmartWay" />
                <Toggle checked={form.certification.isCarb} onChange={(v) => setSection('certification', { isCarb: v })} label="CARB" />
                <Toggle checked={form.certification.isTwic} onChange={(v) => setSection('certification', { isTwic: v })} label="TWIC" />
                <Toggle checked={form.certification.isCtpatCertified} onChange={(v) => setSection('certification', { isCtpatCertified: v })} label="CTPAT certified" />
                <Toggle checked={form.certification.isTankerEndorsed} onChange={(v) => setSection('certification', { isTankerEndorsed: v })} label="Tanker endorsed" />
              </div>
            </div>
          )}

          {activeTab === 'settlement' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Default pay terms stored on the carrier record — not the settlement/invoicing workflow.
              </p>
              <Grid>
                <Field label="Payment Net Term (days)" hint="Number of days">
                  <Input type="number" value={form.settlement.paymentNetTermTypeId} onChange={(e) => setSection('settlement', { paymentNetTermTypeId: e.target.value })} />
                </Field>
                <Field label="Pay Method" hint="Defaults to the first option if left blank">
                  <TypeSelect options={typeOptions[12] || []} value={form.settlement.payMethodTypeId} onChange={(v) => setSection('settlement', { payMethodTypeId: v })} placeholder="Select pay method" />
                </Field>
                <Field label="Pay per Mile">
                  <Input type="number" value={form.settlement.carrierPayPerMile} onChange={(e) => setSection('settlement', { carrierPayPerMile: e.target.value })} />
                </Field>
                <Field label="Empty Mile Pay">
                  <Input type="number" value={form.settlement.carrierPayEmptyMile} onChange={(e) => setSection('settlement', { carrierPayEmptyMile: e.target.value })} />
                </Field>
                <Field label="Detention Rate">
                  <Input type="number" value={form.settlement.detentionRate} onChange={(e) => setSection('settlement', { detentionRate: e.target.value })} />
                </Field>
                <Field label="Detention %">
                  <Input type="number" value={form.settlement.detentionPercentage} onChange={(e) => setSection('settlement', { detentionPercentage: e.target.value })} />
                </Field>
                <Field label="Layover Rate">
                  <Input type="number" value={form.settlement.layoverRate} onChange={(e) => setSection('settlement', { layoverRate: e.target.value })} />
                </Field>
                <Field label="Layover %">
                  <Input type="number" value={form.settlement.layoverPercentage} onChange={(e) => setSection('settlement', { layoverPercentage: e.target.value })} />
                </Field>
                <Field label="Other (Flat)">
                  <Input type="number" value={form.settlement.otherFlat} onChange={(e) => setSection('settlement', { otherFlat: e.target.value })} />
                </Field>
                <Field label="Other %">
                  <Input type="number" value={form.settlement.otherPercentage} onChange={(e) => setSection('settlement', { otherPercentage: e.target.value })} />
                </Field>
                <Field label="Hourly Rate">
                  <Input type="number" value={form.settlement.hourlyRate} onChange={(e) => setSection('settlement', { hourlyRate: e.target.value })} />
                </Field>
                <Field label="Overtime Rate">
                  <Input type="number" value={form.settlement.overtimeRate} onChange={(e) => setSection('settlement', { overtimeRate: e.target.value })} />
                </Field>
                <Field label="Per Stop Pay">
                  <Input type="number" value={form.settlement.perStopPay} onChange={(e) => setSection('settlement', { perStopPay: e.target.value })} />
                </Field>
                <Field label="After Stop">
                  <Input type="number" value={form.settlement.afterStop} onChange={(e) => setSection('settlement', { afterStop: e.target.value })} />
                </Field>
                <Field label="Invoice %">
                  <Input type="number" value={form.settlement.invoicePercentage} onChange={(e) => setSection('settlement', { invoicePercentage: e.target.value })} />
                </Field>
                <Field label="Fuel Surcharge %">
                  <Input type="number" value={form.settlement.fuelSurchargePercentage} onChange={(e) => setSection('settlement', { fuelSurchargePercentage: e.target.value })} />
                </Field>
                <Field label="Sales Tax">
                  <Input type="number" value={form.settlement.salesTax} onChange={(e) => setSection('settlement', { salesTax: e.target.value })} />
                </Field>
              </Grid>
              <Toggle checked={form.settlement.active} onChange={(v) => setSection('settlement', { active: v })} label="Active" />
            </div>
          )}

          {activeTab === 'factoring' && (
            <div className="space-y-5">
              <Section title="Factoring Company">
                <Grid>
                  <Field label="Name">
                    <Input value={form.factoringCompany.name} onChange={(e) => setSection('factoringCompany', { name: e.target.value })} />
                  </Field>
                  <Field label="Contact Person">
                    <Input value={form.factoringCompany.contactPerson} onChange={(e) => setSection('factoringCompany', { contactPerson: e.target.value })} />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <Input value={form.factoringCompany.address} onChange={(e) => setSection('factoringCompany', { address: e.target.value })} />
                  </Field>
                  <Field label="City">
                    <Input value={form.factoringCompany.city} onChange={(e) => setSection('factoringCompany', { city: e.target.value })} />
                  </Field>
                  <Field label="State">
                    <Input value={form.factoringCompany.state} onChange={(e) => setSection('factoringCompany', { state: e.target.value })} />
                  </Field>
                  <Field label="Country">
                    <Input value={form.factoringCompany.country} onChange={(e) => setSection('factoringCompany', { country: e.target.value })} />
                  </Field>
                  <Field label="Zip Code">
                    <Input value={form.factoringCompany.zipCode} onChange={(e) => setSection('factoringCompany', { zipCode: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.factoringCompany.phone} onChange={(e) => setSection('factoringCompany', { phone: e.target.value })} />
                  </Field>
                  <Field label="Fax">
                    <Input value={form.factoringCompany.fax} onChange={(e) => setSection('factoringCompany', { fax: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={form.factoringCompany.email} onChange={(e) => setSection('factoringCompany', { email: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <Input value={form.factoringCompany.website} onChange={(e) => setSection('factoringCompany', { website: e.target.value })} />
                  </Field>
                </Grid>
              </Section>

              <Section title="Invoice Payable To">
                <Grid>
                  <Field label="Name">
                    <Input value={form.invoicePayableTo.name} onChange={(e) => setSection('invoicePayableTo', { name: e.target.value })} />
                  </Field>
                  <Field label="Contact Person">
                    <Input value={form.invoicePayableTo.contactPerson} onChange={(e) => setSection('invoicePayableTo', { contactPerson: e.target.value })} />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <Input value={form.invoicePayableTo.address} onChange={(e) => setSection('invoicePayableTo', { address: e.target.value })} />
                  </Field>
                  <Field label="City">
                    <Input value={form.invoicePayableTo.city} onChange={(e) => setSection('invoicePayableTo', { city: e.target.value })} />
                  </Field>
                  <Field label="State">
                    <Input value={form.invoicePayableTo.state} onChange={(e) => setSection('invoicePayableTo', { state: e.target.value })} />
                  </Field>
                  <Field label="Country">
                    <Input value={form.invoicePayableTo.country} onChange={(e) => setSection('invoicePayableTo', { country: e.target.value })} />
                  </Field>
                  <Field label="Zip Code">
                    <Input value={form.invoicePayableTo.zipCode} onChange={(e) => setSection('invoicePayableTo', { zipCode: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.invoicePayableTo.phone} onChange={(e) => setSection('invoicePayableTo', { phone: e.target.value })} />
                  </Field>
                  <Field label="Fax">
                    <Input value={form.invoicePayableTo.fax} onChange={(e) => setSection('invoicePayableTo', { fax: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={form.invoicePayableTo.email} onChange={(e) => setSection('invoicePayableTo', { email: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <Input value={form.invoicePayableTo.website} onChange={(e) => setSection('invoicePayableTo', { website: e.target.value })} />
                  </Field>
                </Grid>
              </Section>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-5">
              <Section title="Remit To">
                <Grid>
                  <Field label="Remit Name">
                    <Input value={form.remitName} onChange={(e) => set({ remitName: e.target.value })} />
                  </Field>
                  <Field label="Remit Address">
                    <Input value={form.remitAddress} onChange={(e) => set({ remitAddress: e.target.value })} />
                  </Field>
                  <Field label="City">
                    <Input value={form.remitCity} onChange={(e) => set({ remitCity: e.target.value })} />
                  </Field>
                  <Field label="State">
                    <Input value={form.remitState} onChange={(e) => set({ remitState: e.target.value })} />
                  </Field>
                  <Field label="Country">
                    <Input value={form.remitCountry} onChange={(e) => set({ remitCountry: e.target.value })} />
                  </Field>
                  <Field label="Zip Code">
                    <Input value={form.remitZipCode} onChange={(e) => set({ remitZipCode: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.remitPhone} onChange={(e) => set({ remitPhone: e.target.value })} />
                  </Field>
                  <Field label="Fax">
                    <Input value={form.remitFax} onChange={(e) => set({ remitFax: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={form.remitEmail} onChange={(e) => set({ remitEmail: e.target.value })} />
                  </Field>
                </Grid>
              </Section>

              <Section title="Bill To">
                <Grid>
                  <Field label="Bill To Email">
                    <Input type="email" value={form.billToEmail} onChange={(e) => set({ billToEmail: e.target.value })} />
                  </Field>
                  <Field label="Bill To Address">
                    <Input value={form.billToAddress} onChange={(e) => set({ billToAddress: e.target.value })} />
                  </Field>
                </Grid>
                <Field label="Bill To Instructions" className="mt-3">
                  <Textarea rows={2} value={form.billToInstructions} onChange={(e) => set({ billToInstructions: e.target.value })} />
                </Field>
              </Section>

              <Section title="Bank Info">
                <Grid>
                  <Field label="Routing Number">
                    <Input value={form.bankRoutingNumber} onChange={(e) => set({ bankRoutingNumber: e.target.value })} />
                  </Field>
                  <Field label="Account Number">
                    <Input value={form.bankAccountNumber} onChange={(e) => set({ bankAccountNumber: e.target.value })} />
                  </Field>
                  <Field label="Account Name">
                    <Input value={form.bankAccountName} onChange={(e) => set({ bankAccountName: e.target.value })} />
                  </Field>
                  <Field label="Account Type">
                    <Input value={form.bankAccountType} onChange={(e) => set({ bankAccountType: e.target.value })} />
                  </Field>
                  <Field label="Bank Name">
                    <Input value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} />
                  </Field>
                  <Field label="Bank Address">
                    <Input value={form.bankAddress} onChange={(e) => set({ bankAddress: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.bankPhone} onChange={(e) => set({ bankPhone: e.target.value })} />
                  </Field>
                  <Field label="Fax">
                    <Input value={form.bankFax} onChange={(e) => set({ bankFax: e.target.value })} />
                  </Field>
                </Grid>
              </Section>

              <Section title="NetSuite">
                <Grid>
                  <Field label="Subsidiary Name">
                    <Input value={form.netsuiteSubsidiaryName} onChange={(e) => set({ netsuiteSubsidiaryName: e.target.value })} />
                  </Field>
                  <Field label="Account 1099">
                    <Input value={form.netsuiteAccount1099} onChange={(e) => set({ netsuiteAccount1099: e.target.value })} />
                  </Field>
                  <Field label="PO Expense Account">
                    <Input value={form.netsuitePoExpenseAccount} onChange={(e) => set({ netsuitePoExpenseAccount: e.target.value })} />
                  </Field>
                </Grid>
              </Section>
            </div>
          )}
        </>
      )}
    </Drawer>
  )
}
