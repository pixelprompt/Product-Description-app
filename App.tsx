
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
  ShoppingCart,
  Sparkles,
  ArrowRightLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  UploadCloud,
  X,
  Store,
  ArrowLeft
} from 'lucide-react';
import { GeminiService } from './geminiService';
import { ProductDetails, FullListing, CrossPlatformResearch, MatchResult } from './types';

type TabType = 'vision' | 'listings' | 'specs' | 'generate' | 'export';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('vision');
  const [images, setImages] = useState<{data: string, type: string}[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [research, setResearch] = useState<CrossPlatformResearch | null>(null);
  const [fullListing, setFullListing] = useState<FullListing | null>(null);
  const [editableDetails, setEditableDetails] = useState<ProductDetails | null>(null);
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
    setEditableDetails(null);
    setActiveTab('vision');
  };

  const runAnalysis = async () => {
    if (images.length === 0) return;
    
    // Check if API key exists in environment
    if (!process.env.API_KEY) {
      alert("System Error: API Key is missing. Please check your configuration.");
      return;
    }

    setAnalyzing(true);
    setMatchResult(null);
    setResearch(null);
    setFullListing(null);
    setEditableDetails(null);
    
    try {
      setLoadingStep("Analyzing Visual DNA...");
      const result = await GeminiService.analyzeBatch(images);
      setMatchResult(result);
      
      if (result.isMatch && result.mergedMetadata) {
        setLoadingStep("Researching Online Marketplaces...");
        const researchData = await GeminiService.researchCrossPlatform(result.mergedMetadata);
        setResearch(researchData);
        
        const initialDetails: ProductDetails = {
          name: result.mergedMetadata.suggestedName || 'Apparel Product',
          brand: 'Generic', 
          category: result.mergedMetadata.garmentType || 'Apparel',
          fabric: result.mergedMetadata.fabricTexture || 'Standard Fabric',
          colors: result.mergedMetadata.colors.join(', ') || 'N/A',
          price: researchData.listings[0]?.price || 'Market Price',
          dimensions: researchData.confirmedDimensions || 'TBD',
          itemsIncluded: '1 Unit',
          styleCode: 'LAI-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          topType: result.mergedMetadata.neckline || 'Standard',
          bottomType: 'Standard',
          pattern: result.mergedMetadata.pattern || 'Solid',
          occasion: 'Casual/Formal',
          size: 'Standard',
          sleeveLength: result.mergedMetadata.sleeveStyle || 'Standard',
          neck: result.mergedMetadata.neckline || 'Standard',
          fabricCare: 'Professional Care',
          shippingDays: '3-5 Business Days'
        };
        setEditableDetails(initialDetails);
        setActiveTab('listings');
      } else {
        alert(result.reason || "Unable to confirm item match across images.");
      }
    } catch (err) {
      console.error("Analysis Workflow Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert("Intelligence workflow encountered an issue: " + errorMsg);
    } finally {
      setAnalyzing(false);
      setLoadingStep("");
    }
  };

  const handleGenerateListing = async () => {
    if (!editableDetails || !research) return;
    setGenerating(true);
    setLoadingStep("Optimizing Copy...");
    try {
      const listing = await GeminiService.generateFullListing(editableDetails, research.mergedMaster);
      setFullListing(listing);
      setActiveTab('generate');
    } catch (err) {
      console.error("Generation Error:", err);
      alert("Failed to generate marketing assets. " + (err instanceof Error ? err.message : ""));
    } finally {
      setGenerating(false);
      setLoadingStep("");
    }
  };

  const updateDetail = (key: keyof ProductDetails, value: string) => {
    if (!editableDetails) return;
    setEditableDetails({ ...editableDetails, [key]: value });
  };

  const currentToneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);
  const progressWidth = (images.length / 5 * 100).toString() + '%';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      <header className="px-8 pt-6 pb-2 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
             <ShoppingCart className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            ListingAI <span className="text-indigo-600">Cross-Platform</span>
          </h1>
        </div>

        <nav className="flex items-center gap-8 border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
          {(['vision', 'listings', 'specs', 'generate', 'export'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              disabled={!editableDetails && tab !== 'vision'}
              className={"pb-4 px-2 text-sm font-semibold transition-all relative capitalize flex items-center gap-2 whitespace-nowrap " + (activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 disabled:opacity-20')}
            >
              {tab === 'vision' && <Camera className="w-4 h-4" />}
              {tab === 'listings' && <ArrowRightLeft className="w-4 h-4" />}
              {tab === 'specs' && <ClipboardList className="w-4 h-4" />}
              {tab === 'generate' && <Zap className="w-4 h-4" />}
              {tab === 'export' && <Download className="w-4 h-4" />}
              {tab === 'listings' ? 'Cross-Platform Listings' : tab === 'specs' ? 'Product Specs' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-[1200px] mx-auto px-8 pb-20">
        
        {activeTab === 'vision' && (
          <div className="animate-in space-y-10">
            <label className="block w-full max-w-2xl mx-auto py-20 px-10 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer text-center group">
              <div className="bg-white w-20 h-20 rounded-[24px] shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform border border-slate-100">
                <UploadCloud className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Identify Product</h2>
              <p className="text-slate-400 text-sm font-medium">Upload up to 5 clear images of your item</p>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>

            {images.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{images.length} OF 5 UPLOADED</span>
                    <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: progressWidth }} />
                    </div>
                  </div>
                  <button onClick={clearAll} className="text-xs font-bold text-red-500 flex items-center gap-2 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
                    <RefreshCcw className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-[24px] overflow-hidden border-2 border-emerald-500/50 shadow-md group">
                      <img src={img.data} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-xl hover:bg-red-500 transition-colors backdrop-blur-sm">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-8">
                  <button 
                    onClick={runAnalysis}
                    disabled={analyzing || images.length === 0}
                    className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-[24px] font-bold flex items-center gap-3 shadow-2xl shadow-indigo-200 transition-all scale-100 hover:scale-[1.02] active:scale-95"
                  >
                    {analyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    <span className="text-lg">{analyzing ? loadingStep : "Start Analysis"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'listings' && research && (
          <div className="animate-in space-y-12">
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-100/50">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Cross-Platform Comparison</h2>
                  <p className="text-slate-400 text-base font-medium">Synced research from top e-commerce destinations.</p>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-end max-w-md">
                  {research.commonKeywords.map((tag, i) => (
                    <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 uppercase tracking-widest shadow-sm">
                      #{tag.replace(/\s+/g, '')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {research.listings.map((item, i) => (
                  <div key={i} className="bg-slate-50/70 rounded-[32px] p-8 border border-slate-100 group hover:border-indigo-300 hover:bg-white hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                          <Store className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{item.platform}</span>
                      </div>
                      <span className="text-base font-black text-indigo-600">{item.price}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-4 leading-relaxed line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-8 line-clamp-5 font-medium">
                      {item.description}
                    </p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 flex items-center gap-2 hover:translate-x-1 transition-transform group-hover:underline">
                        View Listing <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[48px] p-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">AI-Merged Master Copy</h3>
              </div>
              <p className="text-indigo-100 text-base mb-10 relative z-10 italic max-w-2xl leading-relaxed">
                "We synthesized the highest-converting descriptions from across the web into this master copy."
              </p>
              <div className="bg-white/10 rounded-[32px] p-10 border border-white/20 backdrop-blur-xl relative z-10">
                <p className="text-base leading-[1.8] text-white whitespace-pre-wrap font-medium">
                  {research.mergedMaster}
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-4">
               <button onClick={() => setActiveTab('specs')} className="px-14 py-5 bg-slate-900 text-white rounded-[28px] font-bold text-lg flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all active:scale-95">
                 Finalize Specifications <ChevronRight className="w-6 h-6" />
               </button>
            </div>
          </div>
        )}

        {activeTab === 'specs' && editableDetails && (
          <div className="animate-in bg-slate-50/50 p-12 rounded-[56px] border border-slate-100 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-10">
              {(Object.keys(editableDetails) as (keyof ProductDetails)[]).map((key) => (
                <div key={key} className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input
                    type="text"
                    value={editableDetails[key]}
                    onChange={(e) => updateDetail(key, e.target.value)}
                    placeholder={'Enter ' + key + '...'}
                    className="w-full px-7 py-5 bg-white border border-slate-200 rounded-[24px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between pt-16 border-t border-slate-200/60 mt-8 gap-6">
              <button onClick={() => setActiveTab('listings')} className="flex items-center gap-3 px-10 py-5 bg-white text-slate-600 rounded-[24px] text-sm font-bold border border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Research
              </button>
              <button 
                onClick={handleGenerateListing}
                disabled={generating}
                className="w-full md:flex-1 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[28px] font-bold text-lg flex items-center justify-center gap-4 shadow-2xl shadow-indigo-200 transition-all active:scale-95 disabled:bg-slate-300"
              >
                {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                {generating ? 'Processing AI...' : ('Generate ' + currentToneLabel + ' Listing')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'generate' && fullListing && (
          <div className="animate-in flex flex-col items-center">
            <div className="flex bg-slate-100 p-1.5 rounded-full mb-16 border border-slate-200 shadow-sm">
              {(['casual', 'professional', 'luxurious'] as const).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setTone(t)} 
                  className={"px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all " + (tone === t ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600')}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="w-full flex flex-col lg:flex-row gap-12 items-start">
              <div className="flex-1 space-y-10 w-full">
                <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="flex items-center gap-4 font-bold text-xl text-slate-800">
                      <FileText className="w-6 h-6 text-indigo-500" /> Description
                    </h3>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(fullListing[tone].description); alert("Copied to clipboard!"); }} 
                      className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-slate-100"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-slate-600 leading-[1.9] text-base font-medium whitespace-pre-wrap">
                    {fullListing[tone].description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-100">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800 mb-8 text-sm">
                      <Zap className="w-5 h-5 text-indigo-500" /> Care & Materials
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                      {fullListing[tone].fabricCare}
                    </p>
                  </div>
                  <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-100">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800 mb-8 text-sm">
                      <Download className="w-5 h-5 text-indigo-500" /> Shipping Policy
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      Optimized for 3-5 day delivery. Standard packaging included.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[350px] bg-[#0F172A] rounded-[48px] p-10 text-white shadow-2xl flex flex-col justify-between min-h-[750px] sticky top-8">
                <div>
                  <h3 className="flex items-center gap-3 font-bold text-base mb-12 tracking-widest uppercase italic border-b border-white/10 pb-6">
                    <ClipboardList className="w-6 h-6 text-indigo-400" /> Attributes
                  </h3>
                  <div className="space-y-8 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                    {editableDetails && Object.entries(editableDetails).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs font-semibold text-slate-200">{value || 'Not Specified'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-12 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900 transition-all active:scale-95 text-sm uppercase tracking-widest">
                  Export to Marketplace <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
           <div className="flex flex-col items-center justify-center py-48 text-slate-400">
             <div className="bg-slate-100 p-12 rounded-full mb-8 shadow-inner"><Download className="w-20 h-20" /></div>
             <p className="text-lg font-bold uppercase tracking-[0.3em] text-slate-300">Multi-Channel Export Coming Soon</p>
           </div>
        )}

      </main>
    </div>
  );
}
