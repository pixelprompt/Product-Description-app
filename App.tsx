import React, { useState } from 'react';
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
  RefreshCcw
} from 'lucide-react';
import { GeminiService } from './geminiService';
import { ProductDetails, FullListing, CrossPlatformResearch, MatchResult } from './types';

// Fixing the missing export error by providing a full implementation of the App component
export default function App() {
  const [images, setImages] = useState<{data: string, type: string}[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [research, setResearch] = useState<CrossPlatformResearch | null>(null);
  const [fullListing, setFullListing] = useState<FullListing | null>(null);
  const [activeTab, setActiveTab] = useState<'casual' | 'professional' | 'luxurious'>('casual');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const base64Files = await Promise.all(newFiles.map(async f => ({
      data: await GeminiService.fileToBase64(f),
      type: f.type
    })));
    setImages(prev => [...prev, ...base64Files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    setMatchResult(null);
    setResearch(null);
    setFullListing(null);

    try {
      // Step 1: Batch Analysis for matching and basic metadata
      const result = await GeminiService.analyzeBatch(images);
      setMatchResult(result);
      
      if (result.isMatch && result.mergedMetadata) {
        // Step 2: Cross-platform market research using Google Search grounding
        const researchData = await GeminiService.researchCrossPlatform(result.mergedMetadata.suggestedName);
        setResearch(researchData);
        
        const details: ProductDetails = {
          name: result.mergedMetadata.suggestedName,
          brand: result.mergedMetadata.brandClues || 'Generic',
          category: result.mergedMetadata.garmentType,
          fabric: result.mergedMetadata.fabricTexture,
          colors: result.mergedMetadata.colors.join(', '),
          price: researchData.listings[0]?.price || 'TBD',
          dimensions: 'Standard Sizes Available',
          itemsIncluded: '1 Main Garment',
          styleCode: 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          topType: result.mergedMetadata.garmentType,
          bottomType: 'N/A',
          pattern: result.mergedMetadata.pattern,
          occasion: 'Versatile',
          size: 'S, M, L, XL',
          sleeveLength: result.mergedMetadata.sleeveStyle,
          neck: result.mergedMetadata.neckline,
          fabricCare: 'Professional cleaning recommended. Store in a cool, dry place.',
          shippingDays: 'Standard 5-7 Business Days'
        };
        
        // Step 3: Generate high-conversion listings with thinking capability
        const listing = await GeminiService.generateFullListing(details, researchData.mergedMaster);
        setFullListing(listing);
      }
    } catch (err) {
      console.error(err);
      alert("AI analysis encountered an error. Please try fewer images or check your connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">MerchMaster<span className="text-indigo-600">AI</span></h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border">
            <Globe className="w-3.5 h-3.5" /> Market Search: Enabled
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Left Column: Visual Assets & Verification */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera className="w-4 h-4" /> Visual Assets
              </h2>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">{images.length} / 5</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border bg-slate-50 border-slate-100">
                  <img src={img.data} alt="Upload" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group">
                  <Plus className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Add Image</span>
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              )}
            </div>

            <button 
              onClick={runAnalysis}
              disabled={images.length === 0 || analyzing}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-indigo-400" />}
              {analyzing ? "Synthesizing Data..." : "Analyze & Research"}
            </button>
          </section>

          {matchResult && (
            <section className={`rounded-2xl border p-6 transition-all duration-500 ${matchResult.isMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-start gap-3">
                {matchResult.isMatch ? 
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" /> : 
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                }
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 leading-tight">
                    {matchResult.isMatch ? 'Product Verified' : 'Consistency Mismatch'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{matchResult.reason}</p>
                </div>
              </div>
              
              <div className="mt-5 pt-5 border-t border-slate-900/5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>Match Confidence</span>
                  <span className={matchResult.confidence > 80 ? 'text-emerald-600' : 'text-amber-600'}>
                    {matchResult.confidence}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${matchResult.isMatch ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                    style={{ width: `${matchResult.confidence}%` }}
                  ></div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Intelligence & Listings */}
        <div className="lg:col-span-8 space-y-8">
          {research ? (
            <>
              {/* Market Intelligence Dashboard */}
              <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-slate-900 p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-400" /> Market Intelligence
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">Real-time data from 10+ global sources</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Sources Verified
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {research.listings.slice(0, 4).map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-indigo-500/30 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{item.platform}</p>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <p className="text-white font-bold text-lg">{item.price}</p>
                        <p className="text-slate-500 text-[10px] truncate mt-1">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-8 border-b">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Semantic SEO Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {research.commonKeywords.map((kw, i) => (
                      <span key={i} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:border-indigo-200 transition-colors cursor-default">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CITATIONS SECTION (MANDATORY per API Rules) */}
                <div className="p-8 bg-slate-50/50">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Research Footnotes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {research.groundingSources?.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group"
                      >
                        <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-indigo-50 transition-colors">
                          <Globe className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <span className="font-semibold truncate flex-1">{source.title}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                      </a>
                    ))}
                  </div>
                </div>
              </section>

              {/* Multi-Persona Listing Output */}
              {fullListing && (
                <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="px-8 pt-8 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" /> AI-Generated Listing
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Synthesized using deep reasoning logic</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {(['casual', 'professional', 'luxurious'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                              activeTab === tab 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-white">
                    <div className="max-w-3xl">
                      <div className="mb-10">
                        <p className="text-slate-700 leading-[1.8] text-lg font-medium whitespace-pre-wrap selection:bg-indigo-100">
                          {fullListing[activeTab].description}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Care & Maintenance</h4>
                          <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium italic">
                            {fullListing[activeTab].fabricCare}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fulfillment Policy</h4>
                          <p className="text-slate-600 text-sm leading-relaxed font-medium">
                            {fullListing[activeTab].shipping}
                          </p>
                        </div>
                      </div>

                      {fullListing[activeTab].moreInfo && (
                        <div className="mt-10">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Technical Data Sheet</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            {Object.entries(fullListing[activeTab].moreInfo).map(([key, val]) => (
                              <div key={key} className="flex justify-between py-3 border-b border-slate-50 items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="text-sm font-bold text-slate-700">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(fullListing[activeTab].description);
                          alert("Listing copied to clipboard!");
                        }}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                      >
                        <Copy className="w-5 h-5" /> Copy Listing Text
                      </button>
                      <button className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                        <Download className="w-5 h-5" /> Export PDF
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="min-h-[600px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-6 bg-slate-50/30">
              <div className="bg-white p-8 rounded-full shadow-inner border border-slate-100">
                <ClipboardList className="w-16 h-16 text-slate-200" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-extrabold text-slate-400">Awaiting Analysis</p>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">Upload product photos to generate high-conversion market intelligence and listings.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
