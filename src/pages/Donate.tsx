import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Gift, DollarSign, Award, Download, Share2, Shield, User, 
  Globe, Coins, Flame, MapPin, Check, Plus, AlertCircle, Sparkles, 
  Printer, ArrowRight, CreditCard, Landmark, CheckCircle2, RefreshCw, FileText, Smartphone
} from 'lucide-react';
import SEO from '../components/SEO';

// Initial dummy contributors list to make the platform feel alive with real community
const INITIAL_CONTRIBUTORS = [
  { name: "Aisha Nabakooza", totem: "Tilapia (Ngege)", tier: "Clan Guardian", amount: 400000, date: "2 hours ago", public: true },
  { name: "John Bosco Wandera", totem: "Lungfish (Mamba)", tier: "Kyoga Fisher", amount: 150000, date: "1 day ago", public: true },
  { name: "Florence Namubiru", totem: "Otter (Ngonge)", tier: "Council Elder Patron", amount: 1200000, date: "3 days ago", public: true },
  { name: "Moses Kirya", totem: "Mudfish (Mmale)", tier: "Lukenye Scribe", amount: 50000, date: "5 days ago", public: true },
];

const DONATION_TIERS = [
  {
    id: "scribe",
    title: "Lukenye Scribe",
    priceUGX: 50000,
    priceUSD: 15,
    desc: "Directly funds the recording and high-fidelity archival of 2 endangered Lukenye conversational phrases with community elders.",
    benefits: [
      "Digital Certificate of Cultural Scribing",
      "Name recorded in the Sanctuary Archive ledger",
      "Priority access to the digital Lukenye Dictionary"
    ],
    color: "border-emerald-600/20 hover:border-emerald-500 bg-emerald-500/5",
    icon: FileText,
    iconColor: "text-emerald-600"
  },
  {
    id: "fisher",
    title: "Kyoga Fisher",
    priceUGX: 150000,
    priceUSD: 45,
    desc: "Sponsors a field research excursion to interview, capture, and catalog the oral histories of fisher clans along Lake Kyoga.",
    benefits: [
      "Digital Certificate of Cultural Guardianship",
      "Sanctuary Archive name record",
      "Pre-release access to new Oral Chronicles",
      "Bakenyi digital desktop wallpaper pack"
    ],
    color: "border-blue-600/20 hover:border-blue-500 bg-blue-500/5",
    icon: Globe,
    iconColor: "text-blue-600"
  },
  {
    id: "guardian",
    title: "Clan Guardian",
    priceUGX: 400000,
    priceUSD: 120,
    desc: "Funds the full digital reconstruction and verification of a comprehensive Clan Lineage Tree, including migration timelines.",
    benefits: [
      "Official Digital Seal of Clan Guardianship",
      "Featured 'Guardian Profile' in the public Keepsake Roll",
      "Downloadable high-resolution Clan lineage diagram",
      "Sponsorship credits on the specific Clan's profile page"
    ],
    color: "border-amber-600/20 hover:border-amber-500 bg-amber-500/5",
    icon: Shield,
    iconColor: "text-amber-600"
  },
  {
    id: "elder",
    title: "Council Elder Patron",
    priceUGX: 1200000,
    priceUSD: 350,
    desc: "Provides a full monthly stipend to an elder oral storyteller to sustain their teachings and support youth storytelling workshops.",
    benefits: [
      "Distinguished Elder Patron Certificate & Seal",
      "Top-tier listing in the Keepsake ledger with a custom star badge",
      "Special mention in the Elder Council's bi-annual dispatches",
      "Invitation to the annual Bakenyi Cultural Gathering web-broadcast"
    ],
    color: "border-heritage-terracotta/20 hover:border-heritage-terracotta bg-heritage-terracotta/5",
    icon: Award,
    iconColor: "text-heritage-terracotta"
  }
];

const CLAN_TOTEMS = [
  "Tilapia (Ngege)",
  "Lungfish (Mamba)",
  "Mudfish (Mmale)",
  "Otter (Ngonge)",
  "Crested Crane (Ngaali)",
  "Elephant (Njovu)",
  "Leopard (Ngo)",
  "No Totem / Other"
];

