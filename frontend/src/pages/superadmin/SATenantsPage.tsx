import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2, Plus, Pencil, ToggleLeft, ToggleRight, X,
  Eye, EyeOff, Copy, CheckCircle2, Upload, Trash2, FileText,
  RefreshCw,
} from 'lucide-react';
import {
  getTenants, createTenant, updateTenant, toggleTenantActive,
  getPaymentSettings, updatePaymentSettings, uploadLogo,
  getDocumentTypes, getTenantDocuments, uploadTenantDocument, deleteTenantDocument,
} from '../../services/tenantService';
import { getCountries } from '../../services/locationService';
import type {
  Tenant, CreateTenantRequest, UpdateTenantRequest,
  PaymentSettings, Country, CreateTenantResponse,
  TenantDocumentType, TenantDocument,
} from '../../types';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types / helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Tab = 'company' | 'contact' | 'payment' | 'locations' | 'documents';

const TABS: { id: Tab; label: string }[] = [
  { id: 'company',   label: 'Company'        },
  { id: 'contact',   label: 'Contact Person' },
  { id: 'payment',   label: 'Payment'        },
  { id: 'locations', label: 'Locations'      },
  { id: 'documents', label: 'Documents'      },
];

const TITLES = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'];

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function emptyForm(): CreateTenantRequest {
  return {
    name: '', slug: '', loginUrl: '',
    contactEmail: '', contactPhone: '', companyMobile: '',
    website: '', logoUrl: '', trn: '',
    defaultCountryId: undefined, stateProvince: '', defaultCityText: '', street: '', postalCode: '',
    contactTitle: 'Mr', contactFirstName: '', contactLastName: '', contactMobilePhone: '',
    contactPersonEmail: '',
    contactCountryId: undefined, contactState: '', contactCityText: '', contactStreet: '', contactPostalCode: '',
    sendWelcomeEmail: false,
    paymentSettings: {
      acceptCash: false, acceptOnline: false,
      ccAvenueEnabled: false, ccAvenueMerchantId: '', ccAvenueAccessCode: '', ccAvenueWorkingKey: '',
      magnatiEnabled: false, magnatiApiKey: '', magnatiMerchantId: '', magnatiSecretKey: '',
    },
  };
}

