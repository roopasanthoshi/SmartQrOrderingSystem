import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Settings, Coffee, ShieldCheck, Printer, Clock, Save, Image, CheckCircle2 } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const { cafeSettings, refetchSettings, admin } = useAuth();

  // Branding & System state
  const [name, setName] = useState('Kanchi Cafe');
  const [address, setAddress] = useState('Alkapuri Chourasta, Nagole');
  const [phone, setPhone] = useState('9000407970');
  const [gst, setGst] = useState('36AFNFS9271D1ZJ');
  const [upiId, setUpiId] = useState('8978882601@ybl');
  const [logoUrl, setLogoUrl] = useState('');
  const [notifDelay, setNotifDelay] = useState(30);
  const [reminderInterval, setReminderInterval] = useState(15);
  const [autoTimeout, setAutoTimeout] = useState(60);
  const [enableGst, setEnableGst] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5.0);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Printer settings
  const [p1Name, setP1Name] = useState('Kitchen Printer (Food)');
  const [p1Cats, setP1Cats] = useState('Breakfast,Snacks,South Indian,Desserts,Main Course');
  const [p2Name, setP2Name] = useState('Beverage Printer (Coffee & Juices)');
  const [p2Cats, setP2Cats] = useState('Coffee & Beverages,Juices,Shakes');

  // Credentials state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [credsMsg, setCredsMsg] = useState('');

  useEffect(() => {
    if (cafeSettings) {
      setName(cafeSettings.name || 'Kanchi Cafe');
      setAddress(cafeSettings.address || 'Alkapuri Chourasta, Nagole');
      setPhone(cafeSettings.phone || '9000407970');
      setGst(cafeSettings.gst || '36AFNFS9271D1ZJ');
      setUpiId(cafeSettings.upiId || '8978882601@ybl');
      setLogoUrl(cafeSettings.logoUrl || '');
      setNotifDelay(cafeSettings.customerNotifDelayMin || 30);
      setReminderInterval(cafeSettings.reminderIntervalMin || 15);
      setAutoTimeout(cafeSettings.autoCompleteTimeoutMin || 60);
      setEnableGst(cafeSettings.enableGst || false);
      setGstPercentage(cafeSettings.gstPercentage !== undefined ? cafeSettings.gstPercentage : 5.0);
    }
    if (admin) {
      setNewEmail(admin.email);
    }
  }, [cafeSettings, admin]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max size is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingLogo(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success && res.data.imageUrl) {
        setLogoUrl(res.data.imageUrl);
      } else {
        alert(res.data.message || 'Failed to upload logo');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg('');

    try {
      const res = await api.put('/settings', {
        name,
        address,
        phone,
        gst,
        upiId,
        logoUrl,
        customerNotifDelayMin: notifDelay,
        reminderIntervalMin: reminderInterval,
        autoCompleteTimeoutMin: autoTimeout,
        enableGst,
        gstPercentage: Number(gstPercentage),
        printer1Name: p1Name,
        printer1Categories: p1Cats,
        printer2Name: p2Name,
        printer2Categories: p2Cats,
      });

      if (res.data.success) {
        setSuccessMsg('Branding & System settings saved! Logo updated everywhere.');
        await refetchSettings();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCreds(true);
    setCredsMsg('');

    try {
      const res = await api.put('/auth/credentials', {
        email: newEmail,
        currentPassword,
        newPassword: newPassword || undefined,
      });

      if (res.data.success) {
        setCredsMsg('Admin email and password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setCredsMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update credentials');
    } finally {
      setSavingCreds(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gold-500" /> Cafe & System Settings
        </h1>
        <p className="text-xs text-cafe-600 dark:text-cream-200/70">
          Configure branding, logo URLs, UPI details, admin credentials, notification delays, and dual printer routing
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-500/20 border border-green-500/40 text-green-200 text-xs p-3 rounded-2xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Form 1: Cafe Branding & UPI Details */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-gold-500 flex items-center gap-2 pb-2 border-b border-cafe-100 dark:border-gold-500/10">
          <Coffee className="w-5 h-5" /> Cafe Branding & UPI Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-gold-300 font-semibold mb-1">Cafe Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">UPI ID for Payments *</label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">GST Number *</label>
            <input
              type="text"
              required
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
            />
          </div>

          <div className="flex items-center gap-6 md:col-span-2 py-2">
            <label className="flex items-center gap-2 text-gold-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={enableGst}
                onChange={(e) => setEnableGst(e.target.checked)}
                className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500 bg-cream-50 dark:bg-cafe-950 border-cafe-300 dark:border-gold-500/30"
              />
              Enable GST Billing
            </label>

            {enableGst && (
              <div className="flex items-center gap-2">
                <label className="text-gold-300 font-semibold">GST Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(Number(e.target.value))}
                  className="w-20 bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-1.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-gold-300 font-semibold mb-1">Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gold-300 font-semibold mb-1 flex items-center gap-1">
              <Image className="w-3.5 h-3.5" /> Logo Image URL (Updates Login, Sidebar, Customer UI, Bills & Receipts)
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
            <div className="mt-2">
              <label className="block text-gold-300 font-semibold mb-1">Or Upload Logo Image</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-1.5 text-cafe-900 dark:text-cream-100 outline-none text-xs cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gold-500 file:text-cafe-950 hover:file:bg-gold-600 disabled:opacity-50"
              />
              {uploadingLogo && (
                <span className="text-[10px] text-gold-400 mt-1 block">Uploading logo...</span>
              )}
              {logoUrl && !uploadingLogo && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-cream-200/60">Preview:</span>
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1 border border-gold-500/30"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: System Timers */}
        <h3 className="font-serif font-bold text-base text-gold-500 flex items-center gap-2 pt-4 pb-2 border-b border-cafe-100 dark:border-gold-500/10">
          <Clock className="w-5 h-5" /> Customer Notification & System Delays
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gold-300 font-semibold mb-1">
              Customer Notif Delay (Mins)
            </label>
            <input
              type="number"
              value={notifDelay}
              onChange={(e) => setNotifDelay(Number(e.target.value))}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">
              Reminder Interval (Mins)
            </label>
            <input
              type="number"
              value={reminderInterval}
              onChange={(e) => setReminderInterval(Number(e.target.value))}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">
              Auto Complete Timeout (Mins)
            </label>
            <input
              type="number"
              value={autoTimeout}
              onChange={(e) => setAutoTimeout(Number(e.target.value))}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 font-mono outline-none"
            />
          </div>
        </div>

        {/* Section 3: Dual Printer Settings */}
        <h3 className="font-serif font-bold text-base text-gold-500 flex items-center gap-2 pt-4 pb-2 border-b border-cafe-100 dark:border-gold-500/10">
          <Printer className="w-5 h-5" /> Dual Printer Routing Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-gold-300 font-semibold mb-1">Printer 1 (Kitchen Food)</label>
            <input
              type="text"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-gold-300 font-semibold mb-1">Printer 2 (Beverage Bar)</label>
            <input
              type="text"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 shadow transition"
        >
          <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save Branding & System Settings'}
        </button>
      </form>

      {/* Form 2: Admin Account Credentials */}
      <form onSubmit={handleSaveCredentials} className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-gold-500 flex items-center gap-2 pb-2 border-b border-cafe-100 dark:border-gold-500/10">
          <ShieldCheck className="w-5 h-5" /> Change Admin Email & Password
        </h3>

        {credsMsg && (
          <div className="bg-green-500/20 border border-green-500/40 text-green-200 text-xs p-3 rounded-2xl flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> {credsMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gold-300 font-semibold mb-1">Admin Email *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">Current Password *</label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">New Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave empty to keep current"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingCreds}
          className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 shadow transition"
        >
          <ShieldCheck className="w-4 h-4" /> {savingCreds ? 'Updating...' : 'Update Admin Credentials'}
        </button>
      </form>
    </div>
  );
};
