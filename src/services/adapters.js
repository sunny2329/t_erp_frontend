// Maps between the backend's real (snake_case, schema-accurate) row shape and
// the normalized shape the frontend UI already speaks, so LoadDrawer, the
// dispatch modals, Dashboard, Loads and Dispatch pages need no changes.
// See t_erp_backend/SCHEMA_ASSUMPTIONS.md for why certain fields are dropped
// (customer_type_id / vehicle_type_id / trailer_type_id / user_type are FK or
// bare-code columns with no lookup data seeded — safer to omit than guess).

const idStr = (v) => (v === null || v === undefined ? '' : String(v))
const idNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
// Postgres numeric(x,2) columns (e.g. loads.length) come back from pg as
// strings like "53.00" — round-trip those through here so whole-number
// fields display as "53", not "53.00", instead of showing the raw string.
const intStr = (v) => (v === null || v === undefined || v === '' ? '' : String(Math.round(Number(v))))
const digitsOnly = (v) => {
  const d = String(v ?? '').replace(/\D/g, '')
  return d ? Number(d) : null
}

export const pageAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    title: row.title || '',
    route: row.route || '',
    groupName: row.group_name || 'Other',
    hasAdd: !!row.has_add,
    hasEdit: !!row.has_edit,
    hasDelete: !!row.has_delete,
  }),
}

export const carrierAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.carrier_name || '',
    authorityType: row.authority_type,
    contactPerson: row.contact_person || '',
    mcNumber: row.mc_number || '',
    dotNumber: row.dot_number || '',
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    carrier_name: form.name,
    authority_type: Number(form.authorityType),
    contact_person: form.contactPerson || null,
    mc_number: form.mcNumber || null,
    dot_number: form.dotNumber || null,
    is_active: !!form.active,
  }),
}

// Full carrier master — general fields + every child section (contact,
// dispatch, insurance, certification, settlement, factoring). Distinct from
// carrierAdapter above, which only covers the lightweight list/dropdown
// shape used everywhere else in the app. carrier_details (the ~70-column
// compliance/mode/equipment-class table, including a redundant dtl_* mirror
// of the carrier's own identity fields) is intentionally not exposed here —
// see the CarrierDrawer file header for why.
function blankContact() {
  return { typeId: '', contactPerson: '', addressLine1: '', addressLine2: '', city: '', state: '', country: '', zipcode: '', phone: '', fax: '', email: '', website: '', notes: '' }
}
function blankDispatchContact() {
  return { contactName: '', email: '', phone: '', phone2: '', phone3: '' }
}
function blankCargoInsurance() {
  return { company: '', phone: '', agent: '', agentPhone: '', email: '', policyNumber: '', expiration: '', coverageLimit: '', city: '', state: '', zipCode: '', fax: '', deductible: '', notes: '' }
}
function blankCertification() {
  return { hazmatNumber: '', ctpatNumber: '', tankerEndorsedNumber: '', isHazmat: false, isSmartWay: false, isCarb: false, isTwic: false, isCtpatCertified: false, isTankerEndorsed: false }
}
function blankSettlement() {
  return {
    paymentNetTermTypeId: '', payMethodTypeId: '', carrierPayPerMile: '', carrierPayEmptyMile: '',
    detentionRate: '', detentionPercentage: '', layoverRate: '', layoverPercentage: '', otherFlat: '', otherPercentage: '',
    hourlyRate: '', overtimeRate: '', perStopPay: '', afterStop: '', invoicePercentage: '', fuelSurchargePercentage: '',
    salesTax: '', active: true,
  }
}
function blankFactoringContact() {
  return { name: '', address: '', city: '', state: '', country: '', zipCode: '', phone: '', fax: '', email: '', website: '', contactPerson: '' }
}
function blankLiabilityRow() {
  return { id: null, typeId: '', phone: '', agentName: '', agentPhone: '', agentEmail: '', policyNumber: '', expiration: '', amtLimit: '', city: '', state: '', country: '', fax: '', deductable: '', contactRemark: '', companyName: '', zipcode: '' }
}

export function blankCarrierDetail() {
  return {
    id: '',
    name: '', authorityType: 1, serviceTypeId: '', contactPerson: '', mcNumber: '', dotNumber: '', dbaName: '', scacCode: '',
    fedTaxId: '', customCarrierId: '', fleetSize: '', totalPowerUnits: '', numVehicles: '',
    reeferEquipment: false, vanEquipment: false, flatbedStepdeckEquipment: false, track1099: false, active: true,
    contact: blankContact(),
    dispatch: blankDispatchContact(),
    liability: [blankLiabilityRow()],
    cargoInsurance: blankCargoInsurance(),
    certification: blankCertification(),
    settlement: blankSettlement(),
    factoringCompany: blankFactoringContact(),
    invoicePayableTo: blankFactoringContact(),
    billToEmail: '', remitName: '', remitAddress: '', remitState: '', remitCity: '', remitCountry: '', remitZipCode: '',
    remitPhone: '', remitFax: '', remitEmail: '', billToAddress: '', billToInstructions: '',
    bankRoutingNumber: '', bankAccountNumber: '', bankAccountName: '', bankName: '', bankAddress: '', bankPhone: '', bankFax: '', bankAccountType: '',
    netsuiteSubsidiaryName: '', netsuiteAccount1099: '', netsuitePoExpenseAccount: '',
  }
}

