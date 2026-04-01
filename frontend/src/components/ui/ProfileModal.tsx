import { useState, useEffect, type FormEvent } from 'react';
import {
  User2, Lock, Mail, Phone, MapPin, CheckCircle2, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { updateStoredUser } from '../../services/authService';
import { locationService } from '../../services/locationService';
import type { Country, City, Area, Community } from '../../types';
import Modal from './Modal';
import Button from './Button';

interface Props {
  open:        boolean;
  onClose:     () => void;
  initialTab?: 'profile' | 'password';
}

type Tab = 'profile' | 'password';

const UAE_NAME = 'United Arab Emirates';
const UAE_CODE = 'AE';
const EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];

function Field({
  label, value, onChange, placeholder, type = 'text', readOnly = false,
  hint, icon, required = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
  hint?: string; icon?: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2.5 rounded-xl border text-sm transition-all
            ${readOnly
              ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]'
            }`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function ProfileModal({ open, onClose, initialTab = 'profile' }: Props) {
  const { user, refreshUser } = useAuth();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [mobile,      setMobile]      = useState('');
  const [phone,       setPhone]       = useState('');
  const [apt,         setApt]         = useState('');
  const [street,      setStreet]      = useState('');
  const [city,        setCity]        = useState('');
  const [state,       setState]       = useState('');
  const [country,     setCountry]     = useState('');
  const [emirate,     setEmirate]     = useState('');
  const [postalCode,  setPostalCode]  = useState('');
  const [areaId,      setAreaId]      = useState<number>(0);
  const [communityId, setCommunityId] = useState<number>(0);
  const [profileMsg,  setProfileMsg]  = useState('');
  const [profileErr,  setProfileErr]  = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Location dropdown state
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const isUae = (() => {
    const c = countries.find((x) => x.id === selectedCountryId);
    if (c?.code?.toUpperCase() === UAE_CODE) return true;
    return country.trim().toLowerCase() === UAE_NAME.toLowerCase() || country.trim().toUpperCase() === 'UAE';
  })();

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [pwMsg,     setPwMsg]     = useState('');
  const [pwErr,     setPwErr]     = useState('');
  const [savingPw,  setSavingPw]  = useState(false);

  // Load countries when modal opens
  useEffect(() => {
    if (!open) return;
    locationService.getCountries()
      .then((cs) => setCountries(cs))
      .catch(() => setCountries([]));
  }, [open]);

  // Load cities when country changes
  useEffect(() => {
    if (!open) return;
    if (!selectedCountryId) { setCities([]); setSelectedCityId(null); return; }
    locationService.getCities(selectedCountryId)
      .then((list) => setCities(list))
      .catch(() => setCities([]));
  }, [open, selectedCountryId]);

  // Load areas when city changes
  useEffect(() => {
    if (!open) return;
    if (!selectedCityId) { setAreas([]); return; }
    locationService.getAreas(selectedCityId)
      .then((list) => setAreas(list))
      .catch(() => setAreas([]));
  }, [open, selectedCityId]);

  // Load communities when area changes
  useEffect(() => {
    if (!open) return;
    if (!areaId) { setCommunities([]); return; }
    locationService.getCommunities(areaId)
      .then((list) => setCommunities(list))
      .catch(() => setCommunities([]));
  }, [open, areaId]);

  // Load profile from API when modal opens
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    userService.getProfile(user.id)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          // Populate first/last from profile; fallback to splitting fullName
          const fn = d.firstName ?? (user.fullName?.split(' ')[0] ?? '');
          const ln = d.lastName  ?? (user.fullName?.split(' ').slice(1).join(' ') ?? '');
          setFirstName(fn);
          setLastName(ln);
          setMobile(d.phoneNumber ?? '');
          setPhone(d.landlinePhone ?? '');
          setApt(d.apartmentOrVillaNumber ?? '');
          setStreet(d.streetAddress ?? '');
          setCity(d.city ?? '');
          setState(d.state ?? '');
          setCountry(d.countryName ?? '');
          setEmirate(d.emirate ?? '');
          setPostalCode(d.postalCode ?? '');
          setAreaId(d.areaId ?? 0);
          setCommunityId(d.communityId ?? 0);

          const matchCountry = countries.find((c) => c.name.toLowerCase() === (d.countryName ?? '').toLowerCase());
          setSelectedCountryId(matchCountry?.id ?? null);
          // we'll set city id once cities load
          setSelectedCityId(null);
        }
      })
      .catch(() => { /* use stored user values */ })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When cities load, auto-select the one matching the stored city text
  useEffect(() => {
    if (!open) return;
    if (!cities.length) return;
    if (selectedCityId) return;
    if (!city.trim()) return;
    const match = cities.find((c) => c.name.toLowerCase() === city.trim().toLowerCase());
    if (match) setSelectedCityId(match.id);
  }, [open, cities, selectedCityId, city]);

  // Sync tab when initialTab prop changes
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  function handleTabChange(t: Tab) {
    setTab(t);
    setProfileMsg(''); setProfileErr('');
    setPwMsg('');      setPwErr('');
  }

  function extractApiError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const body = (err as { response?: { data?: { message?: string; errors?: string[] } } }).response?.data;
      if (body?.message) return body.message;
      if (body?.errors?.length) return body.errors.join(', ');
    }
    return fallback;
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const missing: string[] = [];
    if (!firstName.trim()) missing.push('First name');
    if (!lastName.trim()) missing.push('Last name');
    if (!mobile.trim()) missing.push('Mobile number');
    // phone is optional
    if (!street.trim()) missing.push('Street address');
    if (!city.trim()) missing.push('City');
    if (!state.trim()) missing.push('State');
    if (!country.trim()) missing.push('Country');
    if (!areaId) missing.push('Area');
    if (!communityId) missing.push('Community');
    if (isUae && !emirate.trim()) missing.push('Emirate');

    if (missing.length) {
      setProfileErr(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`);
      return;
    }
    setProfileErr(''); setProfileMsg('');
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile({
        userId:      user.id,
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        phoneNumber: mobile.trim(),
        landlinePhone: phone.trim() || undefined,
        apartmentOrVillaNumber: apt.trim() || undefined,
        streetAddress: street.trim(),
        city:        city.trim(),
        state:       state.trim(),
        countryName: country.trim(),
        emirate: emirate.trim() || undefined,
        postalCode:  postalCode.trim()|| undefined,
        areaId,
        communityId,
      });

      if (res.success && res.data) {
        updateStoredUser({
          fullName:    res.data.fullName,
          firstName:   res.data.firstName,
          lastName:    res.data.lastName,
          phoneNumber: res.data.phoneNumber,
          landlinePhone: res.data.landlinePhone,
          apartmentOrVillaNumber: res.data.apartmentOrVillaNumber,
          streetAddress: res.data.streetAddress,
          city:        res.data.city,
          state:       res.data.state,
          countryName: res.data.countryName,
          emirate:     res.data.emirate,
          postalCode:  res.data.postalCode,
          areaId:      res.data.areaId,
          areaName:    res.data.areaName,
          communityId: res.data.communityId,
          communityName: res.data.communityName,
        });
        refreshUser();
        setProfileMsg('Profile updated successfully.');
      } else {
        setProfileErr(res.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setProfileErr(extractApiError(err, 'Failed to update profile. Please try again.'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!currentPw) { setPwErr('Current password is required.'); return; }
    if (newPw.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwErr('Passwords do not match.'); return; }
    setPwErr(''); setPwMsg('');
    setSavingPw(true);
    try {
      const res = await userService.changePassword(user.id, currentPw, newPw);
      if (res.success) {
        setPwMsg('Password changed successfully.');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        setPwErr(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwErr(extractApiError(err, 'Failed to change password. Check your current password and try again.'));
    } finally {
      setSavingPw(false);
    }
  }

  function handleClose() {
    setProfileMsg(''); setProfileErr('');
    setPwMsg('');      setPwErr('');
    onClose();
  }

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : newPw.length < 14 ? 3 : 4;
  const strengthColors = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'Too short', 'Fair', 'Good', 'Strong'];

  const profileFooter = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" size="sm" onClick={handleClose} type="button">Cancel</Button>
      <Button size="sm" loading={savingProfile} form="profile-form" type="submit" disabled={loading}>
        Save Changes
      </Button>
    </div>
  );

  const passwordFooter = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" size="sm" onClick={handleClose} type="button">Cancel</Button>
      <Button size="sm" loading={savingPw} form="password-form" type="submit">
        Change Password
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Account Settings"
      size="lg"
      footer={tab === 'profile' ? profileFooter : passwordFooter}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-xl">
        {(['profile', 'password'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'profile' ? <User2 size={14} /> : <Lock size={14} />}
            {t === 'profile' ? 'Profile' : 'Password'}
          </button>
        ))}
      </div>

      {/* ── Profile tab ───────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <form id="profile-form" onSubmit={handleProfileSave} className="space-y-5">
          {profileMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={15} /> {profileMsg}
            </div>
          )}
          {profileErr && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {profileErr}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading profile…
            </div>
          ) : (
            <>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="First name" value={firstName}
                  onChange={setFirstName} placeholder="John"
                  icon={<User2 size={14} />} required
                />
                <Field
                  label="Last name" value={lastName}
                  onChange={setLastName} placeholder="Smith"
                />
              </div>

              {/* Email — read-only */}
              <Field
                label="Email address" value={user?.email ?? ''}
                readOnly icon={<Mail size={14} />}
                hint="Email cannot be changed here."
              />

              {/* Phone */}
              <Field
                label="Mobile number" value={mobile}
                onChange={setMobile} placeholder="+971 50 000 0000"
                icon={<Phone size={14} />}
                required
              />
              <Field
                label="Phone" value={phone}
                onChange={setPhone} placeholder="04 000 0000"
                icon={<Phone size={14} />}
              />

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Address Information
                </p>

                <div className="space-y-3">
                  <Field
                    label="Apartment / Villa no." value={apt}
                    onChange={setApt} placeholder="Apt 1203"
                  />
                  <Field
                    label="Street address" value={street}
                    onChange={setStreet} placeholder="Street address"
                    icon={<MapPin size={14} />}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Country<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={selectedCountryId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value ? Number(e.target.value) : null;
                          setSelectedCountryId(id);
                          const c = countries.find((x) => x.id === id);
                          setCountry(c?.name ?? '');
                          setSelectedCityId(null);
                          setCity('');
                          setAreaId(0);
                          setCommunityId(0);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]"
                      >
                        <option value="">Select country</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        City<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={selectedCityId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value ? Number(e.target.value) : null;
                          setSelectedCityId(id);
                          const c = cities.find((x) => x.id === id);
                          setCity(c?.name ?? '');
                          setAreaId(0);
                          setCommunityId(0);
                        }}
                        disabled={!selectedCountryId}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">{selectedCountryId ? 'Select city' : 'Select country first'}</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="State" value={state}
                      onChange={setState} placeholder="Dubai"
                      required
                    />
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Emirate{isUae ? <span className="text-red-500 ml-0.5">*</span> : null}
                      </label>
                      <select
                        value={emirate}
                        onChange={(e) => setEmirate(e.target.value)}
                        disabled={!isUae}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">{isUae ? 'Select emirate' : 'Only for UAE'}</option>
                        {EMIRATES.map((x) => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Area<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={areaId || ''}
                        onChange={(e) => {
                          setAreaId(Number(e.target.value));
                          setCommunityId(0);
                        }}
                        disabled={!selectedCityId}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">{selectedCityId ? 'Select area' : 'Select city first'}</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Community<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={communityId || ''}
                        onChange={(e) => setCommunityId(Number(e.target.value))}
                        disabled={!areaId}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">{areaId ? 'Select community' : 'Select area first'}</option>
                        {communities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field
                    label="PO Box / Postal code" value={postalCode}
                    onChange={setPostalCode} placeholder="00000"
                  />
                </div>
              </div>
            </>
          )}

        </form>
      )}

      {/* ── Password tab ──────────────────────────────────────────────────────── */}
      {tab === 'password' && (
        <form id="password-form" onSubmit={handlePasswordSave} className="space-y-4">
          {pwMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={15} /> {pwMsg}
            </div>
          )}
          {pwErr && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {pwErr}
            </div>
          )}

          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Current password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Lock size={14} />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              New password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Lock size={14} />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]"
              />
            </div>
            {newPw.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= pwStrength ? strengthColors[pwStrength] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {pwStrength > 0 && (
                  <p className={`text-xs ${
                    pwStrength === 1 ? 'text-red-500' :
                    pwStrength === 2 ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {strengthLabels[pwStrength]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Confirm new password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Lock size={14} />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] ${
                  confirmPw && newPw !== confirmPw ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {confirmPw && newPw !== confirmPw && (
              <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

        </form>
      )}
    </Modal>
  );
}
