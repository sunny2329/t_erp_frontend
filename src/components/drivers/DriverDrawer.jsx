import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { PhoneInput } from '../ui/PhoneInput'
import { AddressAutocomplete } from '../ui/AddressAutocomplete'
import { Select } from '../ui/Select'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { Section } from '../ui/Section'
import { driversApi } from '../../services/masterApi'
import { driverDetailAdapter, blankDriverDetail } from '../../services/adapters'
import { useData } from '../../context/DataContext'

// Full driver master, mirroring the legacy ss_save_driver_master save shape —
// see driverDetailAdapter in services/adapters.js for exactly which fields
// were left out (state_id, accounting) and why.
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'contact', label: 'Contact' },
  { id: 'details', label: 'Details' },
  { id: 'endorsements', label: 'Endorsements' },
  { id: 'rateCard', label: 'Rate Card' },
  { id: 'teamRateCard', label: 'Team Rate Card' },
  { id: 'payables', label: 'Payables' },
]

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

export function DriverDrawer({ open, onClose, driverId, onSaved }) {
  const { carriers, terminals, typeOptions } = useData()
  const [form, setForm] = useState(blankDriverDetail())
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveTab('general')
    if (driverId) {
      setLoading(true)
      driversApi
        .getById(driverId)
        .then((row) => setForm(driverDetailAdapter.fromApi(row)))
        .catch((err) => toast.error(err.message || 'Failed to load driver'))
        .finally(() => setLoading(false))
    } else {
      setForm(blankDriverDetail())
    }
  }, [open, driverId])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setSection = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }))

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required')
      setActiveTab('general')
      return
    }
    if (!form.carrierId) {
      toast.error('Carrier is required')
      setActiveTab('assignment')
      return
    }
    setSaving(true)
    try {
      const carrierName = carriers.find((c) => c.id === form.payables.payableToCarrierId)?.name
      const payload = driverDetailAdapter.toApi(form, { carrierName })
      if (driverId) {
        await driversApi.update(driverId, payload)
        toast.success('Driver updated')
      } else {
        await driversApi.create(payload)
        toast.success('Driver created')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save driver')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={driverId ? `Edit Driver${form.firstName ? ' — ' + form.firstName + ' ' + form.lastName : ''}` : 'Add Driver'}
      subtitle="Full driver master"
      width="max-w-4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Driver'}</Button>
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
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading driver…</div>
      ) : (
        <>
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Grid>
                <Field label="First Name" required>
                  <Input value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
                </Field>
                <Field label="Middle Name">
                  <Input value={form.middleName} onChange={(e) => set({ middleName: e.target.value })} />
                </Field>
                <Field label="Last Name" required>
                  <Input value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
                </Field>
                <Field label="DBA Name">
                  <Input value={form.dbaName} onChange={(e) => set({ dbaName: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
                </Field>
                <Field label="Mobile Number" hint="Must be unique across drivers">
                  <Input value={form.mobileNo} onChange={(e) => set({ mobileNo: e.target.value })} />
                </Field>
                <Field label="Driver License">
                  <Input value={form.driverLicense} onChange={(e) => set({ driverLicense: e.target.value })} />
                </Field>
                <Field label="License Expiration">
                  <Input type="date" value={form.driverLicenseExpDt} onChange={(e) => set({ driverLicenseExpDt: e.target.value })} />
                </Field>
                <Field label="Username" hint="Must be unique across drivers">
                  <Input value={form.userName} onChange={(e) => set({ userName: e.target.value })} />
                </Field>
                <Field label="Integration ID">
                  <Input value={form.integrationId} onChange={(e) => set({ integrationId: e.target.value })} />
                </Field>
              </Grid>
              <Field label="Remark">
                <Input value={form.remark} onChange={(e) => set({ remark: e.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Active" />
                <Toggle checked={form.terminated} onChange={(v) => set({ terminated: v })} label="Terminated" />
                <Toggle checked={form.perDiem} onChange={(v) => set({ perDiem: v })} label="Per diem" />
                <Toggle checked={form.freezePay} onChange={(v) => set({ freezePay: v })} label="Freeze pay" />
                <Toggle checked={form.extraPay} onChange={(v) => set({ extraPay: v })} label="Extra pay" />
              </div>
            </div>
          )}

          {activeTab === 'assignment' && (
            <Grid>
              <Field label="Carrier" required>
                <Select value={form.carrierId} onChange={(e) => set({ carrierId: e.target.value })}>
                  <option value="">Select carrier</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Terminal">
                <Select value={form.terminalId} onChange={(e) => set({ terminalId: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Driver Type">
                <TypeSelect options={typeOptions[10] || []} value={form.driverTypeId} onChange={(v) => set({ driverTypeId: v })} placeholder="Select driver type" />
              </Field>
              <Field label="Route Type">
                <TypeSelect options={typeOptions[9] || []} value={form.routeTypeId} onChange={(v) => set({ routeTypeId: v })} placeholder="Select route type" />
              </Field>
              <Field label="Tax Form">
                <TypeSelect options={typeOptions[11] || []} value={form.taxFormId} onChange={(v) => set({ taxFormId: v })} placeholder="Select tax form" />
              </Field>
              <Field label="Driver Company ID" hint="Internal reference code">
                <Input type="number" value={form.driverCompanyId} onChange={(e) => set({ driverCompanyId: e.target.value })} />
              </Field>
              <Field label="Payroll ID">
                <Input value={form.payrollId} onChange={(e) => set({ payrollId: e.target.value })} />
              </Field>
              <Field label="UKG Cost Center Code">
                <Input value={form.ukgCostCenterCode} onChange={(e) => set({ ukgCostCenterCode: e.target.value })} />
              </Field>
            </Grid>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Address Line 1">
                  <AddressAutocomplete
                    value={form.contact.addressLine1}
                    onChange={(v) => setSection('contact', { addressLine1: v })}
                    onSelect={(place) => setSection('contact', { addressLine1: place.address, city: place.city, state: place.state, country: place.country || form.contact.country, zipcode: place.zipCode })}
                  />
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
                <Field label="Home City">
                  <Input value={form.contact.homeCity} onChange={(e) => setSection('contact', { homeCity: e.target.value })} />
                </Field>
                <Field label="Home State">
                  <Input value={form.contact.homeState} onChange={(e) => setSection('contact', { homeState: e.target.value })} />
                </Field>
                <Field label="Cell Phone">
                  <PhoneInput value={form.contact.cellPhone} onChange={(e) => setSection('contact', { cellPhone: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <PhoneInput value={form.contact.phone} onChange={(e) => setSection('contact', { phone: e.target.value })} />
                </Field>
                <Field label="Emergency Contact">
                  <Input value={form.contact.emergencyContact} onChange={(e) => setSection('contact', { emergencyContact: e.target.value })} />
                </Field>
                <Field label="Emergency Phone">
                  <PhoneInput value={form.contact.emergencyPhone} onChange={(e) => setSection('contact', { emergencyPhone: e.target.value })} />
                </Field>
                <Field label="SSN">
                  <Input value={form.contact.ssn} onChange={(e) => setSection('contact', { ssn: e.target.value })} />
                </Field>
                <Field label="Driver EIN Number">
                  <Input value={form.contact.einNumber} onChange={(e) => setSection('contact', { einNumber: e.target.value })} />
                </Field>
              </Grid>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Years of Experience">
                  <Input type="number" value={form.details.yearsOfExperience} onChange={(e) => setSection('details', { yearsOfExperience: e.target.value })} />
                </Field>
                <Field label="Date of Birth">
                  <Input type="date" value={form.details.dateOfBirth} onChange={(e) => setSection('details', { dateOfBirth: e.target.value })} />
                </Field>
                <Field label="Date of Join">
                  <Input type="date" value={form.details.dateOfJoin} onChange={(e) => setSection('details', { dateOfJoin: e.target.value })} />
                </Field>
                <Field label="Recruited By">
                  <Input value={form.details.recruitedBy} onChange={(e) => setSection('details', { recruitedBy: e.target.value })} />
                </Field>
                <Field label="Fleet Card Number">
                  <Input value={form.details.fleetCardNumber} onChange={(e) => setSection('details', { fleetCardNumber: e.target.value })} />
                </Field>
                <Field label="Avg Daily Mileage">
                  <Input type="number" value={form.details.avgDailyMileage} onChange={(e) => setSection('details', { avgDailyMileage: e.target.value })} />
                </Field>
                <Field label="Last Duty Status">
                  <Input value={form.details.lastDutyStatus} onChange={(e) => setSection('details', { lastDutyStatus: e.target.value })} />
                </Field>
                <Field label="Last Duty Time">
                  <Input type="datetime-local" value={form.details.lastDutyTime} onChange={(e) => setSection('details', { lastDutyTime: e.target.value })} />
                </Field>
                <Field label="Last Drug Test Date">
                  <Input type="date" value={form.details.lastDrugTestDate} onChange={(e) => setSection('details', { lastDrugTestDate: e.target.value })} />
                </Field>
                <Field label="Medical Expiration">
                  <Input type="date" value={form.details.medicalExpirationDate} onChange={(e) => setSection('details', { medicalExpirationDate: e.target.value })} />
                </Field>
                <Field label="Physical Expiration">
                  <Input type="date" value={form.details.physicalExpiration} onChange={(e) => setSection('details', { physicalExpiration: e.target.value })} />
                </Field>
                <Field label="TWIC Card Expiration">
                  <Input type="date" value={form.details.twicCardExpiration} onChange={(e) => setSection('details', { twicCardExpiration: e.target.value })} />
                </Field>
                <Field label="CDL Issuance Date">
                  <Input type="date" value={form.details.cdlIssuanceDate} onChange={(e) => setSection('details', { cdlIssuanceDate: e.target.value })} />
                </Field>
                <Field label="MVR Expiration">
                  <Input type="date" value={form.details.mvrExpirationDate} onChange={(e) => setSection('details', { mvrExpirationDate: e.target.value })} />
                </Field>
                <Field label="Clearing Date">
                  <Input type="datetime-local" value={form.details.clearingDate} onChange={(e) => setSection('details', { clearingDate: e.target.value })} />
                </Field>
              </Grid>
              <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Toggle checked={form.details.registeredForClearinghouse} onChange={(v) => setSection('details', { registeredForClearinghouse: v })} label="Registered for clearinghouse" />
                <Toggle checked={form.details.drugAlcoholPositiveTests} onChange={(v) => setSection('details', { drugAlcoholPositiveTests: v })} label="Drug/alcohol positive tests" />
                <Toggle checked={form.details.revokedLicenses} onChange={(v) => setSection('details', { revokedLicenses: v })} label="Revoked licenses" />
                <Toggle checked={form.details.drivingConvictions} onChange={(v) => setSection('details', { drivingConvictions: v })} label="Driving convictions" />
                <Toggle checked={form.details.drugAlcoholConvictions} onChange={(v) => setSection('details', { drugAlcoholConvictions: v })} label="Drug/alcohol convictions" />
              </div>
            </div>
          )}

          {activeTab === 'endorsements' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <Toggle checked={form.endorsements.hazardousMaterials} onChange={(v) => setSection('endorsements', { hazardousMaterials: v })} label="Hazardous materials" />
                <Toggle checked={form.endorsements.tankVehicles} onChange={(v) => setSection('endorsements', { tankVehicles: v })} label="Tank vehicles" />
                <Toggle checked={form.endorsements.doubleTripleTrailers} onChange={(v) => setSection('endorsements', { doubleTripleTrailers: v })} label="Double/triple trailers" />
                <Toggle checked={form.endorsements.passenger} onChange={(v) => setSection('endorsements', { passenger: v })} label="Passenger" />
                <Toggle checked={form.endorsements.schoolBus} onChange={(v) => setSection('endorsements', { schoolBus: v })} label="School bus" />
              </div>
              <Field label="TWIC Number">
                <Input value={form.endorsements.twicNo} onChange={(e) => setSection('endorsements', { twicNo: e.target.value })} />
              </Field>
            </div>
          )}

          {activeTab === 'rateCard' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Pay Method">
                  <TypeSelect options={typeOptions[12] || []} value={form.rateCard.payMethodId} onChange={(v) => setSection('rateCard', { payMethodId: v })} placeholder="Select pay method" />
                </Field>
                <Field label="Mileage Rate">
                  <Input type="number" value={form.rateCard.mileageRate} onChange={(e) => setSection('rateCard', { mileageRate: e.target.value })} />
                </Field>
                <Field label="Empty Mileage Rate">
                  <Input type="number" value={form.rateCard.emptyMileageRate} onChange={(e) => setSection('rateCard', { emptyMileageRate: e.target.value })} />
                </Field>
                <Field label="Daily Rate">
                  <Input type="number" value={form.rateCard.dailyRate} onChange={(e) => setSection('rateCard', { dailyRate: e.target.value })} />
                </Field>
                <Field label="Layover Rate">
                  <Input type="number" value={form.rateCard.layoverRate} onChange={(e) => setSection('rateCard', { layoverRate: e.target.value })} />
                </Field>
                <Field label="Layover %">
                  <Input type="number" value={form.rateCard.layoverPercentage} onChange={(e) => setSection('rateCard', { layoverPercentage: e.target.value })} />
                </Field>
                <Field label="Detention Rate">
                  <Input type="number" value={form.rateCard.detentionRate} onChange={(e) => setSection('rateCard', { detentionRate: e.target.value })} />
                </Field>
                <Field label="Detention %">
                  <Input type="number" value={form.rateCard.detentionPercentage} onChange={(e) => setSection('rateCard', { detentionPercentage: e.target.value })} />
                </Field>
                <Field label="Other (Flat)">
                  <Input type="number" value={form.rateCard.otherFlat} onChange={(e) => setSection('rateCard', { otherFlat: e.target.value })} />
                </Field>
                <Field label="Other %">
                  <Input type="number" value={form.rateCard.otherPercentage} onChange={(e) => setSection('rateCard', { otherPercentage: e.target.value })} />
                </Field>
                <Field label="Hourly Rate (1-8)">
                  <Input type="number" value={form.rateCard.hourlyRate1to8} onChange={(e) => setSection('rateCard', { hourlyRate1to8: e.target.value })} />
                </Field>
                <Field label="Overtime Rate (8-24)">
                  <Input type="number" value={form.rateCard.overtimeRate8to24} onChange={(e) => setSection('rateCard', { overtimeRate8to24: e.target.value })} />
                </Field>
                <Field label="Overtime Rate (24+)">
                  <Input type="number" value={form.rateCard.overtimeRate24} onChange={(e) => setSection('rateCard', { overtimeRate24: e.target.value })} />
                </Field>
                <Field label="Weekly Hourly Rate">
                  <Input type="number" value={form.rateCard.weeklyHourlyRate} onChange={(e) => setSection('rateCard', { weeklyHourlyRate: e.target.value })} />
                </Field>
                <Field label="Weekly OT Rate (40-60)">
                  <Input type="number" value={form.rateCard.weeklyOtRate40to60} onChange={(e) => setSection('rateCard', { weeklyOtRate40to60: e.target.value })} />
                </Field>
                <Field label="Weekly OT Rate (60+)">
                  <Input type="number" value={form.rateCard.weeklyOtRate60} onChange={(e) => setSection('rateCard', { weeklyOtRate60: e.target.value })} />
                </Field>
                <Field label="Per Stop Pay">
                  <Input type="number" value={form.rateCard.perStopPay} onChange={(e) => setSection('rateCard', { perStopPay: e.target.value })} />
                </Field>
                <Field label="Stops" hint="Stop count this rate card applies to">
                  <Input type="number" value={form.rateCard.stops} onChange={(e) => setSection('rateCard', { stops: e.target.value })} />
                </Field>
                <Field label="Invoice %">
                  <Input type="number" value={form.rateCard.invoicePercentage} onChange={(e) => setSection('rateCard', { invoicePercentage: e.target.value })} />
                </Field>
                <Field label="Fuel Surcharge %">
                  <Input type="number" value={form.rateCard.fuelSurchargePercentage} onChange={(e) => setSection('rateCard', { fuelSurchargePercentage: e.target.value })} />
                </Field>
              </Grid>
              <Toggle checked={form.rateCard.allStops} onChange={(v) => setSection('rateCard', { allStops: v })} label="All stops" />
            </div>
          )}

          {activeTab === 'teamRateCard' && (
            <div className="space-y-4">
              <Grid>
                <Field label="Team Mileage Rate">
                  <Input type="number" value={form.teamRateCard.teamMileageRate} onChange={(e) => setSection('teamRateCard', { teamMileageRate: e.target.value })} />
                </Field>
                <Field label="Team Empty Mileage Rate">
                  <Input type="number" value={form.teamRateCard.teamEmptyMileageRate} onChange={(e) => setSection('teamRateCard', { teamEmptyMileageRate: e.target.value })} />
                </Field>
                <Field label="Per Stop Pay (Team)">
                  <Input type="number" value={form.teamRateCard.perStopPayTeam} onChange={(e) => setSection('teamRateCard', { perStopPayTeam: e.target.value })} />
                </Field>
                <Field label="Stops" hint="Stop count this rate card applies to">
                  <Input type="number" value={form.teamRateCard.stops} onChange={(e) => setSection('teamRateCard', { stops: e.target.value })} />
                </Field>
              </Grid>
              <Toggle checked={form.teamRateCard.allStopsTeam} onChange={(v) => setSection('teamRateCard', { allStopsTeam: v })} label="All stops (team)" />
            </div>
          )}

          {activeTab === 'payables' && (
            <Section title="Payable To" description="Who this driver's pay is made out to">
              <Grid>
                <Field label="Payable To (Carrier)" className="sm:col-span-2">
                  <Select value={form.payables.payableToCarrierId} onChange={(e) => setSection('payables', { payableToCarrierId: e.target.value })}>
                    <option value="">Select carrier</option>
                    {carriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="EIN Number">
                  <Input value={form.payables.einNumber} onChange={(e) => setSection('payables', { einNumber: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.payables.email} onChange={(e) => setSection('payables', { email: e.target.value })} />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <AddressAutocomplete
                    value={form.payables.address}
                    onChange={(v) => setSection('payables', { address: v })}
                    onSelect={(place) => setSection('payables', { address: place.address, city: place.city, state: place.state, zipCode: place.zipCode })}
                  />
                </Field>
                <Field label="City">
                  <Input value={form.payables.city} onChange={(e) => setSection('payables', { city: e.target.value })} />
                </Field>
                <Field label="State">
                  <Input value={form.payables.state} onChange={(e) => setSection('payables', { state: e.target.value })} />
                </Field>
                <Field label="Zip Code">
                  <Input value={form.payables.zipCode} onChange={(e) => setSection('payables', { zipCode: e.target.value })} />
                </Field>
              </Grid>
              <div className="mt-3 flex flex-wrap gap-6">
                <Toggle checked={form.payables.isDisableSettlement} onChange={(v) => setSection('payables', { isDisableSettlement: v })} label="Disable settlement" />
                <Toggle checked={form.payables.active} onChange={(v) => setSection('payables', { active: v })} label="Active" />
              </div>
            </Section>
          )}
        </>
      )}
    </Drawer>
  )
}