export const carrierDetailAdapter = {
  fromApi: (row) => {
    const contact = row.contacts?.[0]
    const dispatch = row.dispatch?.[0]
    const cargo = row.insurance?.cargoInsurance?.[0]
    const cert = row.certification?.[0]
    const settlement = row.settlement?.[0]
    const factoring = (row.factoring || []).find((f) => f.factoring_type_id != null)
    const invoicePayableTo = (row.factoring || []).find((f) => f.factoring_type_id == null)
    const liabilityRows = row.insurance?.liability || []

    return {
      id: idStr(row.id),
      name: row.carrier_name || '',
      authorityType: row.authority_type ?? 1,
      serviceTypeId: idStr(row.service_type_id),
      contactPerson: row.contact_person || '',
      mcNumber: row.mc_number || '',
      dotNumber: row.dot_number || '',
      dbaName: row.dba_name || '',
      scacCode: row.scac_code || '',
      fedTaxId: row.fed_tax_id || '',
      customCarrierId: row.custom_carrier_id || '',
      fleetSize: row.fleet_size ?? '',
      totalPowerUnits: row.total_power_units ?? '',
      numVehicles: row.num_vehicles ?? '',
      reeferEquipment: !!row.reefer_equipment,
      vanEquipment: !!row.van_equipment,
      flatbedStepdeckEquipment: !!row.flatbed_stepdeck_equipment,
      track1099: !!row.track_1099,
      active: !!row.is_active,

      contact: contact ? {
        typeId: idStr(contact.type_id),
        contactPerson: contact.contact_person || '', addressLine1: contact.address_line1 || '', addressLine2: contact.address_line2 || '',
        city: contact.city_name || '', state: contact.state_name || '', country: contact.country_name || '', zipcode: contact.zipcode || '',
        phone: contact.phone_no != null ? String(contact.phone_no) : '', fax: contact.fax_no != null ? String(contact.fax_no) : '',
        email: contact.email || '', website: contact.website || '', notes: contact.notes || '',
      } : blankContact(),

      dispatch: dispatch ? {
        contactName: dispatch.contact_name || '', email: dispatch.email || '', phone: dispatch.phone || '',
        phone2: dispatch.phone2 || '', phone3: dispatch.phone3 || '',
      } : blankDispatchContact(),

      liability: liabilityRows.length
        ? liabilityRows.map((l) => ({
            id: l.id,
            typeId: idStr(l.type_id),
            phone: l.phone_no != null ? String(l.phone_no) : '',
            agentName: l.agent_name || '',
            agentPhone: l.agent_phone_no != null ? String(l.agent_phone_no) : '',
            agentEmail: l.agent_email || '',
            policyNumber: l.policy_number || '',
            expiration: l.expiration ? String(l.expiration).slice(0, 10) : '',
            amtLimit: l.amt_limit ?? '',
            city: l.city_name || '', state: l.state_name || '', country: l.country_name || '',
            fax: l.fax_number != null ? String(l.fax_number) : '',
            deductable: l.deductable || '',
            contactRemark: l.contact_remark || '',
            companyName: l.company_name || '',
            zipcode: l.zipcode || '',
          }))
        : [blankLiabilityRow()],

      cargoInsurance: cargo ? {
        company: cargo.company || '', phone: cargo.phone || '', agent: cargo.agent || '', agentPhone: cargo.agent_phone || '',
        email: cargo.email || '', policyNumber: cargo.policy_number || '', expiration: cargo.expiration ? String(cargo.expiration).slice(0, 10) : '',
        coverageLimit: cargo.coverage_limit ?? '', city: cargo.city || '', state: cargo.state || '', zipCode: cargo.zip_code || '',
        fax: cargo.fax || '', deductible: cargo.deductible ?? '', notes: cargo.notes || '',
      } : blankCargoInsurance(),

      certification: cert ? {
        hazmatNumber: cert.hazmat_number || '', ctpatNumber: cert.ctpat_number || '', tankerEndorsedNumber: cert.tanker_endorsed_number || '',
        isHazmat: !!cert.is_hazmat, isSmartWay: !!cert.is_smart_way, isCarb: !!cert.is_carb, isTwic: !!cert.is_twic,
        isCtpatCertified: !!cert.is_ctpat_certified, isTankerEndorsed: !!cert.is_tanker_endorsed,
      } : blankCertification(),

      settlement: settlement ? {
        paymentNetTermTypeId: idStr(settlement.payment_net_term_type_id), payMethodTypeId: idStr(settlement.pay_method_type_id),
        carrierPayPerMile: settlement.carrier_pay_per_mile ?? '', carrierPayEmptyMile: settlement.carrier_pay_empty_mile ?? '',
        detentionRate: settlement.detention_rate ?? '', detentionPercentage: settlement.detention_percentage ?? '',
        layoverRate: settlement.layover_rate ?? '', layoverPercentage: settlement.layover_percentage ?? '',
        otherFlat: settlement.other_flat ?? '', otherPercentage: settlement.other_percentage ?? '',
        hourlyRate: settlement.hourly_rate ?? '', overtimeRate: settlement.overtime_rate ?? '',
        perStopPay: settlement.per_stop_pay ?? '', afterStop: settlement.after_stop ?? '',
        invoicePercentage: settlement.invoice_percentage ?? '', fuelSurchargePercentage: settlement.fuel_surcharge_percentage ?? '',
        salesTax: settlement.sales_tax ?? '', active: settlement.is_active !== false,
      } : blankSettlement(),

      factoringCompany: factoring ? {
        name: factoring.name || '', address: factoring.address || '', city: factoring.city || '', state: factoring.state || '',
        country: factoring.country || '', zipCode: factoring.zip_code || '', phone: factoring.phone || '', fax: factoring.fax || '',
        email: factoring.email || '', website: factoring.website || '', contactPerson: factoring.contact_person || '',
      } : blankFactoringContact(),

      invoicePayableTo: invoicePayableTo ? {
        name: invoicePayableTo.name || '', address: invoicePayableTo.address || '', city: invoicePayableTo.city || '',
        state: invoicePayableTo.state || '', country: invoicePayableTo.country || '', zipCode: invoicePayableTo.zip_code || '',
        phone: invoicePayableTo.phone || '', fax: invoicePayableTo.fax || '', email: invoicePayableTo.email || '',
        website: invoicePayableTo.website || '', contactPerson: invoicePayableTo.contact_person || '',
      } : blankFactoringContact(),

      billToEmail: row.bill_to_email || '', remitName: row.remit_name || '', remitAddress: row.remit_address || '',
      remitState: row.remit_state || '', remitCity: row.remit_city || '', remitCountry: row.remit_country || '',
      remitZipCode: row.remit_zip_code || '', remitPhone: row.remit_phone || '', remitFax: row.remit_fax || '', remitEmail: row.remit_email || '',
      billToAddress: row.bill_to_address || '', billToInstructions: row.bill_to_instructions || '',

      bankRoutingNumber: row.bank_info_routing_number || '', bankAccountNumber: row.bank_info_account_number || '',
      bankAccountName: row.bank_info_account_name || '', bankName: row.bank_info_bank_name || '', bankAddress: row.bank_info_bank_address || '',
      bankPhone: row.bank_info_phone || '', bankFax: row.bank_info_fax || '', bankAccountType: row.bank_info_account_type || '',

      netsuiteSubsidiaryName: row.netsuite_subsidiary_name || '', netsuiteAccount1099: row.netsuite_account_1099 || '',
      netsuitePoExpenseAccount: row.netsuite_po_expense_account || '',
    }
  },

  toApi: (form) => {
    const factoringRows = []
    if (Object.values(form.factoringCompany).some((v) => v)) {
      factoringRows.push({
        factoring_type_id: 1, name: form.factoringCompany.name || null, address: form.factoringCompany.address || null,
        city: form.factoringCompany.city || null, state: form.factoringCompany.state || null, country: form.factoringCompany.country || null,
        zip_code: form.factoringCompany.zipCode || null, phone: form.factoringCompany.phone || null, fax: form.factoringCompany.fax || null,
        email: form.factoringCompany.email || null, website: form.factoringCompany.website || null, contact_person: form.factoringCompany.contactPerson || null,
      })
    }
    if (Object.values(form.invoicePayableTo).some((v) => v)) {
      factoringRows.push({
        factoring_type_id: null, name: form.invoicePayableTo.name || null, address: form.invoicePayableTo.address || null,
        city: form.invoicePayableTo.city || null, state: form.invoicePayableTo.state || null, country: form.invoicePayableTo.country || null,
        zip_code: form.invoicePayableTo.zipCode || null, phone: form.invoicePayableTo.phone || null, fax: form.invoicePayableTo.fax || null,
        email: form.invoicePayableTo.email || null, website: form.invoicePayableTo.website || null, contact_person: form.invoicePayableTo.contactPerson || null,
      })
    }

    return {
      carrier_name: form.name,
      authority_type: Number(form.authorityType),
      service_type_id: idNum(form.serviceTypeId),
      contact_person: form.contactPerson || null,
      mc_number: form.mcNumber || null,
      dot_number: form.dotNumber || null,
      dba_name: form.dbaName || null,
      scac_code: form.scacCode || null,
      fed_tax_id: form.fedTaxId || null,
      custom_carrier_id: form.customCarrierId || null,
      fleet_size: idNum(form.fleetSize),
      total_power_units: idNum(form.totalPowerUnits),
      num_vehicles: idNum(form.numVehicles),
      reefer_equipment: !!form.reeferEquipment,
      van_equipment: !!form.vanEquipment,
      flatbed_stepdeck_equipment: !!form.flatbedStepdeckEquipment,
      track_1099: !!form.track1099,
      is_active: !!form.active,

      bill_to_email: form.billToEmail || null, remit_name: form.remitName || null, remit_address: form.remitAddress || null,
      remit_state: form.remitState || null, remit_city: form.remitCity || null, remit_country: form.remitCountry || null,
      remit_zip_code: form.remitZipCode || null, remit_phone: form.remitPhone || null, remit_fax: form.remitFax || null,
      remit_email: form.remitEmail || null, bill_to_address: form.billToAddress || null, bill_to_instructions: form.billToInstructions || null,

      bank_info_routing_number: form.bankRoutingNumber || null, bank_info_account_number: form.bankAccountNumber || null,
      bank_info_account_name: form.bankAccountName || null, bank_info_bank_name: form.bankName || null,
      bank_info_bank_address: form.bankAddress || null, bank_info_phone: form.bankPhone || null, bank_info_fax: form.bankFax || null,
      bank_info_account_type: form.bankAccountType || null,

      netsuite_subsidiary_name: form.netsuiteSubsidiaryName || null, netsuite_account_1099: form.netsuiteAccount1099 || null,
      netsuite_po_expense_account: form.netsuitePoExpenseAccount || null,

      contacts: [{
        type_id: idNum(form.contact.typeId),
        contact_person: form.contact.contactPerson || null, address_line1: form.contact.addressLine1 || null, address_line2: form.contact.addressLine2 || null,
        city_name: form.contact.city || null, state_name: form.contact.state || null, country_name: form.contact.country || null, zipcode: form.contact.zipcode || null,
        phone_no: digitsOnly(form.contact.phone), fax_no: digitsOnly(form.contact.fax), email: form.contact.email || null, website: form.contact.website || null,
        notes: form.contact.notes || null,
      }],

      dispatch: [{
        contact_name: form.dispatch.contactName || null, email: form.dispatch.email || null, phone: form.dispatch.phone || null,
        phone2: form.dispatch.phone2 || null, phone3: form.dispatch.phone3 || null,
      }],

      insurance: {
        liability: (form.liability || [])
          .filter((l) => Object.entries(l).some(([k, v]) => k !== 'id' && v))
          .map((l) => ({
            type_id: idNum(l.typeId), phone_no: digitsOnly(l.phone), agent_name: l.agentName || null, agent_phone_no: digitsOnly(l.agentPhone),
            agent_email: l.agentEmail || null, policy_number: l.policyNumber || null, expiration: l.expiration || null, amt_limit: l.amtLimit || null,
            city_name: l.city || null, state_name: l.state || null, country_name: l.country || null, fax_number: digitsOnly(l.fax),
            deductable: l.deductable || null, contact_remark: l.contactRemark || null, company_name: l.companyName || null, zipcode: l.zipcode || null,
          })),
        cargoInsurance: [{
          company: form.cargoInsurance.company || null, phone: form.cargoInsurance.phone || null, agent: form.cargoInsurance.agent || null,
          agent_phone: form.cargoInsurance.agentPhone || null, email: form.cargoInsurance.email || null, policy_number: form.cargoInsurance.policyNumber || null,
          expiration: form.cargoInsurance.expiration || null, coverage_limit: form.cargoInsurance.coverageLimit || null, city: form.cargoInsurance.city || null,
          state: form.cargoInsurance.state || null, zip_code: form.cargoInsurance.zipCode || null, fax: form.cargoInsurance.fax || null,
          deductible: form.cargoInsurance.deductible || null, notes: form.cargoInsurance.notes || null,
        }],
      },

      certification: [{
        hazmat_number: form.certification.hazmatNumber || null, ctpat_number: form.certification.ctpatNumber || null,
        tanker_endorsed_number: form.certification.tankerEndorsedNumber || null, is_hazmat: !!form.certification.isHazmat,
        is_smart_way: !!form.certification.isSmartWay, is_carb: !!form.certification.isCarb, is_twic: !!form.certification.isTwic,
        is_ctpat_certified: !!form.certification.isCtpatCertified, is_tanker_endorsed: !!form.certification.isTankerEndorsed,
      }],

      settlement: [{
        payment_net_term_type_id: idNum(form.settlement.paymentNetTermTypeId), pay_method_type_id: idNum(form.settlement.payMethodTypeId),
        carrier_pay_per_mile: form.settlement.carrierPayPerMile || null, carrier_pay_empty_mile: form.settlement.carrierPayEmptyMile || null,
        detention_rate: form.settlement.detentionRate || null, detention_percentage: form.settlement.detentionPercentage || null,
        layover_rate: form.settlement.layoverRate || null, layover_percentage: form.settlement.layoverPercentage || null,
        other_flat: form.settlement.otherFlat || null, other_percentage: form.settlement.otherPercentage || null,
        hourly_rate: form.settlement.hourlyRate || null, overtime_rate: form.settlement.overtimeRate || null,
        per_stop_pay: form.settlement.perStopPay || null, after_stop: form.settlement.afterStop || null,
        invoice_percentage: form.settlement.invoicePercentage || null, fuel_surcharge_percentage: form.settlement.fuelSurchargePercentage || null,
        sales_tax: form.settlement.salesTax || null, is_active: form.settlement.active !== false,
      }],

      factoring: factoringRows,
    }
  },
}