const ALLOCATION_CATEGORIES = [
  { id: "language", label: "Language Archiving", percentage: 40, color: "#10b981", desc: "Recording Lukenye audio pronunciations, vocabulary translation, and publishing interactive learning aids." },
  { id: "oral_history", label: "Oral Keeper Stipends", percentage: 30, color: "#f59e0b", desc: "Providing financial aid, healthcare contributions, and transport stipends to elderly oral chroniclers across Lake Kyoga settlements." },
  { id: "digitization", label: "Clan Lineage Digitization", percentage: 20, color: "#3b82f6", desc: "Fact-checking, drawing, and publishing interactive, accessible clan trees and verifying ancestral migration archives." },
  { id: "infra", label: "Server & Offline Hosting", percentage: 10, color: "#ef4444", desc: "Maintaining secure database sync, offline progressive web app support, and local region community kiosks." }
];

export default function Donate() {
  const [selectedTier, setSelectedTier] = useState<string>("scribe");
  const [billingCurrency, setBillingCurrency] = useState<'UGX' | 'USD'>('UGX');
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [donationFrequency, setDonationFrequency] = useState<'once' | 'monthly'>('once');
  
  // Checkout form states
  const [donorName, setDonorName] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [chosenTotem, setChosenTotem] = useState<string>("Tilapia (Ngege)");
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | 'bank'>('momo');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [momoNumber, setMomoNumber] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  
  // App state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [recentContributors, setRecentContributors] = useState<any[]>([]);
  const [activeAllocation, setActiveAllocation] = useState<string>("language");
  const [certificateData, setCertificateData] = useState<any | null>(null);

  // Load from local storage or default list
  useEffect(() => {
    const saved = localStorage.getItem('bakenyi_contributions');
    if (saved) {
      setRecentContributors(JSON.parse(saved));
    } else {
      setRecentContributors(INITIAL_CONTRIBUTORS);
    }
  }, []);

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    setIsCustomSelected(false);
    setCustomAmount("");
  };

  const handleSelectCustom = () => {
    setIsCustomSelected(true);
    setSelectedTier("");
  };

  const calculateTotal = () => {
    if (isCustomSelected) {
      return parseInt(customAmount) || 0;
    }
    const tier = DONATION_TIERS.find(t => t.id === selectedTier);
    if (!tier) return 0;
    return billingCurrency === 'UGX' ? tier.priceUGX : tier.priceUSD;
  };

  const getTierName = () => {
    if (isCustomSelected) {
      const amt = parseInt(customAmount) || 0;
      if (billingCurrency === 'USD') {
        if (amt >= 350) return "Council Elder Patron";
        if (amt >= 120) return "Clan Guardian";
        if (amt >= 45) return "Kyoga Fisher";
        return "Lukenye Scribe";
      } else {
        if (amt >= 1200000) return "Council Elder Patron";
        if (amt >= 400000) return "Clan Guardian";
        if (amt >= 150000) return "Kyoga Fisher";
        return "Lukenye Scribe";
      }
    }
    const tier = DONATION_TIERS.find(t => t.id === selectedTier);
    return tier ? tier.title : "Lukenye Scribe";
  };

  const handleSubmitDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName && !isAnonymous) {
      alert("Please provide your name or select 'List contribution anonymously'");
      return;
    }
    if (!donorEmail) {
      alert("Please enter your email to receive your digital verification.");
      return;
    }
    if (calculateTotal() <= 0) {
      alert("Please select or enter a valid donation amount.");
      return;
    }
    if (paymentMethod === 'momo' && !momoNumber) {
      alert("Please enter your Mobile Money telephone number.");
      return;
    }

    setIsSubmitting(true);

    // Simulate cultural chronicle database integration
    setTimeout(() => {
      const amountPaid = calculateTotal();
      const finalName = isAnonymous ? "Anonymous Guardian" : donorName;
      const finalTier = getTierName();
      const transactionId = "BK-" + Math.floor(100000 + Math.random() * 900000);
      const sealDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const newContribution = {
        name: finalName,
        totem: chosenTotem,
        tier: finalTier,
        amount: amountPaid,
        currency: billingCurrency,
        date: "Just now",
        public: !isAnonymous
      };

      const updatedList = [newContribution, ...recentContributors.filter(c => c.date !== "Just now")];
      setRecentContributors(updatedList);
      localStorage.setItem('bakenyi_contributions', JSON.stringify(updatedList));

      setCertificateData({
        name: finalName,
        totem: chosenTotem,
        tier: finalTier,
        amount: amountPaid,
        currency: billingCurrency,
        transactionId,
        date: sealDate,
        frequency: donationFrequency
      });

      setIsSubmitting(false);
      setShowCertificate(true);
    }, 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeAllocInfo = ALLOCATION_CATEGORIES.find(c => c.id === activeAllocation) || ALLOCATION_CATEGORIES[0];

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      <SEO 
        title="Preservation Sanctuary & Donations"
        description="Empower the Bakenye Cultural Heritage Association. Securely fund Lukenye dictionary recordings, elder storyteller support, and clan lineage digitization."
        keywords="Donate, Support, Bakenyi culture, Kyoga preservation, Lukenye recording"
      />

      {/* Cultural Hero Header */}
      <section className="relative bg-heritage-brown py-20 px-4 overflow-hidden border-b border-heritage-brown/20">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-60 bg-heritage-terracotta/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-heritage-terracotta/10 border border-heritage-terracotta/30 rounded-full text-heritage-sand text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-heritage-terracotta animate-pulse" />
            <span>COMMUNAL STEWARDSHIP KEEPSAKE</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-black text-white mb-6 tracking-tight leading-none"
          >
            Support Bakenyi Sanctuary
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-heritage-sand/90 max-w-3xl mx-auto text-sm md:text-base leading-relaxed font-medium font-sans"
          >
            The Bakenyi Cultural Heritage Sanctuary is self-sustained by descendants, allies, and researchers. 
            Your donation directly safeguards the endangered Lukenye language, digitizes ancestral lineage maps, and supports our revered oral history elder guardians.
          </motion.p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: Tiers & Impact Allocation */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Currency and Billing Frequency Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800/80 p-4 rounded-2xl shadow-xs">
              <div>
                <h4 className="text-sm font-serif font-bold text-heritage-brown dark:text-white">Archival Contribution Options</h4>
                <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">Toggle currencies or frequencies to match your capacity</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Frequency Selector */}
                <div className="flex bg-heritage-brown/5 rounded-lg p-1 border border-heritage-brown/10">
                  <button
                    onClick={() => setDonationFrequency('once')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      donationFrequency === 'once'
                        ? 'bg-heritage-terracotta text-white shadow-xs'
                        : 'text-heritage-brown/70 hover:text-heritage-brown'
                    }`}
                  >
                    One-Time
                  </button>
                  <button
                    onClick={() => setDonationFrequency('monthly')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      donationFrequency === 'monthly'
                        ? 'bg-heritage-terracotta text-white shadow-xs'
                        : 'text-heritage-brown/70 hover:text-heritage-brown'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Currency Selector */}
                <div className="flex bg-heritage-brown/5 rounded-lg p-1 border border-heritage-brown/10">
                  <button
                    onClick={() => setBillingCurrency('UGX')}
                    className={`px-2.5 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${
                      billingCurrency === 'UGX'
                        ? 'bg-heritage-brown text-white shadow-xs'
                        : 'text-heritage-brown/60 hover:text-heritage-brown'
                    }`}
                  >
                    UGX
                  </button>
                  <button
                    onClick={() => setBillingCurrency('USD')}
                    className={`px-2.5 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${
                      billingCurrency === 'USD'
                        ? 'bg-heritage-brown text-white shadow-xs'
                        : 'text-heritage-brown/60 hover:text-heritage-brown'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Donation Tiers */}
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-heritage-terracotta" />
                <h3 className="text-xl md:text-2xl font-serif font-black text-heritage-brown dark:text-white">Choose a Stewardship Tier</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DONATION_TIERS.map((tier) => {
                  const TierIcon = tier.icon;
                  const isSelected = selectedTier === tier.id && !isCustomSelected;
                  const price = billingCurrency === 'UGX' 
                    ? `UGX ${tier.priceUGX.toLocaleString()}` 
                    : `$${tier.priceUSD}`;

                  return (
                    <motion.div
                      key={tier.id}
                      whileHover={{ y: -3 }}
                      onClick={() => handleSelectTier(tier.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition-all relative overflow-hidden flex flex-col justify-between h-full bg-white dark:bg-stone-900 shadow-xs ${
                        isSelected 
                          ? 'border-heritage-terracotta ring-1 ring-heritage-terracotta/40 bg-heritage-terracotta/[0.02]' 
                          : 'border-heritage-brown/10 dark:border-stone-800 hover:border-heritage-brown/30'
                      }`}
                    >
                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-heritage-terracotta text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest">
                          Active Selection
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${tier.color} border shrink-0`}>
                            <TierIcon className={`w-5 h-5 ${tier.iconColor}`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-sans font-black uppercase tracking-wider text-heritage-brown dark:text-white">{tier.title}</h4>
                            <span className="text-lg font-mono font-extrabold text-heritage-terracotta">{price}</span>
                            <span className="text-[10px] text-heritage-brown/50 dark:text-stone-400 font-bold ml-1">
                              {donationFrequency === 'monthly' ? '/ month' : ''}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-heritage-brown/70 dark:text-stone-300 leading-relaxed font-medium">
                          {tier.desc}
                        </p>
                      </div>

                      {/* Benefits list */}
                      <div className="mt-5 pt-4 border-t border-heritage-brown/5 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 block">Archival Perks</span>
                        {tier.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10.5px] text-heritage-brown/85 dark:text-stone-300 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Custom Donation Amount Area */}
              <div className="mt-4">
                <button
                  onClick={handleSelectCustom}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 shadow-xs ${
                    isCustomSelected 
                      ? 'border-heritage-terracotta ring-1 ring-heritage-terracotta/40' 
                      : 'border-heritage-brown/10 dark:border-stone-800 hover:border-heritage-brown/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-sans font-black uppercase tracking-wider text-heritage-brown dark:text-white">Custom Contribution</h4>
                      <p className="text-[10.5px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">Determine your own degree of support to our keepers</p>
                    </div>
                  </div>

                  {isCustomSelected ? (
                    <div className="flex items-center gap-2 bg-heritage-brown/5 px-3 py-1.5 rounded-xl border border-heritage-brown/10 max-w-xs w-full self-end md:self-auto">
                      <span className="text-xs font-mono font-bold text-heritage-brown">{billingCurrency}</span>
                      <input
                        type="number"
                        placeholder={billingCurrency === 'UGX' ? "50,000" : "50"}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="bg-transparent border-none text-right font-mono font-extrabold text-sm text-heritage-brown w-full focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-heritage-terracotta self-end md:self-auto">Select Custom Amount &rarr;</span>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Fund Allocation Explorer */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-heritage-brown/5">
                <div>
                  <h3 className="text-lg font-serif font-bold text-heritage-brown dark:text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-heritage-terracotta" />
                    <span>How Funds Are Distributed</span>
                  </h3>
                  <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">We maintain 100% transparency. Click sectors to view details.</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-md">
                    Audited Records
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Ring Chart */}
                <div className="md:col-span-5 flex justify-center">
                  <div className="relative w-44 h-44">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Language: 40% (0 to 40) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth={activeAllocation === 'language' ? "12" : "8"}
                        strokeDasharray="251.2"
                        strokeDashoffset="150.7" // 40% of 251.2 = 100.48, offset is 251.2 - 100.48 = 150.72
                        className="transition-all duration-300 cursor-pointer"
                        onClick={() => setActiveAllocation('language')}
                      />
                      {/* Oral History: 30% (40 to 70) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth={activeAllocation === 'oral_history' ? "12" : "8"}
                        strokeDasharray="251.2"
                        strokeDashoffset="75.36" // starts at 100.48 offset, length 75.36, total offset is 251.2 - 100.48 - 75.36 = 75.36
                        className="transition-all duration-300 cursor-pointer"
                        onClick={() => setActiveAllocation('oral_history')}
                      />
                      {/* Digitization: 20% (70 to 90) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth={activeAllocation === 'digitization' ? "12" : "8"}
                        strokeDasharray="251.2"
                        strokeDashoffset="25.12" // starts at 175.84 offset, length 50.24, total offset is 251.2 - 175.84 - 50.24 = 25.12
                        className="transition-all duration-300 cursor-pointer"
                        onClick={() => setActiveAllocation('digitization')}
                      />
                      {/* Infra: 10% (90 to 100) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth={activeAllocation === 'infra' ? "12" : "8"}
                        strokeDasharray="251.2"
                        strokeDashoffset="0" // starts at 226.08 offset, length 25.12, total offset is 0
                        className="transition-all duration-300 cursor-pointer"
                        onClick={() => setActiveAllocation('infra')}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-mono font-black text-heritage-brown dark:text-white">100%</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-heritage-brown/40 dark:text-stone-400">ALLOCATED</span>
                    </div>
                  </div>
                </div>

                {/* Details list */}
                <div className="md:col-span-7 space-y-3">
                  {ALLOCATION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveAllocation(cat.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        activeAllocation === cat.id
                          ? 'bg-heritage-brown/5 border-heritage-brown/20'
                          : 'border-transparent hover:bg-heritage-brown/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-bold text-heritage-brown dark:text-stone-200">{cat.label}</span>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-heritage-brown dark:text-white">{cat.percentage}%</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanatory text box for active allocation */}
              <div className="mt-6 p-4 rounded-xl bg-heritage-cream/40 border border-heritage-brown/5 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta block mb-1">
                  Active Highlight: {activeAllocInfo.label} ({activeAllocInfo.percentage}% of funds)
                </span>
                <p className="text-xs text-heritage-brown/80 dark:text-stone-300 leading-relaxed font-medium">
                  {activeAllocInfo.desc}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Donation Form OR Certificate */}
          <div className="lg:col-span-5 space-y-8 sticky top-28">
            
            <AnimatePresence mode="wait">
              {!showCertificate ? (
                // CHECKOUT FORM
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-heritage-brown/10 bg-white dark:bg-stone-900 p-6 md:p-8 shadow-md text-left"
                >
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-heritage-brown/5">
                    <Heart className="w-5 h-5 text-heritage-terracotta fill-heritage-terracotta" />
                    <div>
                      <h3 className="text-lg font-serif font-black text-heritage-brown dark:text-white">Cultural Covenant</h3>
                      <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">Secure your name in the Sanctuary Ledger</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitDonation} className="space-y-5">
                    {/* Donor Name */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 block mb-1.5">
                        Your Name (for registry & certificate)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aisha Nabakooza"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        disabled={isAnonymous}
                        className="w-full px-4 py-2.5 bg-heritage-cream/30 hover:bg-heritage-cream/50 focus:bg-white rounded-xl border border-heritage-brown/10 focus:border-heritage-terracotta focus:outline-none text-xs font-semibold text-heritage-brown placeholder-heritage-brown/30 dark:bg-stone-800 dark:border-stone-700 dark:text-white disabled:opacity-50"
                        required={!isAnonymous}
                      />
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 accent-heritage-terracotta rounded"
                        />
                        <span className="text-[11px] text-heritage-brown/60 dark:text-stone-400 font-semibold">List contribution anonymously</span>
                      </label>
                    </div>

                    {/* Donor Email */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 block mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="aisha@example.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-heritage-cream/30 hover:bg-heritage-cream/50 focus:bg-white rounded-xl border border-heritage-brown/10 focus:border-heritage-terracotta focus:outline-none text-xs font-semibold text-heritage-brown placeholder-heritage-brown/30 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                        required
                      />
                      <p className="text-[9.5px] text-heritage-brown/50 dark:text-stone-400 mt-1">We'll email a printable copy of your Guardianship certificate.</p>
                    </div>

                    {/* Totem Selection */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 block mb-1.5">
                        Select Ancestral Clan Totem
                      </label>
                      <select
                        value={chosenTotem}
                        onChange={(e) => setChosenTotem(e.target.value)}
                        className="w-full px-4 py-2.5 bg-heritage-cream/30 hover:bg-heritage-cream/50 focus:bg-white rounded-xl border border-heritage-brown/10 focus:border-heritage-terracotta focus:outline-none text-xs font-semibold text-heritage-brown dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                      >
                        {CLAN_TOTEMS.map((totem) => (
                          <option key={totem} value={totem}>{totem}</option>
                        ))}
                      </select>
                      <p className="text-[9.5px] text-heritage-brown/50 dark:text-stone-400 mt-1">
                        Bakenyi culture honors ancestral symbols. Your totem represents your support cluster.
                      </p>
                    </div>

                    {/* Payment Channel */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-stone-400 block mb-2">
                        Contribution Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('momo')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'momo'
                              ? 'border-heritage-terracotta bg-heritage-terracotta/5'
                              : 'border-heritage-brown/10 hover:border-heritage-brown/30'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-heritage-terracotta mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown">Mobile Money</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'card'
                              ? 'border-heritage-terracotta bg-heritage-terracotta/5'
                              : 'border-heritage-brown/10 hover:border-heritage-brown/30'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-heritage-terracotta mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown">Credit Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bank')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'bank'
                              ? 'border-heritage-terracotta bg-heritage-terracotta/5'
                              : 'border-heritage-brown/10 hover:border-heritage-brown/30'
                          }`}
                        >
                          <Landmark className="w-4 h-4 text-heritage-terracotta mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown">Bank Pledge</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Inputs Based on Payment Method */}
                    <AnimatePresence mode="wait">
                      {paymentMethod === 'momo' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3 bg-heritage-brown/[0.02] p-4 rounded-xl border border-heritage-brown/5"
                        >
                          <div className="flex justify-center gap-4 mb-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                checked={momoProvider === 'mtn'}
                                onChange={() => setMomoProvider('mtn')}
                                className="w-3.5 h-3.5 accent-yellow-500"
                              />
                              <span className="text-[10px] font-black text-heritage-brown">MTN MoMo</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                checked={momoProvider === 'airtel'}
                                onChange={() => setMomoProvider('airtel')}
                                className="w-3.5 h-3.5 accent-red-600"
                              />
                              <span className="text-[10px] font-black text-heritage-brown">Airtel Money</span>
                            </label>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/50 block mb-1">
                              Mobile Number (with country code)
                            </label>
                            <input
                              type="tel"
                              placeholder="+256 700 000000"
                              value={momoNumber}
                              onChange={(e) => setMomoNumber(e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-heritage-brown/10 text-xs font-mono font-semibold text-heritage-brown text-center dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                              required={paymentMethod === 'momo'}
                            />
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === 'card' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3 bg-heritage-brown/[0.02] p-4 rounded-xl border border-heritage-brown/5 text-left"
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/50 block">Payment Credentials (Secure Proxy)</span>
                          <div className="text-[10.5px] text-heritage-brown/60 dark:text-stone-400 bg-amber-500/5 p-2 rounded border border-amber-500/20 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>This is a secure offline/test container. Card numbers are simulated on verification.</span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Card Number"
                              className="w-full px-3 py-2 bg-white rounded-lg border border-heritage-brown/10 text-xs font-mono font-semibold focus:outline-none dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                              disabled
                              value="••••  ••••  ••••  4242"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="MM/YY"
                                className="px-3 py-2 bg-white rounded-lg border border-heritage-brown/10 text-xs font-mono font-semibold focus:outline-none text-center dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                disabled
                                value="12/28"
                              />
                              <input
                                type="text"
                                placeholder="CVV"
                                className="px-3 py-2 bg-white rounded-lg border border-heritage-brown/10 text-xs font-mono font-semibold focus:outline-none text-center dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                disabled
                                value="***"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === 'bank' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-heritage-brown/[0.02] p-4 rounded-xl border border-heritage-brown/5 text-xs text-heritage-brown/80 dark:text-stone-300 leading-normal"
                        >
                          <p className="font-bold text-heritage-brown mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Traditional Bank Pledge Setup</span>
                          </p>
                          Your covenant will be registered in the offline Sanctuary books. 
                          We will generate an official pledge token which can be settled via bank wire to Centenary Bank (Uganda) or Stanbic Bank.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Total Statement */}
                    <div className="p-4 bg-heritage-cream rounded-xl flex items-center justify-between text-left">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-heritage-brown/40 block">Final Contribution</span>
                        <span className="text-xs font-bold text-heritage-brown">
                          {getTierName()} ({donationFrequency === 'monthly' ? 'Monthly' : 'One-Time'})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-mono font-black text-heritage-terracotta">
                          {billingCurrency === 'UGX' ? 'UGX' : '$'} {calculateTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>CHRONICLING CONTRIBUTION...</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-white" />
                          <span>SOLEMNIZE CONTRIBUTION</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                // SUCCESS CERTIFICATE
                <motion.div
                  key="certificate"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl border-4 border-double border-heritage-terracotta bg-white dark:bg-stone-900 p-6 md:p-8 shadow-xl text-center relative overflow-hidden print:border-stone-950">
                    {/* Background seals */}
                    <div className="absolute inset-0 cultural-pattern opacity-5 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-heritage-terracotta/10 rounded-full flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border border-heritage-terracotta/10 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="space-y-2 relative z-10">
                      <Shield className="w-10 h-10 text-heritage-terracotta mx-auto mb-3" />
                      <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.25em] text-heritage-brown/40 dark:text-stone-400">
                        Bakenyi Elder Council Registry
                      </h4>
                      <h3 className="text-xl md:text-2xl font-serif font-black text-heritage-brown dark:text-white border-b-2 border-heritage-terracotta/20 pb-3 max-w-xs mx-auto">
                        Certificate of Guardianship
                      </h3>
                    </div>

                    {/* Body */}
                    <div className="mt-6 space-y-6 text-sm relative z-10 font-serif leading-relaxed text-heritage-brown dark:text-stone-200">
                      <p className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta mb-2">
                        This digital seal certifies that
                      </p>
                      
                      <p className="text-2xl md:text-3xl font-serif font-black italic text-heritage-brown underline decoration-heritage-terracotta/30 decoration-wavy underline-offset-8">
                        {certificateData?.name}
                      </p>

                      <p className="text-xs leading-relaxed max-w-sm mx-auto font-sans font-medium text-heritage-brown/80">
                        has formally entered the Bakenyi Chronicles by dedicating a stewardship covenant as a
                        <strong className="block text-sm font-serif font-black text-heritage-terracotta mt-1 uppercase tracking-wider">
                          {certificateData?.tier}
                        </strong>
                      </p>

                      <p className="text-xs max-w-sm mx-auto leading-relaxed italic font-medium">
                        "Your contribution anchors the Lukenye language and shelters the stories of Lake Kyoga's ancestral clans from the winds of time."
                      </p>
                    </div>

                    {/* Signatures & Seal info */}
                    <div className="mt-8 pt-6 border-t border-heritage-brown/10 grid grid-cols-2 gap-4 relative z-10 text-left font-sans text-[10px]">
                      <div>
                        <span className="font-bold text-heritage-brown block">Registry Seal ID</span>
                        <span className="font-mono text-heritage-terracotta font-extrabold">{certificateData?.transactionId}</span>
                        <span className="font-bold text-heritage-brown block mt-2">Covenant Date</span>
                        <span className="text-heritage-brown/70">{certificateData?.date}</span>
                      </div>
                      <div className="text-right flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-heritage-brown block">Associated Totem</span>
                          <span className="text-heritage-terracotta font-black uppercase">{certificateData?.totem}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="font-black uppercase tracking-wider">VERIFIED ON LEDGER</span>
                        </div>
                      </div>
                    </div>

                    {/* Ribbon Stamp */}
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full border-4 border-dashed border-heritage-terracotta/40 flex items-center justify-center text-[8px] font-black uppercase tracking-tighter text-heritage-terracotta transform rotate-12 select-none">
                      COUNCIL APPROVED
                    </div>
                  </div>

                  {/* Certificate controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-3 bg-heritage-brown hover:bg-heritage-brown/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Save PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCertificate(false);
                        setDonorName("");
                        setMomoNumber("");
                        setCustomAmount("");
                      }}
                      className="px-5 py-3 bg-heritage-cream hover:bg-heritage-brown/5 text-heritage-brown border border-heritage-brown/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      New Contribution
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </section>

      {/* Keepsake Roll & Offline Instructions */}
      <section className="py-16 px-4 bg-heritage-brown/5 border-t border-heritage-brown/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Communal Keepsake Roll */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-heritage-terracotta" />
              <h3 className="text-xl md:text-2xl font-serif font-black text-heritage-brown dark:text-white">
                Communal Keepsake Roll
              </h3>
            </div>
            
            <p className="text-xs text-heritage-brown/60 dark:text-stone-400 mb-6 leading-relaxed font-medium">
              We publicly honor the custodians of Bakenyi memory. Your dedication inspires others to support our language and clan chronicles.
            </p>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-heritage-brown/5 dark:border-stone-800 shadow-xs overflow-hidden">
              <div className="divide-y divide-heritage-brown/5">
                {recentContributors.map((c, index) => (
                  <div key={index} className="p-4 flex items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-heritage-brown/5 border border-heritage-brown/10 flex items-center justify-center text-heritage-brown">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-heritage-brown dark:text-stone-200">
                          {c.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-heritage-brown/50 dark:text-stone-400 font-bold">
                          <span>Totem: {c.totem}</span>
                          <span>•</span>
                          <span className="text-heritage-terracotta">{c.tier}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-heritage-brown dark:text-white">
                        {c.currency === 'USD' ? '$' : 'UGX '} {c.amount.toLocaleString()}
                      </span>
                      <p className="text-[9px] text-heritage-brown/40 dark:text-stone-500 mt-0.5 font-bold uppercase">{c.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Offline Contribution Guidance */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-heritage-terracotta" />
              <h3 className="text-xl md:text-2xl font-serif font-black text-heritage-brown dark:text-white">
                Offline Channels
              </h3>
            </div>

            <p className="text-xs text-heritage-brown/60 dark:text-stone-400 leading-relaxed font-medium">
              We understand that many members of the Kyoga basin region and eastern districts prefer to support our heritage via direct regional mechanisms.
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 shadow-xs text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta block mb-1.5">Direct Mobile Transfers</span>
                <p className="text-xs text-heritage-brown/85 dark:text-stone-300 leading-relaxed font-medium mb-3">
                  Transfers are settled directly with the Bakenye Association Treasure Council:
                </p>
                <div className="space-y-2 font-mono text-[11px] text-heritage-brown">
                  <div className="bg-heritage-brown/5 p-2 rounded-xl flex justify-between">
                    <span className="font-bold">MTN MoMo:</span>
                    <span className="font-black">+256 777 123456 (Treasurer)</span>
                  </div>
                  <div className="bg-heritage-brown/5 p-2 rounded-xl flex justify-between">
                    <span className="font-bold">Airtel Money:</span>
                    <span className="font-black">+256 701 123456 (General Sec)</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 shadow-xs text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-terracotta block mb-1.5">Physical Settlement</span>
                <p className="text-xs text-heritage-brown/85 dark:text-stone-300 leading-relaxed font-medium">
                  If visiting Kyoga district centers, you can provide check contributions, oral documentation notes, or historical photo donations to any registered Council Elder at:
                </p>
                <p className="text-xs font-bold text-heritage-brown mt-2.5">
                  Bakenye Cultural Association HQ<br />
                  Kyoga Basin Road, Pallisa District, Uganda
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
