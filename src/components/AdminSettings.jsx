import React, { useState } from 'react';
import { 
  Building2, 
  Landmark, 
  Percent, 
  Users, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  Plus, 
  ShieldCheck 
} from 'lucide-react';
import { 
  getSystemSettings, 
  saveSystemSettings, 
  getMasterParties, 
  saveMasterParty 
} from '../utils/storage';

export default function AdminSettings() {
  const [settings, setSettings] = useState(getSystemSettings());
  const [parties, setParties] = useState(getMasterParties());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Party Form
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState('Broker');
  const [newPartyCity, setNewPartyCity] = useState('Saoner');

  // Change PIN state
  const [newPin, setNewPin] = useState('1234');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveSystemSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddParty = (e) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;

    const newParty = {
      id: `p-${Date.now()}`,
      name: newPartyName.trim(),
      type: newPartyType,
      city: newPartyCity
    };

    const updated = saveMasterParty(newParty);
    setParties(updated);
    setNewPartyName('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-amber-300">Admin Control Center</h2>
            <p className="text-xs text-slate-400">Proprietor Master Settings, Bank Configuration & Mandi Rates</p>
          </div>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Settings Updated!
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Section 1: Enterprise Profile */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
            <Building2 className="w-4 h-4 text-amber-600" />
            <h3>Enterprise Master Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Firm Name:</label>
              <input
                type="text"
                value={settings.enterpriseName}
                onChange={(e) => setSettings({ ...settings, enterpriseName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline / Commodity Description:</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-semibold text-slate-800 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">APMC Address:</label>
              <input
                type="text"
                value={settings.apmcAddress}
                onChange={(e) => setSettings({ ...settings, apmcAddress: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-semibold text-slate-800 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Proprietor Name:</label>
                <input
                  type="text"
                  value={settings.proprietor}
                  onChange={(e) => setSettings({ ...settings, proprietor: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Mobile:</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PAN Card Number:</label>
              <input
                type="text"
                value={settings.panNo}
                onChange={(e) => setSettings({ ...settings, panNo: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Maharashtra State Code:</label>
              <input
                type="text"
                value={settings.stateCode}
                onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Axis Bank Account Details (Printed on Invoices) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
            <Landmark className="w-4 h-4 text-emerald-600" />
            <h3>Bank Details for RTGS / NEFT (Printed on Official Bills)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bank Name:</label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch Name:</label>
              <input
                type="text"
                value={settings.branch}
                onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Number:</label>
              <input
                type="text"
                value={settings.accountNo}
                onChange={(e) => setSettings({ ...settings, accountNo: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-mono font-bold text-amber-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">IFSC Code:</label>
              <input
                type="text"
                value={settings.ifscCode}
                onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 uppercase text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Default Mandi Charges & Costing Rates */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
            <Percent className="w-4 h-4 text-amber-600" />
            <h3>Default APMC Mandi Rates & Expense Percentages</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Brokerage Default (%):</label>
              <input
                type="number"
                step="0.1"
                value={settings.defaultBrokeragePct}
                onChange={(e) => setSettings({ ...settings, defaultBrokeragePct: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mandi Shesh / Cess (%):</label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultMandiSheshPct}
                onChange={(e) => setSettings({ ...settings, defaultMandiSheshPct: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Commission Default (%):</label>
              <input
                type="number"
                step="0.1"
                value={settings.defaultCommissionPct}
                onChange={(e) => setSettings({ ...settings, defaultCommissionPct: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Worker Charges (₹/bag):</label>
              <input
                type="number"
                value={settings.defaultWorkerRate}
                onChange={(e) => setSettings({ ...settings, defaultWorkerRate: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Transport Rate (₹/unit):</label>
              <input
                type="number"
                value={settings.defaultTransportRate}
                onChange={(e) => setSettings({ ...settings, defaultTransportRate: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bardana Tare (kg/bag):</label>
              <input
                type="number"
                step="0.05"
                value={settings.defaultBardanaTareKg}
                onChange={(e) => setSettings({ ...settings, defaultBardanaTareKg: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg transition transform active:scale-95 text-sm"
          >
            <Save className="w-5 h-5" />
            Save All Changes
          </button>
        </div>

      </form>

      {/* Section 4: Master Parties List (Brokers & Mills) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3>Master Parties (Brokers & Dal Mills)</h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{parties.length} Total Registered</span>
        </div>

        {/* Add Party Form */}
        <form onSubmit={handleAddParty} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <input
            type="text"
            placeholder="Party Name (e.g. Ramlal / New Mill)"
            value={newPartyName}
            onChange={(e) => setNewPartyName(e.target.value)}
            className="sm:col-span-2 border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
            required
          />
          <select
            value={newPartyType}
            onChange={(e) => setNewPartyType(e.target.value)}
            className="border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
          >
            <option value="Broker">Sub-Broker / Farmer</option>
            <option value="Mill">Dal Mill / Buyer</option>
            <option value="Transporter">Transporter</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Party
          </button>
        </form>

        {/* Parties List Table */}
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl text-xs">
          {parties.map(p => (
            <div key={p.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50">
              <div>
                <span className="font-bold text-slate-900">{p.name}</span>
                <span className="text-slate-400 text-[11px] ml-2">({p.city})</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                p.type === 'Mill' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {p.type}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