export const customerAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.name || '',
    salesAgentId: idStr(row.sales_agent_id),
    customerTypeId: idStr(row.customer_type_id),
    address: row.address || '',
    city: row.city_name || '',
    state: row.state_name || '',
    country: row.country_name || 'USA',
    lat: row.lat ?? '',
    lon: row.long ?? '',
    phone: row.phone_no != null ? String(row.phone_no) : '',
    email: row.email || '',
    active: true,
  }),
  toApi: (form) => ({
    name: form.name,
    sales_agent_id: idNum(form.salesAgentId),
    customer_type_id: idNum(form.customerTypeId),
    address: form.address || null,
    city_name: form.city || null,
    state_name: form.state || null,
    country_name: form.country || 'USA',
    lat: form.lat === '' || form.lat == null ? null : Number(form.lat),
    long: form.lon === '' || form.lon == null ? null : Number(form.lon),
    phone_no: digitsOnly(form.phone),
    email: form.email || null,
  }),
}

// Full customer master, mirroring the legacy ss_save_customer save shape.
// carrier_id is deliberately absent from this form — it's tenant scoping
// (see SCHEMA_ASSUMPTIONS.md), always injected server-side from the logged
// in user's own carrier, never picked in the UI (confirmed against both the
// legacy SQL function and the reference Loadx-Youngs-Frontend implementation,
// neither of which expose it either). customer_contacts/customer_billing
// child tables exist on this backend but the legacy save function and the
// reference frontend don't use them, so they're left out here too.
export function blankCustomerDetail() {
  return {
    id: '',
    name: '', customerCode: '', dbaName: '', transCarrierId: '', salesAgentId: '', customerTypeId: '',
    mc: '', dot: '', fedTaxId: '',
    contactPerson: '', phone: '', email: '', fax: '', website: '', dispatchContact: '',
    address: '', city: '', state: '', country: 'USA',
    factoringId: '', tafsDebtorName: '', apexCompanyName: '',
    customerSince: '', isAppointmentReq: false, isTrailerPool: false,
    customerLoadNotes: '', customerNotes: '',
  }
}

export const customerDetailAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.name || '',
    customerCode: row.customer_id || '',
    dbaName: row.dba_name || '',
    transCarrierId: idStr(row.trans_carrier_id),
    salesAgentId: idStr(row.sales_agent_id),
    customerTypeId: idStr(row.customer_type_id),
    mc: row.mc || '',
    dot: row.dot || '',
    fedTaxId: row.fed_tax_id || '',
    contactPerson: row.contact_person || '',
    phone: row.phone_no != null ? String(row.phone_no) : '',
    email: row.email || '',
    fax: row.fax_no != null ? String(row.fax_no) : '',
    website: row.website || '',
    dispatchContact: row.dispatch_contact || '',
    address: row.address || '',
    city: row.city_name || '',
    state: row.state_name || '',
    country: row.country_name || 'USA',
    factoringId: row.factoring_id || '',
    tafsDebtorName: row.tafs_debtor_name || '',
    apexCompanyName: row.apex_company_name || '',
    customerSince: row.customer_since ? String(row.customer_since).slice(0, 10) : '',
    isAppointmentReq: !!row.is_appointment_req,
    isTrailerPool: !!row.is_trailer_pool,
    customerLoadNotes: row.customer_load_notes || '',
    customerNotes: row.customer_notes || '',
  }),
  toApi: (form) => ({
    name: form.name,
    customer_id: form.customerCode || null,
    dba_name: form.dbaName || null,
    trans_carrier_id: idNum(form.transCarrierId),
    sales_agent_id: idNum(form.salesAgentId),
    customer_type_id: idNum(form.customerTypeId),
    mc: form.mc || null,
    dot: form.dot || null,
    fed_tax_id: form.fedTaxId || null,
    contact_person: form.contactPerson || null,
    phone_no: digitsOnly(form.phone),
    email: form.email || null,
    fax_no: digitsOnly(form.fax),
    website: form.website || null,
    dispatch_contact: form.dispatchContact || null,
    address: form.address || null,
    city_name: form.city || null,
    state_name: form.state || null,
    country_name: form.country || null,
    factoring_id: form.factoringId || null,
    tafs_debtor_name: form.tafsDebtorName || null,
    apex_company_name: form.apexCompanyName || null,
    customer_since: form.customerSince || null,
    is_appointment_req: !!form.isAppointmentReq,
    is_trailer_pool: !!form.isTrailerPool,
    customer_load_notes: form.customerLoadNotes || null,
    customer_notes: form.customerNotes || null,
  }),
}

export const driverAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    carrierId: idStr(row.carrier_id),
    license: row.driver_license || '',
    phone: row.mobile_no || '',
    email: row.email || '',
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    first_name: form.firstName,
    last_name: form.lastName,
    carrier_id: idNum(form.carrierId),
    driver_license: form.license || null,
    mobile_no: form.phone || null,
    email: form.email || null,
    is_active: !!form.active,
  }),
}

// Full driver master, mirroring the legacy ss_save_driver_master save shape.
// carrier_id stays user-picked (confirmed against the reference backend's
// driver.controller.js, where it's read from req.body, not the JWT — unlike
// customers/locations/terminals). state_id / driver_contact.city_id are left
// out — real FKs to `states`/`city`, both empty in this database (same
// reasoning as trailers' license_state_id). The `accounting` table insert
// (vendor/class/tax-type/1099-box) is out of scope, same as carrier
// accounting fields — that's billing/invoicing classification, not master
// data. user_pwd stays unimplemented (see drivers.service.js).
function blankDriverContact() {
  return {
    addressLine1: '', addressLine2: '', city: '', state: '', country: '', zipcode: '',
    cellPhone: '', phone: '', emergencyContact: '', emergencyPhone: '', ssn: '', einNumber: '',
    homeCity: '', homeState: '',
  }
}
function blankDriverDetails() {
  return {
    yearsOfExperience: '', dateOfBirth: '', lastDrugTestDate: '', medicalExpirationDate: '',
    fleetCardNumber: '', avgDailyMileage: '', dateOfJoin: '', recruitedBy: '', lastDutyStatus: '',
    lastDutyTime: '', registeredForClearinghouse: false, physicalExpiration: '', twicCardExpiration: '',
    cdlIssuanceDate: '', drugAlcoholPositiveTests: false, revokedLicenses: false, drivingConvictions: false,
    drugAlcoholConvictions: false, clearingDate: '', mvrExpirationDate: '',
  }
}
function blankDriverEndorsements() {
  return { hazardousMaterials: false, tankVehicles: false, doubleTripleTrailers: false, passenger: false, schoolBus: false, twicNo: '' }
}
function blankRateCard() {
  return {
    mileageRate: '', emptyMileageRate: '', layoverRate: '', layoverPercentage: '', detentionRate: '', detentionPercentage: '',
    otherFlat: '', otherPercentage: '', hourlyRate1to8: '', overtimeRate8to24: '', overtimeRate24: '',
    weeklyHourlyRate: '', weeklyOtRate40to60: '', weeklyOtRate60: '', perStopPay: '', allStops: false,
    invoicePercentage: '', fuelSurchargePercentage: '', dailyRate: '', payMethodId: '', stops: '',
  }
}
function blankTeamRateCard() {
  return { teamMileageRate: '', teamEmptyMileageRate: '', perStopPayTeam: '', allStopsTeam: false, stops: '' }
}
function blankPayables() {
  return { payableToCarrierId: '', einNumber: '', email: '', address: '', city: '', state: '', zipCode: '', isDisableSettlement: false, active: true }
}

