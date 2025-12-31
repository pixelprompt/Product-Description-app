
import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Search, 
  ClipboardList, 
  Zap, 
  Download, 
  Loader2, 
  ChevronRight, 
  ExternalLink,
  Copy,
  Package,
  ShoppingCart,
  Sparkles,
  ArrowRightLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Globe,
  Plus,
  Trash2,
  RefreshCcw,
  Maximize2,
  Ruler,
  Fingerprint,
  UploadCloud,
  X
} from 'lucide-react';
import { GeminiService } from './geminiService';
import { ProductDetails, FullListing, CrossPlatformResearch, MatchResult } from './types';

type TabType = 'vision' | 'listings' | 'specs' | 'generate' | 'export';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('vision');
  const [images, setImages] = useState<{data: string, type: string}[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [research, setResearch] = useState<CrossPlatformResearch | null>(null);
  const [fullListing, setFullListing] = useState<FullListing | null>(null);
  const [tone, setTone] = useState<'casual' | 'professional' | 'luxurious'>('luxurious');
  const [loadingStep, setLoadingStep] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const base64Files = await Promise.all(newFiles.map(async f => ({
      data: await GeminiService.fileToBase64(f),
      type: f.type
    })));
    setImages(prev => [...prev, ...base64Files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setImages([]);
    setMatchResult(null);
    setResearch(null);
    setFullListing(null);
  };

  const runAnalysis = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    setMatchResult(null);
    setResearch(null);
    setFullListing(null);
    
    try {
      setLoadingStep("Extracting Visual Signature...");
      const result = await GeminiService.analyzeBatch(images);
      setMatchResult(result);
      
      if (result.isMatch && result.mergedMetadata) {
        let currentResearch: CrossPlatformResearch | null = null;
        let iteration = 1;
        let foundMatch = false;

        while (iteration <= 3 && !foundMatch) {
          setLoadingStep("Gathering dimension data from multiple sources...");
          const researchData = await GeminiService.researchCrossPlatform(result.mergedMetadata, iteration);
          
          if (researchData.dimensionSourceCount >= 3) {
            currentResearch = researchData;
            foundMatch = true;
          } else {
            currentResearch = researchData; 
            iteration++;
          }
        }
        
        setResearch(currentResearch);
        
        if (currentResearch && currentResearch.dimensionSourceCount >= 3) {
          setLoadingStep("Finalizing Marketing Assets...");
          const details: ProductDetails = {
            name: result.mergedMetadata.suggestedName,
            brand: 'Casual', 
            category: result.mergedMetadata.garmentType,
            fabric: result.mergedMetadata.fabricTexture,
            colors: result.mergedMetadata.colors.join(', '),
            price: currentResearch.listings[0]?.price || 'Market Rate',
            dimensions: currentResearch.confirmedDimensions || 'Not Found',
            itemsIncluded: '1 Gown',
            styleCode: 'LUX-SIREN-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
            topType: 'Couture Sweetheart',
            bottomType: 'Floor-Length Draped Skirt',
            pattern: result.mergedMetadata.pattern || 'Solid with Crystal Hardware',
            occasion: 'Black Tie, Red Carpet, Gala',
            size: 'Select Size',
            sleeveLength: 'Sleeveless',
            neck: 'Deep Sweetheart',
            fabricCare: 'Professional Dry Clean Only',
            shippingDays: '3-5 Days'
          };
          
          const listing = await GeminiService.generateFullListing(details, currentResearch.mergedMaster);
          setFullListing(listing);
          // Automatically move to Generate tab when done
          setActiveTab('generate');
        }
      }
    } catch (err) {
      console.error(err);
      alert("Intelligence workflow encountered an issue.");
    } finally {
      setAnalyzing(false);
      setLoadingStep("");
    }
  };

  const productAttributes = research && fullListing ? {
    "ITEMS INCLUDED": "1 Gown",
    "BRAND": "Luxe Mode", // Replaced with visual data/requirement
    "FABRIC": research.visualSignature?.substring(0, 40) + "..." || "Premium Matte Stretch",
    "STYLE CODE": "LUX-SIREN-001",
    "COLORS": matchResult?.mergedMetadata?.colors.join(', ') || "Midnight Black",
    "TOP TYPE": "Couture Sweetheart",
    "BOTTOM TYPE": "Floor-Length Draped Skirt",
    "PATTERN": "Solid with Crystal Hardware",
    "OCCASION": "Black Tie, Red Carpet, Gala",
    "SIZE": "Select Size",
    "SLEEVE LENGTH": "Sleeveless",
    "NECK": "Deep Sweetheart",
    "FABRIC CARE": "Professional Dry Clean Only",
    "SHIPPING DAYS": "3-5 Days"
  } : null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navbar Section */}
      <header className="px-8 pt-6 pb-2 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg">
             <ShoppingCart className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">
            ListingAI <span className="text-indigo-600">Cross-Platform</span>
          </h1>
        </div>

        <nav className="flex items-center gap-8 border-b border-slate-100 mb-8">
          {(['vision', 'listings', 'specs', 'generate', 'export'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-medium transition-all relative capitalize flex items-center gap-2 ${
                activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'vision' && <Camera className="w-4 h-4" />}
              {tab === 'listings' && <ArrowRightLeft className="w-4 h-4" />}
              {tab === 'specs' && <ClipboardList className="w-4 h-4" />}
              {tab === 'generate' && <Zap className="w-4 h-4" />}
              {tab === 'export' && <Download className="w-4 h-4" />}
              {tab === 'listings' ? 'Cross-Platform Listings' : tab === 'specs' ? 'Product Specs' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-8 pb-20">
        
        {activeTab === 'vision' && (
          <div className="animate-in space-y-10">
            {/* Upload Zone */}
            <label className="block w-full max-w-2xl mx-auto py-16 px-10 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer text-center group">
              <div className="bg-white w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Select 5 Images</h2>
              <p className="text-slate-400 text-sm">Drag and drop or click to pick from device (JPG, PNG, WebP - Max 30MB per image)</p>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>

            {/* Images List Section */}
            {images.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{images.length} OF 5 UPLOADED</span>
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(images.length / 5) * 100}%` }} />
                    </div>
                  </div>
                  <button onClick={clearAll} className="text-xs font-bold text-red-500 flex items-center gap-1 uppercase tracking-widest hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
                    <RefreshCcw className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-sm group">
                      <img src={img.data} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-8">
                  <button 
                    onClick={runAnalysis}
                    disabled={analyzing || images.length === 0}
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-[20px] font-bold flex items-center gap-3 shadow-xl shadow-indigo-100 transition-all scale-100 hover:scale-[1.02] active:scale-95"
                  >
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {analyzing ? loadingStep : "Check Matching & Proceed"}
                  </button>
                </div>

                {matchResult && (
                  <div className={`mt-10 p-6 rounded-[24px] border flex items-start gap-4 ${matchResult.isMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`p-3 rounded-xl ${matchResult.isMatch ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {matchResult.isMatch ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">{matchResult.isMatch ? 'All Images Match Perfectly!' : 'Assets Mismatch'}</h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Confidence: {matchResult.confidence}%</span>
                      </div>
                      <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">{matchResult.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && fullListing && (
          <div className="animate-in flex flex-col items-center">
            {/* Tone Selector */}
            <div className="flex bg-slate-100 p-1 rounded-full mb-12 border border-slate-200">
              {(['casual', 'professional', 'luxurious'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                    tone === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="w-full flex gap-12 items-start">
              {/* Cards Grid */}
              <div className="flex-1 space-y-8">
                {/* Description Card */}
                <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-slate-200 border border-slate-100 relative group">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800">
                      <FileText className="w-5 h-5 text-indigo-500" /> Description
                    </h3>
                    <button onClick={() => { navigator.clipboard.writeText(fullListing[tone].description); alert("Copied!"); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-600 leading-[1.8] text-sm font-medium">
                    {fullListing[tone].description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Care Card */}
                  <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-100">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800 mb-6 text-sm">
                      <Zap className="w-4 h-4 text-indigo-500" /> Care & Quality
                    </h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                      {fullListing[tone].fabricCare}
                    </p>
                  </div>
                  {/* Shipping Card */}
                  <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-100">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800 mb-6 text-sm">
                      <Download className="w-4 h-4 text-indigo-500" /> Shipping Info
                    </h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                      Complimentary 3-5 day shipping included.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Attributes */}
              <div className="w-[320px] bg-[#0F172A] rounded-[40px] p-10 text-white shadow-2xl flex flex-col justify-between min-h-[700px]">
                <div>
                  <h3 className="flex items-center gap-3 font-bold text-sm mb-10 tracking-wide uppercase italic">
                    <ClipboardList className="w-5 h-5 text-indigo-400" /> Attributes
                  </h3>
                  <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar">
                    {productAttributes && Object.entries(productAttributes).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{key}</p>
                        <p className="text-[10px] font-bold text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full mt-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-900 transition-all active:scale-95 text-xs">
                  Finalize Export <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {(!fullListing && activeTab !== 'vision') && (
           <div className="flex flex-col items-center justify-center py-40 text-slate-400 animate-pulse">
             <div className="bg-slate-100 p-10 rounded-full mb-6">
                <Search className="w-16 h-16" />
             </div>
             <p className="text-sm font-bold uppercase tracking-widest">Awaiting Analysis Data</p>
             <button onClick={() => setActiveTab('vision')} className="mt-4 text-indigo-600 font-bold text-xs underline underline-offset-4">Back to Vision</button>
           </div>
        )}

      </main>
    </div>
  );
}