function emptyPayment(): PaymentSettings {
  return {
    acceptCash: false, acceptOnline: false,
    ccAvenueEnabled: false, ccAvenueMerchantId: '', ccAvenueAccessCode: '', ccAvenueWorkingKey: '',
    magnatiEnabled: false, magnatiApiKey: '', magnatiMerchantId: '', magnatiSecretKey: '',
  };
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Small shared components
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500';
const labelCls = 'block text-xs text-gray-400 mb-1';

function Field({
  label, value, onChange, type = 'text', required, placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className={inputCls} />
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function SelectField({
  label, value, onChange, children, hint,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={inputCls + ' cursor-pointer'}>
        {children}
      </select>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function SecretField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          className={inputCls + ' pr-10'} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, sub }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; sub?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer select-none ${sub ? 'ml-6' : ''}`}>
      <div onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-slate-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
      <span className={`text-sm ${sub ? 'text-gray-400' : 'text-gray-300'}`}>{label}</span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">{children}</p>;
}

function AddressBlock({
  prefix, values, onChange, countries,
}: {
  prefix: string;
  values: {
    countryId?: number; state?: string; city?: string; street?: string; postal?: string;
  };
  onChange: (field: string, val: string | number | undefined) => void;
  countries: Country[];
}) {
  return (
    <div className="space-y-3">
      <SelectField label="Country" value={values.countryId ?? ''} onChange={v => onChange(`${prefix}CountryId`, v ? Number(v) : undefined)}>
        <option value="">â€” Select country â€”</option>
        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <Field label="State / Province" value={values.state ?? ''} onChange={v => onChange(`${prefix}State`, v)} placeholder="Dubai" />
        <Field label="City" value={values.city ?? ''} onChange={v => onChange(`${prefix}City`, v)} placeholder="Dubai" />
      </div>
      <Field label="Address" value={values.street ?? ''} onChange={v => onChange(`${prefix}Street`, v)} placeholder="Office 101, Building Name, Street" />
      <Field label="Postal Code" value={values.postal ?? ''} onChange={v => onChange(`${prefix}Postal`, v)} placeholder="00000" />
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main page
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SATenantsPage() {
  const [tenants, setTenants]     = useState<Tenant[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [docTypes, setDocTypes]   = useState<TenantDocumentType[]>([]);
  const [loading, setLoading]     = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editTenant, setEditTenant]   = useState<Tenant | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>('company');
  const [form, setForm]               = useState<CreateTenantRequest>(emptyForm());
  const [payment, setPayment]         = useState<PaymentSettings>(emptyPayment());
  const [submitting, setSubmitting]   = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [slugManual, setSlugManual]   = useState(false);

  // Logo
  const [logoPreview, setLogoPreview]   = useState<string | null>(null);
  const [logoFile, setLogoFile]         = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Documents (for edit mode)
  const [tenantDocs, setTenantDocs]   = useState<TenantDocument[]>([]);
  const [docUploading, setDocUploading] = useState<Record<number, boolean>>({});

  // Temp password banner
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copiedTemp, setCopiedTemp]     = useState(false);

  // Generated password (contact tab)
  const [genPassword, setGenPassword]   = useState('');
  const [genPasswordVisible, setGenPasswordVisible] = useState(false);

  // â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const load = useCallback(() => {
    setLoading(true);
    getTenants().then(setTenants).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    getCountries().then(setCountries).catch(console.error);
    getDocumentTypes().then(setDocTypes).catch(console.error);
  }, [load]);

  // â”€â”€ Open/close drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openCreate = () => {
    setEditTenant(null);
    setForm(emptyForm());
    setPayment(emptyPayment());
    setActiveTab('company');
    setDrawerError('');
    setTempPassword(null);
    setLogoPreview(null);
    setLogoFile(null);
    setGenPassword('');
    setSlugManual(false);
    setDrawerOpen(true);
  };

  const openEdit = async (t: Tenant) => {
    setEditTenant(t);
    const f: CreateTenantRequest = {
      name: t.name, slug: t.slug, loginUrl: t.loginUrl ?? '',
      contactEmail: t.contactEmail, contactPhone: t.contactPhone ?? '',
      companyMobile: t.companyMobile ?? '', website: t.website ?? '',
      logoUrl: t.logoUrl ?? '', trn: t.trn ?? '',
      defaultCountryId: t.defaultCountryId, stateProvince: t.stateProvince ?? '',
      defaultCityText: t.defaultCityText ?? '', street: t.street ?? '', postalCode: t.postalCode ?? '',
      contactTitle: t.contactTitle ?? 'Mr', contactFirstName: t.contactFirstName ?? '',
      contactLastName: t.contactLastName ?? '', contactMobilePhone: t.contactMobilePhone ?? '',
      contactPersonEmail: t.contactPersonEmail ?? '',
      contactCountryId: t.contactCountryId, contactState: t.contactState ?? '',
      contactCityText: t.contactCityText ?? '', contactStreet: t.contactStreet ?? '',
      contactPostalCode: t.contactPostalCode ?? '',
      sendWelcomeEmail: false,
    };
    setForm(f);
    setLogoPreview(t.logoUrl ?? null);
    setLogoFile(null);
    setPayment(emptyPayment());
    setActiveTab('company');
    setDrawerError('');
    setTempPassword(null);
    setGenPassword('');
    setSlugManual(true);
    setDrawerOpen(true);
    // Fetch related data in background
    getPaymentSettings(t.id).then(setPayment).catch(() => {});
    getTenantDocuments(t.id).then(setTenantDocs).catch(() => setTenantDocs([]));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditTenant(null);
    setTenantDocs([]);
  };

  // â”€â”€ Form helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const setF = <K extends keyof CreateTenantRequest>(k: K, v: CreateTenantRequest[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const setP = <K extends keyof PaymentSettings>(k: K, v: PaymentSettings[K]) =>
    setPayment(prev => ({ ...prev, [k]: v }));

  const handleNameChange = (v: string) => {
    setF('name', v);
    if (!slugManual) setF('slug', slugify(v));
  };

  const handleAddressChange = (field: string, val: string | number | undefined) => {
    // Maps prefix-style field names back to form keys
    const map: Record<string, keyof CreateTenantRequest> = {
      companyCountryId: 'defaultCountryId', companyState: 'stateProvince',
      companyCity: 'defaultCityText', companyStreet: 'street', companyPostal: 'postalCode',
      contactCountryId: 'contactCountryId', contactState: 'contactState',
      contactCity: 'contactCityText', contactStreet: 'contactStreet', contactPostal: 'contactPostalCode',
    };
    const key = map[field];
    if (key) setForm(prev => ({ ...prev, [key]: val } as CreateTenantRequest));
  };

  // â”€â”€ Logo handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  // â”€â”€ Generate password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setGenPassword(pwd);
    setGenPasswordVisible(true);
  };

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSubmit = async () => {
    setSubmitting(true);
    setDrawerError('');
    try {
      if (editTenant) {
        const upd: UpdateTenantRequest = {
          name: form.name, loginUrl: form.loginUrl, contactEmail: form.contactEmail,
          contactPhone: form.contactPhone, companyMobile: form.companyMobile,
          website: form.website, logoUrl: form.logoUrl, trn: form.trn,
          defaultCountryId: form.defaultCountryId, stateProvince: form.stateProvince,
          defaultCityText: form.defaultCityText, street: form.street, postalCode: form.postalCode,
          contactTitle: form.contactTitle, contactFirstName: form.contactFirstName,
          contactLastName: form.contactLastName, contactMobilePhone: form.contactMobilePhone,
          contactPersonEmail: form.contactPersonEmail,
          contactCountryId: form.contactCountryId, contactState: form.contactState,
          contactCityText: form.contactCityText, contactStreet: form.contactStreet,
          contactPostalCode: form.contactPostalCode,
        };
        // Upload logo file if new file was chosen
        if (logoFile) {
          const logoUrl = await uploadLogo(editTenant.id, logoFile);
          upd.logoUrl = logoUrl;
        }
        await updateTenant(editTenant.id, upd);
        await updatePaymentSettings(editTenant.id, payment);
        closeDrawer();
        load();
      } else {
        const payload: CreateTenantRequest = { ...form, paymentSettings: payment };
        const result: CreateTenantResponse = await createTenant(payload);
        // Upload logo after creation if file was chosen
        if (logoFile && result.id) {
          await uploadLogo(result.id, logoFile);
        }
        if (result.tempPassword) {
          setTempPassword(result.tempPassword);
        }
        closeDrawer();
        load();
      }
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try { await toggleTenantActive(id); load(); } catch (err) { console.error(err); }
  };

  const copyTempPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopiedTemp(true);
      setTimeout(() => setCopiedTemp(false), 2000);
    }
  };

  // â”€â”€ Document upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const ALLOWED_DOC_TYPES = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ALLOWED_DOC_ACCEPT = 'image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf';

  const handleDocUpload = async (typeId: number, file: File) => {
    if (!editTenant) return;
    // Client-side file-type guard
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_DOC_TYPES.includes(ext)) {
      setDrawerError(`Only PNG, JPG and PDF files are allowed. You selected: ${ext}`);
      return;
    }
    setDrawerError('');
    setDocUploading(prev => ({ ...prev, [typeId]: true }));
    try {
      const doc = await uploadTenantDocument(editTenant.id, typeId, file);
      setTenantDocs(prev => [doc, ...prev]);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setDocUploading(prev => ({ ...prev, [typeId]: false }));
    }
  };

  const handleDocDelete = async (docId: number) => {
    if (!editTenant) return;
    try {
      await deleteTenantDocument(editTenant.id, docId);
      setTenantDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) { console.error(err); }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="space-y-6">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tenants</h2>
          <p className="text-gray-400 mt-1">Manage all platform tenants</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Tenant
        </button>
      </div>

      {/* â”€â”€ Temp password banner â”€â”€ */}
      {tempPassword && (
        <div className="bg-amber-900/40 border border-amber-600 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 font-semibold text-sm">Tenant created â€” communicate this temporary password manually</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="bg-slate-800 text-amber-200 px-3 py-1 rounded-lg text-sm font-mono tracking-wider">{tempPassword}</code>
              <button onClick={copyTempPassword} className="text-gray-400 hover:text-white" title="Copy">
                {copiedTemp ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <button onClick={() => setTempPassword(null)} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* â”€â”€ Tenant table â”€â”€ */}
      {loading ? (
        <div className="text-gray-400 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loadingâ€¦</div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Contact Person</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Country</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">NexBook URL</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {t.logoUrl
                            ? <img src={t.logoUrl} alt="" className="w-9 h-9 object-cover" />
                            : <Building2 size={14} className="text-violet-200" />}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{t.name}</p>
                          <p className="text-gray-500 text-xs">{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-300 text-sm">
                        {[t.contactTitle, t.contactFirstName, t.contactLastName].filter(Boolean).join(' ') || 'â€”'}
                      </p>
                      <p className="text-gray-500 text-xs">{t.contactEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-sm">{t.defaultCountryName ?? 'â€”'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{t.loginUrl ?? 'â€”'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-white transition-colors" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleToggle(t.id)} title={t.isActive ? 'Deactivate' : 'Activate'}
                        className="text-gray-400 hover:text-white transition-colors">
                        {t.isActive ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-gray-400">
                      <Building2 size={36} className="mx-auto mb-2 opacity-20" />
                      No tenants yet. Create the first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          Slide-over drawer
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={closeDrawer} />

          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 flex flex-col h-full overflow-hidden shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {editTenant ? `Edit: ${editTenant.name}` : 'New Tenant'}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  {editTenant ? 'Update tenant details and settings' : 'Set up a new tenant workspace on NexBook'}
                </p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-slate-700 px-6 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-6 py-5 space-y-5">

                {drawerError && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{drawerError}</div>
                )}

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                    COMPANY TAB
                â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {activeTab === 'company' && (
                  <div className="space-y-5">

                    {/* Logo upload */}
                    <div>
                      <SectionTitle>Company Logo</SectionTitle>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                          {logoPreview
                            ? <img src={logoPreview} alt="Logo" className="w-16 h-16 object-cover" />
                            : <Building2 size={24} className="text-gray-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <button type="button" onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm border border-slate-600 transition-colors">
                            <Upload size={14} /> Upload Logo
                          </button>
                          <p className="text-xs text-gray-500">PNG, JPG or SVG Â· max 2 MB</p>
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                        </div>
                      </div>
                    </div>

                    {/* Company name + slug */}
                    <div className="space-y-3">
                      <SectionTitle>Company Information</SectionTitle>
                      <Field label="Company / Trading Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Innovative Tech Sports" />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Slug (auto-generated)</label>
                          <div className="flex gap-1.5">
                            <input value={form.slug} onChange={e => { setSlugManual(true); setF('slug', slugify(e.target.value)); }}
                              className={inputCls + ' flex-1'} placeholder="innovative-tech-sports" />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Auto-filled from name. Edit if needed.</p>
                        </div>
                        <Field label="Tenant NexBook URL" value={form.loginUrl ?? ''}
                          onChange={v => setF('loginUrl', v)}
                          placeholder="innovative-tech.nexbook.app"
                          hint="Optional â€” the tenant's booking portal URL" />
                      </div>
                      <Field label="TRN (Tax Registration Number)" value={form.trn ?? ''} onChange={v => setF('trn', v)} placeholder="100XXXXXXXXXXXX3" />
                    </div>

                    {/* Contact info */}
                    <div className="space-y-3">
                      <SectionTitle>Contact & Online</SectionTitle>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Official Email" value={form.contactEmail} onChange={v => setF('contactEmail', v)} type="email" />
                        <Field label="Phone" value={form.contactPhone ?? ''} onChange={v => setF('contactPhone', v)} placeholder="+971 4 000 0000" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Mobile" value={form.companyMobile ?? ''} onChange={v => setF('companyMobile', v)} placeholder="+971 50 000 0000" />
                        <Field label="Website" value={form.website ?? ''} onChange={v => setF('website', v)} placeholder="https://www.company.com" />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-3">
                      <SectionTitle>Company Address</SectionTitle>
                      <AddressBlock
                        prefix="company"
                        values={{
                          countryId: form.defaultCountryId,
                          state: form.stateProvince,
                          city: form.defaultCityText,
                          street: form.street,
                          postal: form.postalCode,
                        }}
                        onChange={handleAddressChange}
                        countries={countries}
                      />
                    </div>

                  </div>
                )}

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                    CONTACT PERSON TAB
                â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {activeTab === 'contact' && (
                  <div className="space-y-5">

                    <div className="space-y-3">
                      <SectionTitle>Contact Person Details</SectionTitle>
                      <div className="grid grid-cols-3 gap-3">
                        <SelectField label="Title" value={form.contactTitle ?? 'Mr'} onChange={v => setF('contactTitle', v)}>
                          {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                        </SelectField>
                        <Field label="First Name" value={form.contactFirstName ?? ''} onChange={v => setF('contactFirstName', v)} placeholder="John" />
                        <Field label="Last Name" value={form.contactLastName ?? ''} onChange={v => setF('contactLastName', v)} placeholder="Doe" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Mobile" value={form.contactMobilePhone ?? ''} onChange={v => setF('contactMobilePhone', v)} placeholder="+971 50 000 0000" />
                        <Field label="Contact Person Email" type="email"
                          value={form.contactPersonEmail ?? ''}
                          onChange={v => setF('contactPersonEmail', v)}
                          placeholder="john.doe@company.com"
                          hint="Used as the TenantAdmin login email" />
                      </div>
                    </div>

                    {/* Contact person address */}
                    <div className="space-y-3">
                      <SectionTitle>Contact Person Address</SectionTitle>
                      <AddressBlock
                        prefix="contact"
                        values={{
                          countryId: form.contactCountryId,
                          state: form.contactState,
                          city: form.contactCityText,
                          street: form.contactStreet,
                          postal: form.contactPostalCode,
                        }}
                        onChange={handleAddressChange}
                        countries={countries}
                      />
                    </div>

                    {/* Login information */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
                      <SectionTitle>Login Information</SectionTitle>
                      <div>
                        <label className={labelCls}>Login Email</label>
                        <input
                          value={form.contactPersonEmail || form.contactEmail || ''}
                          readOnly
                          className={inputCls + ' opacity-60 cursor-not-allowed'}
                        />
                        <p className="text-xs text-gray-500 mt-0.5">
                          {form.contactPersonEmail
                            ? 'Using the Contact Person Email above as the TenantAdmin login.'
                            : 'No contact person email set â€” will fall back to company email. Enter one above.'}
                        </p>
                      </div>
                      <div>
                        <label className={labelCls}>Temporary Password</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={genPasswordVisible ? 'text' : 'password'}
                              value={genPassword}
                              readOnly
                              placeholder="Click Generate â†’"
                              className={inputCls + ' pr-10'}
                            />
                            {genPassword && (
                              <button type="button" onClick={() => setGenPasswordVisible(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {genPasswordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            )}
                          </div>
                          <button type="button" onClick={generatePassword}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm border border-slate-600 whitespace-nowrap">
                            Generate
                          </button>
                          {genPassword && (
                            <button type="button" onClick={() => { navigator.clipboard.writeText(genPassword); }}
                              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm border border-slate-600">
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {!editTenant
                            ? 'The system will auto-generate a password. You can preview it here for reference before saving.'
                            : 'Note: changing the password must be done via the user management section.'}
                        </p>
                      </div>
                      {!editTenant && (
                        <Toggle
                          label="Send welcome email with login details to contact person"
                          checked={form.sendWelcomeEmail ?? false}
                          onChange={v => setF('sendWelcomeEmail', v)}
                        />
                      )}
                    </div>

                  </div>
                )}

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                    PAYMENT TAB
                â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {activeTab === 'payment' && (
                  <div className="space-y-4">
                    <SectionTitle>Accepted Payment Methods</SectionTitle>

                    {/* Cash */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-1">
                      <Toggle label="Accept Cash (on-site payment at facility)" checked={payment.acceptCash} onChange={v => setP('acceptCash', v)} />
                      {payment.acceptCash && (
                        <p className="text-xs text-gray-500 ml-14">Customer pays in person to the organizer at the facility.</p>
                      )}
                    </div>

                    {/* Online payments */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
                      <Toggle label="Accept Online Payments" checked={payment.acceptOnline} onChange={v => {
                        setP('acceptOnline', v);
                        if (!v) {
                          setP('ccAvenueEnabled', false);
                          setP('magnatiEnabled', false);
                        }
                      }} />

                      {payment.acceptOnline && (
                        <div className="space-y-4 mt-1 ml-6 pl-4 border-l-2 border-slate-700">
                          <p className="text-xs text-gray-400">Select one or more online payment gateways:</p>

                          {/* CC Avenue sub-section */}
                          <div className="space-y-3">
                            <Toggle label="CC Avenue" checked={payment.ccAvenueEnabled} onChange={v => setP('ccAvenueEnabled', v)} sub />
                            {payment.ccAvenueEnabled && (
                              <div className="space-y-2 ml-6">
                                <SecretField label="Merchant ID" value={payment.ccAvenueMerchantId ?? ''} onChange={v => setP('ccAvenueMerchantId', v)} />
                                <SecretField label="Access Code" value={payment.ccAvenueAccessCode ?? ''} onChange={v => setP('ccAvenueAccessCode', v)} />
                                <SecretField label="Working Key" value={payment.ccAvenueWorkingKey ?? ''} onChange={v => setP('ccAvenueWorkingKey', v)} />
                              </div>
                            )}
                          </div>

                          {/* Magnati sub-section */}
                          <div className="space-y-3">
                            <Toggle label="Magnati" checked={payment.magnatiEnabled} onChange={v => setP('magnatiEnabled', v)} sub />
                            {payment.magnatiEnabled && (
                              <div className="space-y-2 ml-6">
                                <SecretField label="API Key" value={payment.magnatiApiKey ?? ''} onChange={v => setP('magnatiApiKey', v)} />
                                <SecretField label="Merchant ID" value={payment.magnatiMerchantId ?? ''} onChange={v => setP('magnatiMerchantId', v)} />
                                <SecretField label="Secret Key" value={payment.magnatiSecretKey ?? ''} onChange={v => setP('magnatiSecretKey', v)} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                    LOCATIONS TAB
                â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {activeTab === 'locations' && (
                  <div className="space-y-4">
                    <SectionTitle>Tenant & NexBook Location</SectionTitle>

                    <SelectField
                      label="Default Country"
                      value={form.defaultCountryId ?? ''}
                      onChange={v => setF('defaultCountryId', v ? Number(v) : undefined)}
                      hint="This country will be pre-selected in booking dropdowns for end-customers."
                    >
                      <option value="">â€” Select default country â€”</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </SelectField>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-sm space-y-1">
                      <p className="font-semibold text-white">Countries & Cities</p>
                      <p className="text-gray-400 text-xs">
                        Countries and cities are shared reference data managed exclusively by SuperAdmin.
                        Tenants can view and use them for bookings but cannot modify them.
                      </p>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-sm space-y-3">
                      <p className="font-semibold text-white">UAE Areas â€” Auto-seeded</p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        When this tenant is created, all standard UAE areas are automatically copied into their
                        private workspace. They can add, rename or remove areas without affecting other tenants.
                      </p>
                      <ul className="text-gray-500 text-xs space-y-0.5 list-disc list-inside">
                        <li>25 Dubai areas (JVC, Business Bay, Marina, DIFC, Palm Jumeirahâ€¦)</li>
                        <li>8 Abu Dhabi areas (Yas Island, Saadiyat, Corniche, Al Reemâ€¦)</li>
                        <li>5 Sharjah areas (Al Majaz, Al Qasimia, Muwailehâ€¦)</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                    DOCUMENTS TAB
                â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {activeTab === 'documents' && !editTenant && (
                  <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
                    <FileText className="w-12 h-12 text-gray-500" />
                    <p className="text-gray-400 max-w-sm">
                      Documents can be uploaded after the tenant is created.
                      <br />
                      Click <strong className="text-white">Create Tenant</strong> below, then re-open to upload files.
                    </p>
                  </div>
                )}
                {activeTab === 'documents' && editTenant && (
                  <div className="space-y-4">
                    <SectionTitle>Tenant Documents</SectionTitle>

                    {docTypes.length === 0 ? (
                      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-gray-400 text-sm">
                        <FileText size={28} className="mx-auto mb-2 opacity-30" />
                        No document types configured yet. Add them via the Document Types settings page.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {docTypes.map(dt => {
                          const docs = tenantDocs.filter(d => d.documentTypeId === dt.id);
                          return (
                            <div key={dt.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white text-sm font-medium">{dt.name}
                                    {dt.isRequired && <span className="ml-2 text-xs text-red-400">Required</span>}
                                  </p>
                                  {dt.description && <p className="text-gray-400 text-xs">{dt.description}</p>}
                                </div>
                                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs cursor-pointer border border-slate-600 transition-colors">
                                  {docUploading[dt.id]
                                    ? <RefreshCw size={12} className="animate-spin" />
                                    : <Upload size={12} />}
                                  Upload
                                  <input type="file" className="hidden"
                                    accept={ALLOWED_DOC_ACCEPT}
                                    disabled={docUploading[dt.id]}
                                    onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (f) handleDocUpload(dt.id, f);
                                      e.target.value = '';   // reset so same file can be re-selected
                                    }} />
                                </label>
                              </div>

                              {docs.length > 0 && (
                                <div className="space-y-1.5">
                                  {docs.map(d => (
                                    <div key={d.id} className="flex items-center gap-2 bg-slate-750 rounded-lg px-3 py-2 border border-slate-700 text-xs">
                                      <FileText size={13} className="text-violet-400 shrink-0" />
                                      <span className="text-gray-200 flex-1 truncate">{d.originalFileName}</span>
                                      <span className="text-gray-500">{fmtBytes(d.fileSizeBytes)}</span>
                                      <a href={d.downloadUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-violet-400 hover:text-violet-300 underline">View</a>
                                      <button type="button" onClick={() => handleDocDelete(d.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {docs.length === 0 && !docUploading[dt.id] && (
                                <p className="text-gray-500 text-xs">
                                  No file uploaded yet. &nbsp;
                                  <span className="text-gray-600">Accepted: PNG, JPG, PDF Â· max 10 MB</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* â”€â”€ Drawer footer â”€â”€ */}
            {/* All buttons are type="button"; Save/Create calls handleSubmit directly.
                buttons can never accidentally trigger form submission.
                No HTML form element = no accidental browser form-submission. â”€â”€ */}
            <div className="shrink-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex items-center gap-3">
              {activeTab !== 'company' && (
                <button type="button"
                  onClick={() => {
                    const idx = TABS.findIndex(t => t.id === activeTab);
                    if (idx > 0) setActiveTab(TABS[idx - 1].id);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
                  â† Back
                </button>
              )}

              {activeTab !== 'documents' ? (
                <button type="button"
                  onClick={() => {
                    const idx = TABS.findIndex(t => t.id === activeTab);
                    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium">
                  Next â†’
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Savingâ€¦' : editTenant ? 'Save Changes' : 'Create Tenant'}
                </button>
              )}

              <button type="button" onClick={closeDrawer} className="ml-auto px-4 py-2 text-gray-400 hover:text-white text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