export function blankDriverDetail() {
  return {
    id: '', firstName: '', middleName: '', lastName: '', dbaName: '',
    carrierId: '', terminalId: '', driverCompanyId: '', routeTypeId: '', driverTypeId: '', taxFormId: '',
    payrollId: '', ukgCostCenterCode: '', driverLicense: '', driverLicenseExpDt: '', email: '', mobileNo: '',
    userName: '', integrationId: '', remark: '',
    perDiem: false, terminated: false, freezePay: false, extraPay: false, active: true,
    contact: blankDriverContact(),
    details: blankDriverDetails(),
    endorsements: blankDriverEndorsements(),
    rateCard: blankRateCard(),
    teamRateCard: blankTeamRateCard(),
    payables: blankPayables(),
  }
}

export const driverDetailAdapter = {
  fromApi: (row) => {
    const contact = row.contact?.[0]
    const details = row.detailsExtended?.[0]
    const endorsements = row.endorsements?.[0]
    const rateCard = row.rateCard?.[0]
    const teamRateCard = row.teamRateCard?.[0]
    const payables = row.payables?.[0]
    const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')

    return {
      id: idStr(row.id),
      firstName: row.first_name || '',
      middleName: row.middle_name || '',
      lastName: row.last_name || '',
      dbaName: row.dba_name || '',
      carrierId: idStr(row.carrier_id),
      terminalId: idStr(row.terminal_id),
      driverCompanyId: row.driver_company_id ?? '',
      routeTypeId: idStr(row.route_type_id),
      driverTypeId: idStr(row.driver_type_id),
      taxFormId: idStr(row.tax_form_id),
      payrollId: row.payroll_id || '',
      ukgCostCenterCode: row.ukg_cost_center_code || '',
      driverLicense: row.driver_license || '',
      driverLicenseExpDt: dateOnly(row.driver_license_exp_dt),
      email: row.email || '',
      mobileNo: row.mobile_no || '',
      userName: row.user_name || '',
      integrationId: row.integration_id || '',
      remark: row.remark || '',
      perDiem: !!row.per_diem,
      terminated: !!row.terminated,
      freezePay: !!row.freeze_pay,
      extraPay: !!row.extra_pay,
      active: !!row.is_active,

      contact: contact ? {
        addressLine1: contact.address_line1 || '', addressLine2: contact.address_line2 || '',
        city: contact.city_name || '', state: contact.state_name || '', country: contact.country_name || '', zipcode: contact.zipcode || '',
        cellPhone: contact.cell_phone || '', phone: contact.phone || '', emergencyContact: contact.emergency_contact || '',
        emergencyPhone: contact.emergency_phone || '', ssn: contact.ssn || '', einNumber: contact.driver_ein_number || '',
        homeCity: contact.home_city_name || '', homeState: contact.home_state_name || '',
      } : blankDriverContact(),

      details: details ? {
        yearsOfExperience: details.years_of_experience ?? '', dateOfBirth: dateOnly(details.date_of_birth),
        lastDrugTestDate: dateOnly(details.last_drug_test_date), medicalExpirationDate: dateOnly(details.medical_expiration_date),
        fleetCardNumber: details.fleet_card_number || '', avgDailyMileage: details.avg_daily_mileage ?? '',
        dateOfJoin: dateOnly(details.date_of_join), recruitedBy: details.recruited_by || '', lastDutyStatus: details.last_duty_status || '',
        lastDutyTime: details.last_duty_time ? String(details.last_duty_time).slice(0, 16) : '',
        registeredForClearinghouse: !!details.registered_for_clearinghouse, physicalExpiration: dateOnly(details.physical_expiration),
        twicCardExpiration: dateOnly(details.twic_card_expiration), cdlIssuanceDate: dateOnly(details.cdl_issuance_date),
        drugAlcoholPositiveTests: !!details.drug_alcohol_positive_tests, revokedLicenses: !!details.revoked_licenses,
        drivingConvictions: !!details.driving_convictions, drugAlcoholConvictions: !!details.drug_alcohol_convictions,
        clearingDate: details.clearing_date ? String(details.clearing_date).slice(0, 16) : '', mvrExpirationDate: dateOnly(details.mvr_expiration_date),
      } : blankDriverDetails(),

      endorsements: endorsements ? {
        hazardousMaterials: !!endorsements.hazardous_materials, tankVehicles: !!endorsements.tank_vehicles,
        doubleTripleTrailers: !!endorsements.double_triple_trailers, passenger: !!endorsements.passenger,
        schoolBus: !!endorsements.school_bus, twicNo: endorsements.twic_no || '',
      } : blankDriverEndorsements(),

      rateCard: rateCard ? {
        mileageRate: rateCard.mileage_rate ?? '', emptyMileageRate: rateCard.empty_mileage_rate ?? '',
        layoverRate: rateCard.layover_rate ?? '', layoverPercentage: rateCard.layover_percentage ?? '',
        detentionRate: rateCard.detention_rate ?? '', detentionPercentage: rateCard.detention_percentage ?? '',
        otherFlat: rateCard.other_flat ?? '', otherPercentage: rateCard.other_percentage ?? '',
        hourlyRate1to8: rateCard.hourly_rate_1_8 ?? '', overtimeRate8to24: rateCard.overtime_rate_8_24 ?? '',
        overtimeRate24: rateCard.overtime_rate_24 ?? '', weeklyHourlyRate: rateCard.weekly_hourly_rate ?? '',
        weeklyOtRate40to60: rateCard.weekly_ot_rate_40_60 ?? '', weeklyOtRate60: rateCard.weekly_ot_rate_60 ?? '',
        perStopPay: rateCard.per_stop_pay ?? '', allStops: !!rateCard.all_stops,
        invoicePercentage: rateCard.invoice_percentage ?? '', fuelSurchargePercentage: rateCard.fuel_surcharge_percentage ?? '',
        dailyRate: rateCard.daily_rate ?? '', payMethodId: idStr(rateCard.pay_method_id), stops: rateCard.stops ?? '',
      } : blankRateCard(),

      teamRateCard: teamRateCard ? {
        teamMileageRate: teamRateCard.team_mileage_rate ?? '', teamEmptyMileageRate: teamRateCard.team_empty_mileage_rate ?? '',
        perStopPayTeam: teamRateCard.per_stop_pay_team ?? '', allStopsTeam: !!teamRateCard.all_stops_team,
        stops: teamRateCard.stops ?? '',
      } : blankTeamRateCard(),

      payables: payables ? {
        payableToCarrierId: '', einNumber: payables.ein_number || '', email: payables.email || '',
        address: payables.address || '', city: payables.city || '', state: payables.state || '', zipCode: payables.zip_code || '',
        isDisableSettlement: !!payables.is_disable_settlement, active: payables.is_active !== false,
      } : blankPayables(),
    }
  },

  toApi: (form, { carrierName } = {}) => ({
    first_name: form.firstName,
    middle_name: form.middleName || null,
    last_name: form.lastName,
    dba_name: form.dbaName || null,
    carrier_id: idNum(form.carrierId),
    terminal_id: idNum(form.terminalId),
    driver_company_id: idNum(form.driverCompanyId),
    route_type_id: idNum(form.routeTypeId),
    driver_type_id: idNum(form.driverTypeId),
    tax_form_id: idNum(form.taxFormId),
    payroll_id: form.payrollId || null,
    ukg_cost_center_code: form.ukgCostCenterCode || null,
    driver_license: form.driverLicense || null,
    driver_license_exp_dt: form.driverLicenseExpDt || null,
    email: form.email || null,
    mobile_no: form.mobileNo || null,
    user_name: form.userName || null,
    integration_id: form.integrationId || null,
    remark: form.remark || null,
    per_diem: !!form.perDiem,
    terminated: !!form.terminated,
    freeze_pay: !!form.freezePay,
    extra_pay: !!form.extraPay,
    is_active: !!form.active,

    contact: [{
      address_line1: form.contact.addressLine1 || null, address_line2: form.contact.addressLine2 || null,
      city_name: form.contact.city || null, state_name: form.contact.state || null, country_name: form.contact.country || null,
      zipcode: form.contact.zipcode || null, cell_phone: form.contact.cellPhone || null, phone: form.contact.phone || null,
      emergency_contact: form.contact.emergencyContact || null, emergency_phone: form.contact.emergencyPhone || null,
      ssn: form.contact.ssn || null, driver_ein_number: form.contact.einNumber || null,
      home_city_name: form.contact.homeCity || null, home_state_name: form.contact.homeState || null,
    }],

    detailsExtended: [{
      years_of_experience: idNum(form.details.yearsOfExperience), date_of_birth: form.details.dateOfBirth || null,
      last_drug_test_date: form.details.lastDrugTestDate || null, medical_expiration_date: form.details.medicalExpirationDate || null,
      fleet_card_number: form.details.fleetCardNumber || null, avg_daily_mileage: form.details.avgDailyMileage || null,
      date_of_join: form.details.dateOfJoin || null, recruited_by: form.details.recruitedBy || null,
      last_duty_status: form.details.lastDutyStatus || null, last_duty_time: form.details.lastDutyTime || null,
      registered_for_clearinghouse: !!form.details.registeredForClearinghouse, physical_expiration: form.details.physicalExpiration || null,
      twic_card_expiration: form.details.twicCardExpiration || null, cdl_issuance_date: form.details.cdlIssuanceDate || null,
      drug_alcohol_positive_tests: !!form.details.drugAlcoholPositiveTests, revoked_licenses: !!form.details.revokedLicenses,
      driving_convictions: !!form.details.drivingConvictions, drug_alcohol_convictions: !!form.details.drugAlcoholConvictions,
      clearing_date: form.details.clearingDate || null, mvr_expiration_date: form.details.mvrExpirationDate || null,
    }],

    endorsements: [{
      hazardous_materials: !!form.endorsements.hazardousMaterials, tank_vehicles: !!form.endorsements.tankVehicles,
      double_triple_trailers: !!form.endorsements.doubleTripleTrailers, passenger: !!form.endorsements.passenger,
      school_bus: !!form.endorsements.schoolBus, twic_no: form.endorsements.twicNo || null,
    }],

    rateCard: [{
      mileage_rate: form.rateCard.mileageRate || null, empty_mileage_rate: form.rateCard.emptyMileageRate || null,
      layover_rate: form.rateCard.layoverRate || null, layover_percentage: form.rateCard.layoverPercentage || null,
      detention_rate: form.rateCard.detentionRate || null, detention_percentage: form.rateCard.detentionPercentage || null,
      other_flat: form.rateCard.otherFlat || null, other_percentage: form.rateCard.otherPercentage || null,
      hourly_rate_1_8: form.rateCard.hourlyRate1to8 || null, overtime_rate_8_24: form.rateCard.overtimeRate8to24 || null,
      overtime_rate_24: form.rateCard.overtimeRate24 || null, weekly_hourly_rate: form.rateCard.weeklyHourlyRate || null,
      weekly_ot_rate_40_60: form.rateCard.weeklyOtRate40to60 || null, weekly_ot_rate_60: form.rateCard.weeklyOtRate60 || null,
      per_stop_pay: form.rateCard.perStopPay || null, all_stops: !!form.rateCard.allStops,
      invoice_percentage: form.rateCard.invoicePercentage || null, fuel_surcharge_percentage: form.rateCard.fuelSurchargePercentage || null,
      daily_rate: form.rateCard.dailyRate || null, pay_method_id: idNum(form.rateCard.payMethodId), stops: form.rateCard.stops || null,
    }],

    teamRateCard: [{
      team_mileage_rate: form.teamRateCard.teamMileageRate || null, team_empty_mileage_rate: form.teamRateCard.teamEmptyMileageRate || null,
      per_stop_pay_team: form.teamRateCard.perStopPayTeam || null, all_stops_team: !!form.teamRateCard.allStopsTeam,
      stops: form.teamRateCard.stops || null,
    }],

    payables: Object.values(form.payables).some((v) => v && v !== true) || form.payables.payableToCarrierId ? [{
      payable_to: carrierName || null, name_company: carrierName || null,
      ein_number: form.payables.einNumber || null, email: form.payables.email || null, address: form.payables.address || null,
      city: form.payables.city || null, state: form.payables.state || null, zip_code: form.payables.zipCode || null,
      is_disable_settlement: !!form.payables.isDisableSettlement, is_active: !!form.payables.active,
    }] : [],
  }),
}

