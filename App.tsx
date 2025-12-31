
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
    setAnalyzing(true);
    setMatchResult(null);
    setResearch(null);
    setFullListing(null);
    setEditableDetails(null);
    
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
        
        if (currentResearch) {
          const initialDetails: ProductDetails = {
            name: result.mergedMetadata.suggestedName || 'Black Sheer Panel Starfish Embellished',
            brand: 'Casual', 
            category: result.mergedMetadata.garmentType || 'Evening Gown',
            fabric: result.mergedMetadata.fabricTexture || 'Smooth matte fabric with sheer mesh',
            colors: result.mergedMetadata.colors.join(', ') || 'Black, Silver',
            price: currentResearch.listings[0]?.price || '',
            dimensions: currentResearch.confirmedDimensions || '',
            itemsIncluded: '1 Gown',
            styleCode: 'LUX-SIREN-' + Math.random().toString(36).substring(2, 5).toUpperCase(),
            topType: 'Sweetheart with spaghetti straps',
            bottomType: 'Floor-Length Draped Skirt',
            pattern: result.mergedMetadata.pattern || 'Solid with rhinestone starfish appliqué',
            occasion: 'Black Tie, Red Carpet, Gala',
            size: '',
            sleeveLength: 'Sleeveless',
            neck: 'Sweetheart with spaghetti straps',
            fabricCare: 'Professional Dry Clean Only',
            shippingDays: '3-5 Days'
          };
          setEditableDetails(initialDetails);
          setActiveTab('listings');
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

  const handleGenerateListing = async () => {
    if (!editableDetails || !research) return;
    setGenerating(true);
    setLoadingStep("Generating Content...");
    try {
      const listing = await GeminiService.generateFullListing(editableDetails, research.mergedMaster);
      setFullListing(listing);
      setActiveTab('generate');
    } catch (err) {
      alert("Failed to generate listing.");
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

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
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
              disabled={!editableDetails && tab !== 'vision'}
              className={`pb-4 px-2 text-sm font-medium transition-all relative capitalize flex items-center gap-2 ${
                activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 disabled:opacity-30'
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

      <main className="max-w-[1200px] mx-auto px-8 pb-20">
        
        {activeTab === 'vision' && (
          <div className="animate-in space-y-10">
            <label className="block w-full max-w-2xl mx-auto py-16 px-10 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer text-center group">
              <div className="bg-white w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Select 5 Images</h2>
              <p className="text-slate-400 text-sm">Drag and drop or click to pick from device</p>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>

            {images.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{images.length} OF 5 UPLOADED</span>
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: (images.length / 5 * 100).toString() + '%' }} />
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
              </div>
            )}
          </div>
        )}

        {activeTab === 'listings' && research && (
          <div className="animate-in space-y-12">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Cross-Platform Comparison</h2>
                  <p className="text-slate-400 text-sm">Synced research from top e-commerce destinations.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {research.commonKeywords.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      #{tag.replace(/\s+/g, '')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {research.listings.map((item, i) => (
                  <div key={i} className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                          <Store className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{item.platform}</span>
                      </div>
                      <span className="text-xs font-black text-indigo-600">{item.price}</span>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-900 mb-3 leading-snug line-clamp-2">{item.title}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-6 line-clamp-4">
                      {item.description}
                    </p>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                      View Listing <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">AI-Merged Master Copy</h3>
              </div>
              <p className="text-white/70 text-sm mb-8 relative z-10 italic">"Analyzed high-converting phrases into this master description."</p>
              <div className="bg-white/10 rounded-[32px] p-8 border border-white/20 backdrop-blur-md relative z-10">
                <p className="text-sm leading-[1.8] text-slate-100 whitespace-pre-wrap">{research.mergedMaster}</p>
              </div>
            </div>

            <div className="flex justify-center">
               <button onClick={() => setActiveTab('specs')} className="px-10 py-4 bg-slate-900 text-white rounded-[20px] font-bold flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                 Review Specifications <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}

        {activeTab === 'specs' && editableDetails && (
          <div className="animate-in space-y-8 bg-slate-50/50 p-12 rounded-[48px] border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-8">
              {(Object.keys(editableDetails) as (keyof ProductDetails)[]).map((key) => (
                <div key={key} className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input
                    type="text"
                    value={editableDetails[key]}
                    onChange={(e) => updateDetail(key, e.target.value)}
                    placeholder={'Enter ' + key + '...'}
                    className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[20px] text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-200 shadow-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-12 border-t border-slate-200/60 mt-4">
              <button onClick={() => setActiveTab('listings')} className="flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-600 rounded-[20px] text-xs font-bold hover:bg-slate-200 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back to Platforms
              </button>
              <button 
                onClick={handleGenerateListing}
                disabled={generating}
                className="flex-1 ml-6 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-300"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {generating ? 'Processing AI...' : ('Generate ' + currentToneLabel + ' Listing')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'generate' && fullListing && (
          <div className="animate-in flex flex-col items-center">
            <div className="flex bg-slate-100 p-1 rounded-full mb-12 border border-slate-200">
              {(['casual', 'professional', 'luxurious'] as const).map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${tone === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
              ))}
            </div>

            <div className="w-full flex gap-12 items-start">
              <div className="flex-1 space-y-8">
                <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-slate-200 border border-slate-100 relative">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800"><FileText className="w-5 h-5 text-indigo-500" /> Description</h3>
                    <button onClick={() => { navigator.clipboard.writeText(fullListing[tone].description); alert("Copied!"); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><Copy className="w-4 h-4" /></button>
                  </div>
                  <p className="text-slate-600 leading-[1.8] text-sm font-medium">{fullListing[tone].description}</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-100">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800 mb-6 text-sm"><Zap className="w-4 h-4 text-indigo-500" /> Care & Quality</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{fullListing[tone].fabricCare}</p>
                  </div>
                  <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-100">
                    <h3 className="flex items-center gap-3 font-bold text-slate-800 mb-6 text-sm"><Download className="w-4 h-4 text-indigo-500" /> Shipping Info</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">Complimentary 3-5 day shipping included.</p>
                  </div>
                </div>
              </div>

              <div className="w-[320px] bg-[#0F172A] rounded-[40px] p-10 text-white shadow-2xl flex flex-col justify-between min-h-[700px]">
                <div>
                  <h3 className="flex items-center gap-3 font-bold text-sm mb-10 tracking-wide uppercase italic"><ClipboardList className="w-5 h-5 text-indigo-400" /> Attributes</h3>
                  <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar">
                    {editableDetails && Object.entries(editableDetails).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-[10px] font-bold text-slate-200">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-900 transition-all active:scale-95 text-xs">Finalize Export <Download className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'export') && (
           <div className="flex flex-col items-center justify-center py-40 text-slate-400">
             <div className="bg-slate-100 p-10 rounded-full mb-6"><Download className="w-16 h-16" /></div>
             <p className="text-sm font-bold uppercase tracking-widest">Multi-Channel Export Hub Coming Soon</p>
           </div>
        )}

        {(!editableDetails && activeTab !== 'vision') && (
           <div className="flex flex-col items-center justify-center py-40 text-slate-400 animate-pulse">
             <div className="bg-slate-100 p-10 rounded-full mb-6"><Search className="w-16 h-16" /></div>
             <p className="text-sm font-bold uppercase tracking-widest">Awaiting Analysis Data</p>
             <button onClick={() => setActiveTab('vision')} className="mt-4 text-indigo-600 font-bold text-xs underline underline-offset-4">Back to Vision</button>
           </div>
        )}

      </main>
    </div>
  );
}