export const vehicleAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    regNumber: row.reg_number || '',
    make: row.make || '',
    model: row.model || '',
    carrierId: idStr(row.carrier_id),
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    reg_number: form.regNumber,
    make: form.make || null,
    model: form.model || null,
    carrier_id: idNum(form.carrierId),
    is_active: !!form.active,
  }),
}

// Full vehicle master, mirroring the legacy ss_save_vehicles save shape —
// single table, no child sections. license_state_id is left out — same
// reasoning as trailers' license_state_id (real FK to the empty `states`
// table). fleet_group_id also left out — present in the legacy function's
// signature but never exposed in the reference frontend either, and no
// type_master category documents what it means.
export function blankVehicleDetail() {
  return {
    id: '', regNumber: '', trackName: '', vehicleTypeId: '', terminalId: '', carrierId: '',
    make: '', model: '', year: '', vin: '', integrationId: '', prepassNumber: '', notes: '',
    licenseNumber: '', registrationDate: '', regExpiryDate: '', purchaseDate: '', inServiceFrom: '', expireDate: '',
    inspectionExpiration: '', insuranceRenewalDate: '', lastMaintenanceDate: '', soldDate: '', soldPrice: '',
    tankCapacity: '', averageMpg: '', defLevel: '', startingMileage: '', currentMileage: '',
    mortgageCost: '', annualInsuranceCost: '', annualPlateCost: '',
    isOwnerOperated: false, isCameraInstalled: false, isApuInstalled: false, active: true,
    isLease: false, leaseCarrierId: '', leaseStartDate: '', leaseEndDate: '',
  }
}

export const vehicleDetailAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    regNumber: row.reg_number || '',
    trackName: row.track_name || '',
    vehicleTypeId: idStr(row.vehicle_type_id),
    terminalId: idStr(row.terminal_id),
    carrierId: idStr(row.carrier_id),
    make: row.make || '',
    model: row.model || '',
    year: row.year ?? '',
    vin: row.vin || '',
    integrationId: row.integration_id || '',
    prepassNumber: row.prepass_number || '',
    notes: row.notes || '',
    licenseNumber: row.license_number || '',
    registrationDate: row.registration_date ? String(row.registration_date).slice(0, 10) : '',
    regExpiryDate: row.reg_expiry_date ? String(row.reg_expiry_date).slice(0, 10) : '',
    purchaseDate: row.purchase_date ? String(row.purchase_date).slice(0, 10) : '',
    inServiceFrom: row.in_service_from ? String(row.in_service_from).slice(0, 10) : '',
    expireDate: row.expire_date ? String(row.expire_date).slice(0, 10) : '',
    inspectionExpiration: row.inspection_expiration ? String(row.inspection_expiration).slice(0, 10) : '',
    insuranceRenewalDate: row.insurance_renewal_date ? String(row.insurance_renewal_date).slice(0, 10) : '',
    lastMaintenanceDate: row.last_maintenance_date ? String(row.last_maintenance_date).slice(0, 10) : '',
    soldDate: row.sold_date ? String(row.sold_date).slice(0, 10) : '',
    soldPrice: row.sold_price ?? '',
    tankCapacity: row.tank_capacity ?? '',
    averageMpg: row.average_mpg ?? '',
    defLevel: row.def_level ?? '',
    startingMileage: row.starting_mileage ?? '',
    currentMileage: row.current_mileage ?? '',
    mortgageCost: row.mortgage_cost ?? '',
    annualInsuranceCost: row.annual_insurance_cost ?? '',
    annualPlateCost: row.annual_plate_cost ?? '',
    isOwnerOperated: !!row.is_owner_operated,
    isCameraInstalled: !!row.is_camera_installed,
    isApuInstalled: !!row.is_apu_installed,
    active: row.is_active !== false,
    isLease: !!row.is_lease,
    leaseCarrierId: idStr(row.lease_carrier_id),
    leaseStartDate: row.lease_start_date ? String(row.lease_start_date).slice(0, 10) : '',
    leaseEndDate: row.lease_end_date ? String(row.lease_end_date).slice(0, 10) : '',
  }),
  toApi: (form) => ({
    reg_number: form.regNumber,
    track_name: form.trackName || null,
    vehicle_type_id: idNum(form.vehicleTypeId),
    terminal_id: idNum(form.terminalId),
    carrier_id: idNum(form.carrierId),
    make: form.make || null,
    model: form.model || null,
    year: idNum(form.year),
    vin: form.vin || null,
    integration_id: form.integrationId || null,
    prepass_number: form.prepassNumber || null,
    notes: form.notes || null,
    license_number: form.licenseNumber || null,
    registration_date: form.registrationDate || null,
    reg_expiry_date: form.regExpiryDate || null,
    purchase_date: form.purchaseDate || null,
    in_service_from: form.inServiceFrom || null,
    expire_date: form.expireDate || null,
    inspection_expiration: form.inspectionExpiration || null,
    insurance_renewal_date: form.insuranceRenewalDate || null,
    last_maintenance_date: form.lastMaintenanceDate || null,
    sold_date: form.soldDate || null,
    sold_price: form.soldPrice || null,
    tank_capacity: form.tankCapacity || null,
    average_mpg: form.averageMpg || null,
    def_level: form.defLevel || null,
    starting_mileage: form.startingMileage || null,
    current_mileage: form.currentMileage || null,
    mortgage_cost: form.mortgageCost || null,
    annual_insurance_cost: form.annualInsuranceCost || null,
    annual_plate_cost: form.annualPlateCost || null,
    is_owner_operated: !!form.isOwnerOperated,
    is_camera_installed: !!form.isCameraInstalled,
    is_apu_installed: !!form.isApuInstalled,
    is_active: !!form.active,
    is_lease: !!form.isLease,
    lease_carrier_id: idNum(form.leaseCarrierId),
    lease_start_date: form.leaseStartDate || null,
    lease_end_date: form.leaseEndDate || null,
  }),
}

export const trailerAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.name || '',
    make: row.make || '',
    model: row.model || '',
    carrierId: idStr(row.carrier_id),
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    name: form.name,
    make: form.make || null,
    model: form.model || null,
    carrier_id: idNum(form.carrierId),
    is_active: !!form.active,
  }),
}

// Full trailer master, mirroring the legacy ss_save_trailer save shape.
// license_state_id is left out — it's a real FK to `states`, which is empty
// in this database (see t_erp_backend table counts), so any dropdown for it
// would have zero options and any typed value would fail the FK. Re-add it
// once states are seeded. fleet_group_id is also left out — it's in the
// legacy function's signature but the reference frontend never exposes it
// either, and no type_master category documents what it means.
export function blankTrailerDetail() {
  return {
    id: '', name: '', trailerTypeId: '', contractTypeId: '', carrierId: '',
    length: '', height: '', terminalId: '', trailerStatusId: '',
    make: '', model: '', makeYear: '', vin: '',
    licenseNumber: '', licenseExp: '', inspectionExp: '', registrationNumber: '',
    monthlyCost: '', inServiceFrom: '', leaseStartDate: '', leaseEndDate: '',
    sourceReference: '', integrationId: '', notes: '', active: true,
  }
}

export const trailerDetailAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.name || '',
    trailerTypeId: idStr(row.trailer_type_id),
    contractTypeId: idStr(row.contract_type_id),
    carrierId: idStr(row.carrier_id),
    length: row.length ?? '',
    height: row.height ?? '',
    terminalId: idStr(row.terminal_id),
    trailerStatusId: idStr(row.trailer_status_id),
    make: row.make || '',
    model: row.model || '',
    makeYear: row.make_year ?? '',
    vin: row.vin || '',
    licenseNumber: row.license_number || '',
    licenseExp: row.license_exp ? String(row.license_exp).slice(0, 10) : '',
    inspectionExp: row.inspection_exp ? String(row.inspection_exp).slice(0, 10) : '',
    registrationNumber: row.registration_number || '',
    monthlyCost: row.monthly_cost ?? '',
    inServiceFrom: row.in_service_from ? String(row.in_service_from).slice(0, 10) : '',
    leaseStartDate: row.lease_start_date ? String(row.lease_start_date).slice(0, 10) : '',
    leaseEndDate: row.lease_end_date ? String(row.lease_end_date).slice(0, 10) : '',
    sourceReference: row.source_reference || '',
    integrationId: row.integration_id || '',
    notes: row.notes || '',
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    name: form.name,
    trailer_type_id: idNum(form.trailerTypeId),
    contract_type_id: idNum(form.contractTypeId),
    carrier_id: idNum(form.carrierId),
    length: form.length || null,
    height: form.height || null,
    terminal_id: idNum(form.terminalId),
    trailer_status_id: idNum(form.trailerStatusId),
    make: form.make || null,
    model: form.model || null,
    make_year: idNum(form.makeYear),
    vin: form.vin || null,
    license_number: form.licenseNumber || null,
    license_exp: form.licenseExp || null,
    inspection_exp: form.inspectionExp || null,
    registration_number: form.registrationNumber || null,
    monthly_cost: form.monthlyCost || null,
    in_service_from: form.inServiceFrom || null,
    lease_start_date: form.leaseStartDate || null,
    lease_end_date: form.leaseEndDate || null,
    source_reference: form.sourceReference || null,
    integration_id: form.integrationId || null,
    notes: form.notes || null,
    is_active: !!form.active,
  }),
}

export const locationAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.location_name || '',
    address: row.address_line1 || '',
    city: row.city_name || '',
    state: row.state_name || '',
    country: row.country_name || 'USA',
    lat: row.lat ?? '',
    lon: row.long ?? '',
    zipCode: row.zip_code || '',
    phone: row.phone || '',
    carrierId: idStr(row.carrier_id),
  }),
  toApi: (form) => ({
    location_name: form.name,
    address_line1: form.address,
    city_name: form.city || null,
    state_name: form.state || null,
    country_name: form.country || 'USA',
    lat: form.lat === '' || form.lat == null ? null : Number(form.lat),
    long: form.lon === '' || form.lon == null ? null : Number(form.lon),
    zip_code: form.zipCode || null,
    phone: form.phone || null,
    carrier_id: idNum(form.carrierId),
  }),
}

// Full location master, mirroring the legacy ss_save_locations save shape.
// carrier_id is tenant-scoping (auto-injected server-side, see
// locations.controller.js) — not in this form, same reasoning as customers.
export function blankLocationDetail() {
  return {
    id: '', name: '', address: '', address2: '', city: '', state: '', country: 'USA', zipCode: '',
    phone: '', phoneExt: '', fax: '', email: '', website: '', contactPerson: '', notes: '',
    isLocalTerminal: false, status: true,
  }
}

export const locationDetailAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    name: row.location_name || '',
    address: row.address_line1 || '',
    address2: row.address_line2 || '',
    city: row.city_name || '',
    state: row.state_name || '',
    country: row.country_name || 'USA',
    zipCode: row.zip_code || '',
    phone: row.phone || '',
    phoneExt: row.phone_ext || '',
    fax: row.fax || '',
    email: row.email || '',
    website: row.website || '',
    contactPerson: row.contact_person || '',
    notes: row.notes || '',
    isLocalTerminal: !!row.is_local_terminal,
    status: row.status !== false,
  }),
  toApi: (form) => ({
    location_name: form.name,
    address_line1: form.address,
    address_line2: form.address2 || null,
    city_name: form.city || null,
    state_name: form.state || null,
    country_name: form.country || null,
    zip_code: form.zipCode || null,
    phone: form.phone || null,
    phone_ext: form.phoneExt || null,
    fax: form.fax || null,
    email: form.email || null,
    website: form.website || null,
    contact_person: form.contactPerson || null,
    notes: form.notes || null,
    is_local_terminal: !!form.isLocalTerminal,
    status: !!form.status,
  }),
}

export const terminalAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    code: row.code || '',
    name: row.name || '',
    address: row.address_line1 || '',
    city: row.city_name || '',
    state: row.state_name || '',
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    code: form.code,
    name: form.name,
    address_line1: form.address || null,
    city_name: form.city || null,
    state_name: form.state || null,
  }),
}

// Full terminal master, mirroring the legacy ss_save_terminal save shape
// (reconstructed from Loadx-Youngs-Backend/src/services/terminal.service.js's
// callSaveTerminal parameter order). carrier_id is tenant-scoping — read from
// the JWT in that reference backend's controller, never from the request
// body — so it's auto-injected server-side here too (terminal.controller.js)
// and left out of this form, same as customers/locations.
export function blankTerminalDetail() {
  return {
    id: '', code: '', name: '', address: '', city: '', state: '', country: 'USA',
    contactPerson: '', contactPhone: '', contactEmail: '', extCode: '', active: true,
  }
}

export const terminalDetailAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    code: row.code || '',
    name: row.name || '',
    address: row.address_line1 || '',
    city: row.city_name || '',
    state: row.state_name || '',
    country: row.country_name || 'USA',
    contactPerson: row.contact_person || '',
    contactPhone: row.contact_phone != null ? String(row.contact_phone) : '',
    contactEmail: row.contact_email || '',
    extCode: row.ext_code || '',
    active: !!row.is_active,
  }),
  toApi: (form) => ({
    code: form.code,
    name: form.name,
    address_line1: form.address || null,
    city_name: form.city || null,
    state_name: form.state || null,
    country_name: form.country || null,
    contact_person: form.contactPerson || null,
    contact_phone: digitsOnly(form.contactPhone),
    contact_email: form.contactEmail || null,
    ext_code: form.extCode || null,
    is_active: !!form.active,
  }),
}

export const userAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    fullName: row.full_name || '',
    email: row.user_email || row.user_name || '',
    carrierId: idStr(row.carrier_id),
    active: !!row.is_active,
  }),
  toApi: (form, { isCreate } = {}) => {
    const payload = {
      full_name: form.fullName,
      user_name: form.email,
      user_email: form.email,
      carrier_id: idNum(form.carrierId),
    }
    if (isCreate || form.password) payload.password = form.password
    return payload
  },
}

// Lightweight load shape for Dashboard/Loads list/Dispatch board — these only
// read loadNumber/customerId/stops (pickup+delivery city) plus the real,
// persisted trip/tracking status rollup (kept in sync server-side by
// load_assignments.service.js.syncLoadStatus on every dispatch/split/merge).
// `dispatch` itself (driver/vehicle/trailer summary) isn't carried on this
// lightweight shape — see assignmentDetailAdapter + loadDetailAdapter's
// `assignments` array for the full per-leg detail used by LoadDrawer.
const stopTypeFromApi = (id) => (Number(id) === 2 ? 'Delivery' : 'Pickup')
const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')
const timeOnly = (v) => (v ? String(v).slice(11, 16) : '')
const dateTimeLocal = (v) => (v ? String(v).slice(0, 16).replace(' ', 'T') : '')

// loads.trip_status_type_id / tracking_status_type_id — full vocabulary,
// matching the reference Loadx-Youngs-Backend exactly (confirmed live
// against type_master). trip_status_type_id uses type_master(type_id=34) —
// that category is shared with event-log labels (Load Created, Load Edited,
// BOL Updated, ...), so only the 8 ids the reference's own manual
// status-change FSM (ss_save_changeloadstatus) actually allows are valid
// trip statuses; the rest are audit-only and never appear here.
// tracking_status_type_id uses type_master(type_id=46), all 13 values,
// unrestricted (same as the reference's web dispatcher UI — only its
// mobile driver app splits these into pickup/delivery phase subsets).
//
// trip_status_type_id is both auto-rolled-up from load_assignments on every
// dispatch/split change (see t_erp_backend's syncLoadStatus — In Transit if
// any leg is In Transit, else Dropped if any leg Completed, else Scheduled
// if any leg exists, else Open) AND manually settable via the Load Status
// field in LoadEditDrawer (matching the reference's separate manual FSM
// path) — whichever wrote it last wins, same as the reference.
export const TRIP_STATUS_LABELS = {
  5: 'Open', 6: 'Scheduled', 7: 'Completed', 8: 'Complete To NU',
  9: 'In Pickup Yard', 10: 'In Transit', 11: 'Cancelled', 13: 'Dropped',
}
const TRACKING_STATUS_LABELS = {
  1: 'En Route', 2: 'At Pickup', 3: 'Loading Started', 4: 'Loading Completed',
  5: 'In Transit', 6: 'At Delivery', 7: 'Unloading Started', 8: 'Unloading Completed',
  9: 'Detention Begin', 10: 'Detention Ended', 11: 'PickUp Completed', 12: 'Delivered', 13: 'Completed',
}
const tripStatusFromApi = (id) => TRIP_STATUS_LABELS[Number(id)] || 'Open'
const trackingStatusFromApi = (id) => (id == null ? 'Not Tracking' : TRACKING_STATUS_LABELS[Number(id)] || 'Tracking Active')

export const loadAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    loadNumber: row.load_number || '',
    customerId: idStr(row.customer_id),
    tripStatusId: idStr(row.trip_status_type_id),
    tripStatus: tripStatusFromApi(row.trip_status_type_id),
    trackingStatus: trackingStatusFromApi(row.tracking_status_type_id),
    dispatch: null,
    createdAt: row.addtime || new Date().toISOString(),
    createdByUserId: idStr(row.aduserid),
    primaryFee: row.primary_fee ?? '',
    tenderedMiles: row.tendered_miles ?? '',
    isHazmat: !!row.is_hazmat,
    bookingAuthorityId: idStr(row.booking_authority_id),
    salesAgentId: idStr(row.sales_agent_id),
    // Public rate-con share link is per-dispatched-leg, not per-load — see
    // getShareLink in loadHelpers.js, which pairs this with the load's first
    // external assignment.
    token: row.token || '',
    stops: (row.stops || []).map((s) => ({
      id: idStr(s.id),
      stopType: stopTypeFromApi(s.stop_type_id),
      locationId: idStr(s.shipper_id),
      stopDate: dateOnly(s.start_dt),
      startDt: s.start_dt || '',
      endDt: s.end_dt || '',
      // Kept on this lightweight shape (unlike the rest of load_stops) so
      // the Dashboard filter panel / columns can match without a second
      // round trip per load — see Dashboard.jsx's LoadsFilterPanel and
      // column list (mirrors the reference Loadx-Youngs-Frontend's 39
      // Dashboard columns).
      pickupNumber: s.pickup_number || '',
      poNumber: s.po_number || '',
      bolNumber: s.shipment_bol_number || '',
      customerRef: s.customer_ref || '',
      qty: s.total_qty ?? '',
      qtyTypeId: idStr(s.qty_type_id),
      weight: s.total_weight ?? '',
      commodity: s.commodity || '',
      stopActionId: idStr(s.stop_action_id),
      tempValue: s.temp_value ?? '',
    })),
    assignments: (row.assignments || []).map(assignmentFromApi),
  }),
}

// Full load master matching ss_save_loads_v1's editable field set — see
// t_erp_backend/src/services/loads.service.js for exactly which loads/
// load_stops columns are covered. Dispatch/split is real too, via the
// `assignments` array (see assignmentDetailAdapter below and
// t_erp_backend/src/services/loadAssignments.service.js) — driver_id/
// vehicle_id/trailer_id/dispatcher_id/tracking_status_type_id all live on
// load_assignments rows, not on the load itself. Still out of scope:
// settlement_*, inv_*, ai_*. Per-stop route_name/yard_location_id/
// stop_pickup_id/width/height are also left out — real columns with no
// field in either our UI or the reference LoadDetailDrawer's primary flow.
export function blankLoadDetail() {
  return {
    id: '',
    loadNumber: '',
    customerId: '',
    // Same value on every stop (see load_stops.customer_ref) — exposed as one
    // load-level field instead of a per-stop one; toApi below fans it out.
    customerRef: '',
    tripStatusId: '5',
    tripStatus: 'Open',
    trackingStatus: 'Not Tracking',
    dispatch: null,
    createdAt: new Date().toISOString(),
    rate: { primaryFee: '', feeTypeId: '', tenderedMiles: '', fuelSurchargeTypeId: '', fuelSurchargeAmount: '', targetRate: '', declaredValue: '' },
    equipment: { vanTypeId: '', length: '', weight: '', commodity: '', hazmat: false, hazmatTypeId: '', tarpRequired: false },
    parties: { bookingAuthorityId: '', brokerageAgentId: '', salesAgentId: '', bookingTerminalId: '' },
    notes: { customerLoadNotes: '', dispatchNotes: '' },
    stops: [],
    assignments: [],
  }
}

function stopFromApi(s, i) {
  return {
    id: idStr(s.id) || `local-${i}`,
    stopType: stopTypeFromApi(s.stop_type_id),
    sequence: s.seq_no ?? i + 1,
    // Which split/leg this stop belongs to — see t_erp_backend
    // loadAssignments.service.js: load_stops.split_no is the source of
    // truth for leg membership (every stop belongs to exactly one leg).
    splitNo: s.split_no ?? 1,
    isSplitLoad: !!s.is_split_load,
    locationId: idStr(s.shipper_id),
    customerRef: s.customer_ref || '',
    appointmentRequired: !!s.is_appt_required,
    scheduled: !!s.is_scheduled,
    stopDate: dateOnly(s.start_dt),
    startTime: timeOnly(s.start_dt),
    endTime: timeOnly(s.end_dt),
    qty: s.total_qty ?? '',
    qtyTypeId: idStr(s.qty_type_id),
    weight: s.total_weight ?? '',
    commodity: s.commodity || '',
    pickupNumber: s.pickup_number || '',
    bolNumber: s.shipment_bol_number || '',
    poNumber: s.po_number || '',
    instructions: s.instructions || '',
    stopActionId: idStr(s.stop_action_id),
    reeferModeId: idStr(s.reefer_mode_id),
    tempValue: s.temp_value ?? '',
    seal: s.seal_number || '',
    container: s.container_number || '',
    chassis: s.chassis_number || '',
    customerTrailer: s.customer_trailer_number || '',
    pro: s.pro_number || '',
  }
}

function stopToApi(s) {
  const toIsoDt = (date, time) => (date ? `${date}T${time || '00:00'}:00` : null)
  // id must round-trip so the backend's upsertStops can match this stop to
  // its existing row (see t_erp_backend loads.service.js) — omitting it
  // makes every save look like a brand-new stop, deleting the old row and
  // cascade-deleting any load_assignments that reference it.
  const stopId = Number(s.id)
  return {
    ...(Number.isInteger(stopId) && stopId > 0 ? { id: stopId } : {}),
    stop_type_id: s.stopType === 'Delivery' ? 2 : 1,
    shipper_id: idNum(s.locationId),
    customer_ref: s.customerRef || null,
    stop_action_id: idNum(s.stopActionId),
    is_appt_required: !!s.appointmentRequired,
    is_scheduled: !!s.scheduled,
    total_qty: s.qty === '' ? null : Number(s.qty),
    qty_type_id: idNum(s.qtyTypeId),
    total_weight: s.weight === '' ? null : Number(s.weight),
    commodity: s.commodity || null,
    pickup_number: s.pickupNumber || null,
    shipment_bol_number: s.bolNumber || null,
    po_number: s.poNumber || null,
    reefer_mode_id: idNum(s.reeferModeId),
    temp_value: s.tempValue === '' ? null : s.tempValue,
    instructions: s.instructions || null,
    seal_number: s.seal || null,
    container_number: s.container || null,
    chassis_number: s.chassis || null,
    customer_trailer_number: s.customerTrailer || null,
    pro_number: s.pro || null,
    start_dt: toIsoDt(s.stopDate, s.startTime),
    end_dt: toIsoDt(s.stopDate, s.endTime),
    seq_no: s.sequence,
    split_no: s.splitNo || 1,
    is_split_load: !!s.isSplitLoad,
  }
}

function assignmentFromApi(row) {
  return {
    id: idStr(row.id),
    loadStopId: idStr(row.load_stop_id),
    splitNo: row.split_no,
    isExternal: !!row.is_external,
    carrierId: idStr(row.dispatch_carrier_id),
    trackingStatusId: idStr(row.tracking_status_type_id),
    driverId1: idStr(row.driver_id1),
    driverId2: idStr(row.driver_id2),
    vehicleId: idStr(row.vehicle_id),
    trailerId: idStr(row.trailer_id),
    dispatcherId: idStr(row.dispatcher_id),
    dispatchStartDt: dateTimeLocal(row.dispatch_start_dt),
    dispatchEndDt: dateTimeLocal(row.dispatch_end_dt),
    // "Completed" tracking status (id 13) prompts for these two — see
    // CompanyDispatchModal/BrokerDispatchModal. complete_dt doubles as
    // "In Time"; complete_out_dt is "Out Time".
    completeDt: dateTimeLocal(row.complete_dt),
    completeOutDt: dateTimeLocal(row.complete_out_dt),
    driverName: row.driver_name || '',
    driverPhone: row.driver_phone || '',
    secondaryDriverName: row.secondary_driver_name || '',
    secondaryDriverPhone: row.secondary_driver_phone || '',
    vehicleNo: row.vehicle_no || '',
    trailerNo: row.trailer_no || '',
    dispatchRemark: row.dispatch_remark || '',
    stopPoints: Array.isArray(row.stop_points) ? row.stop_points.map((p) => idStr(p)) : [],
  }
}

// Maps the shared dispatch fields between Company/Broker dispatch modals and
// a load_assignments row (one leg). Each modal adds its own extra fields on
// top via { ...assignmentDetailAdapter.toApi(form), is_external: ... }.
export const assignmentDetailAdapter = {
  fromApi: assignmentFromApi,
  toApi: (form) => ({
    dispatch_carrier_id: idNum(form.carrierId),
    tracking_status_type_id: idNum(form.trackingStatusId),
    driver_id1: idNum(form.driverId1),
    driver_id2: idNum(form.driverId2),
    vehicle_id: idNum(form.vehicleId),
    trailer_id: idNum(form.trailerId),
    dispatcher_id: idNum(form.dispatcherId),
    dispatch_start_dt: form.dispatchStartDt || null,
    dispatch_end_dt: form.dispatchEndDt || null,
    complete_dt: form.completeDt || null,
    complete_out_dt: form.completeOutDt || null,
    driver_name: form.driverName || null,
    driver_phone: form.driverPhone || null,
    secondary_driver_name: form.secondaryDriverName || null,
    secondary_driver_phone: form.secondaryDriverPhone || null,
    vehicle_no: form.vehicleNo || null,
    trailer_no: form.trailerNo || null,
    dispatch_remark: form.dispatchRemark || null,
  }),
}

export const loadDetailAdapter = {
  fromApi: (row) => ({
    id: idStr(row.id),
    loadNumber: row.load_number || '',
    customerId: idStr(row.customer_id),
    // Same value on every stop in practice — read from the first stop that
    // has one set (rather than always row.stops[0], in case an older load
    // has it recorded unevenly across stops).
    customerRef: (row.stops || []).find((s) => s.customer_ref)?.customer_ref || '',
    tripStatusId: idStr(row.trip_status_type_id),
    tripStatus: tripStatusFromApi(row.trip_status_type_id),
    trackingStatus: trackingStatusFromApi(row.tracking_status_type_id),
    dispatch: null,
    assignments: (row.assignments || []).map(assignmentFromApi),
    createdAt: row.addtime || new Date().toISOString(),
    rate: {
      primaryFee: row.primary_fee ?? '',
      feeTypeId: idStr(row.fee_type_id),
      tenderedMiles: row.tendered_miles ?? '',
      fuelSurchargeTypeId: idStr(row.fuel_surcharge_type_id),
      fuelSurchargeAmount: row.fuel_surcharge ?? '',
      targetRate: row.target_rate ?? '',
      declaredValue: row.declared_value ?? '',
    },
    equipment: {
      vanTypeId: idStr(row.van_type_id),
      length: intStr(row.length),
      weight: row.weight ?? '',
      commodity: row.commodity || '',
      hazmat: !!row.is_hazmat,
      hazmatTypeId: idStr(row.hazmat_type_id),
      tarpRequired: !!row.is_tarp_required,
    },
    parties: {
      bookingAuthorityId: idStr(row.booking_authority_id),
      brokerageAgentId: idStr(row.brokerage_agent_id),
      salesAgentId: idStr(row.sales_agent_id),
      bookingTerminalId: idStr(row.booking_terminal_id),
    },
    notes: {
      customerLoadNotes: row.customer_load_notes || '',
      dispatchNotes: row.dispatch_notes || '',
    },
    stops: (row.stops || []).map(stopFromApi),
  }),
  toApi: (form) => ({
    customer_id: idNum(form.customerId),
    // On create the backend always forces this to 5 (Open) regardless of
    // what's sent (matches the reference's ss_save_loads); on update it's
    // the manual Load Status field — see LoadEditDrawer.jsx.
    trip_status_type_id: idNum(form.tripStatusId),
    primary_fee: form.rate.primaryFee === '' ? null : Number(form.rate.primaryFee),
    fee_type_id: idNum(form.rate.feeTypeId),
    tendered_miles: form.rate.tenderedMiles === '' ? null : Number(form.rate.tenderedMiles),
    fuel_surcharge_type_id: idNum(form.rate.fuelSurchargeTypeId),
    fuel_surcharge: form.rate.fuelSurchargeAmount === '' ? null : Number(form.rate.fuelSurchargeAmount),
    target_rate: form.rate.targetRate === '' ? null : Number(form.rate.targetRate),
    declared_value: form.rate.declaredValue === '' ? null : Number(form.rate.declaredValue),
    van_type_id: idNum(form.equipment.vanTypeId),
    length: form.equipment.length === '' ? null : Math.round(Number(form.equipment.length)),
    weight: form.equipment.weight === '' ? null : Number(form.equipment.weight),
    commodity: form.equipment.commodity || null,
    is_hazmat: !!form.equipment.hazmat,
    hazmat_type_id: form.equipment.hazmat ? idNum(form.equipment.hazmatTypeId) : null,
    is_tarp_required: !!form.equipment.tarpRequired,
    booking_authority_id: idNum(form.parties.bookingAuthorityId),
    brokerage_agent_id: idNum(form.parties.brokerageAgentId),
    sales_agent_id: idNum(form.parties.salesAgentId),
    booking_terminal_id: idNum(form.parties.bookingTerminalId),
    customer_load_notes: form.notes.customerLoadNotes || null,
    dispatch_notes: form.notes.dispatchNotes || null,
    // Load-level Customer Ref # fans out to every stop's customer_ref column
    // (there's no dedicated loads.customer_ref — see blankLoadDetail above).
    stops: form.stops.map((s) => stopToApi({ ...s, customerRef: form.customerRef })),
  }),
}
