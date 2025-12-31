
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
  Layout,
  FileCode,
  Package,
  ShoppingCart,
  Store,
  Sparkles,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { 
  ProductDetails, 
  ProductMetadata, 
  FullListing, 
  CrossPlatformResearch,
  PlatformListing
} from './types';
import { GeminiService } from './geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visionData, setVisionData] = useState<ProductMetadata | null>(null);
  const [researchData, setResearchData] = useState<CrossPlatformResearch | null>(null);
  const [details, setDetails] = useState<ProductDetails>({
    name: '', brand: '', category: '', fabric: '', colors: '', price: '',
    dimensions: '', itemsIncluded: '', styleCode: '', topType: '', bottomType: '',
    pattern: '', occasion: '', size: '', sleeveLength: '', neck: '',
    fabricCare: '', shippingDays: '3-5 Days'
  });
  const [finalListing, setFinalListing] = useState<FullListing | null>(null);
  const [selectedTone, setSelectedTone] = useState<'casual' | 'professional' | 'luxurious'>('professional');

  const tabs = [
    { id: 0, label: 'Vision', icon: Camera },
    { id: 1, label: 'Cross-Platform', icon: ArrowRightLeft },
    { id: 2, label: 'Details', icon: ClipboardList },
    { id: 3, label: 'Generate', icon: Zap },
    { id: 4, label: 'Export', icon: Download },
  ];

  // Automated Workflow
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
    setIsLoading(true);
    setLoadingStep('Analyzing Product with Vision...');
    
    try {
      // 1. Vision Analysis
      const metadata = await GeminiService.analyzeImage(file);
      setVisionData(metadata);
      setDetails(prev => ({
        ...prev,
        name: metadata.suggestedName,
        category: metadata.garmentType,
        fabric: metadata.fabricTexture,
        colors: metadata.colors.join(', '),
        pattern: metadata.pattern,
        neck: metadata.neckline,
        sleeveLength: metadata.sleeveStyle
      }));

      // 2. Automatic Research Trigger
      setLoadingStep('Auto-Searching Amazon, Flipkart, Ajio, Meesho...');
      const research = await GeminiService.researchCrossPlatform(metadata.suggestedName);
      setResearchData(research);
      
      // Auto-switch to Research Tab
      setActiveTab(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setLoadingStep('Merging Listings & Refining Tones...');
    try {
      const listing = await GeminiService.generateFullListing(details, researchData?.mergedMaster);
      setFinalListing(listing);
      setActiveTab(3);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            CopyCraft <span className="text-indigo-600">Cross-Platform</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingStep}
            </div>
          )}
          <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500" 
              style={{ width: `${(activeTab + 1) * 20}%` }}
            />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-8 flex gap-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all font-semibold text-sm whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 0 && (
          <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
              {previewImage ? (
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-100 group">
                  <img src={previewImage} className="w-full h-full object-contain bg-slate-50" alt="Product" />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="font-bold">Replace Product Image</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              ) : (
                <label className="w-full h-full border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-12 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="bg-indigo-100 p-6 rounded-[24px] text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                    <Camera className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Step 1: Visual Audit</h3>
                  <p className="text-slate-500 text-center mt-3 max-w-sm font-medium">
                    Upload your product photo. Gemini will identify the item and begin cross-platform research immediately.
                  </p>
                  <input type="file" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 h-full">
                <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Visual Intelligence
                </h2>
                {visionData ? (
                  <div className="space-y-8">
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest block mb-1">Generated SEO Title</span>
                      <h4 className="text-lg font-bold text-indigo-900">{visionData.suggestedName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { l: 'Type', v: visionData.garmentType },
                        { l: 'Texture', v: visionData.fabricTexture },
                        { l: 'Pattern', v: visionData.pattern },
                        { l: 'Neckline', v: visionData.neckline },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-1">{item.l}</span>
                          <span className="text-sm font-bold text-slate-700">{item.v || 'Generic'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                      <p className="text-xs text-slate-400 font-medium italic">
                        Research will begin automatically based on this detection...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                    <Layout className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-medium">No detection results yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Cross-Platform Comparison</h2>
                  <p className="text-slate-500 font-medium">Synced research from top e-commerce destinations.</p>
                </div>
                <div className="flex gap-2">
                  {researchData?.commonKeywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {researchData ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {researchData.listings.map((listing, i) => (
                    <div key={i} className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex flex-col group hover:shadow-lg hover:bg-white transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100">
                            <Store className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-black text-slate-800 text-sm tracking-tight">{listing.platform}</span>
                        </div>
                        {listing.price && <span className="text-indigo-600 font-black text-sm">{listing.price}</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2 line-clamp-1">{listing.title}</h4>
                      <div className="flex-1 text-[11px] text-slate-500 leading-relaxed mb-6 overflow-hidden line-clamp-6">
                        {listing.description}
                      </div>
                      {listing.url && (
                        <a href={listing.url} target="_blank" className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                          View Listing <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-slate-200 animate-spin mb-4" />
                  <p className="text-slate-400 font-medium">Aggregating platform data...</p>
                </div>
              )}

              {researchData && (
                <div className="mt-12 pt-10 border-t border-slate-100">
                  <div className="bg-indigo-600 rounded-[32px] p-10 text-white shadow-2xl shadow-indigo-200">
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="w-6 h-6" />
                      <h3 className="text-xl font-black">AI-Merged Master Copy</h3>
                    </div>
                    <p className="text-indigo-100 leading-relaxed text-sm italic mb-8">
                      "We've analyzed all the platform listings above and merged the high-converting phrases into this master description."
                    </p>
                    <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-sm font-medium mb-10">
                      {researchData.mergedMaster}
                    </div>
                    <button 
                      onClick={() => setActiveTab(2)}
                      className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                    >
                      Refine Specs & Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-indigo-600" />
                Technical Specification
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(details).map((key) => (
                  <div key={key}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={(details as any)[key]}
                      onChange={e => setDetails({...details, [key]: e.target.value})}
                      placeholder={`Enter ${key}...`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-12 flex gap-4">
                <button 
                  onClick={() => setActiveTab(1)}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition"
                >
                  Back to Platforms
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading || !details.name}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  Generate Professional Listing <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {finalListing ? (
              <>
                <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-fit mx-auto gap-1">
                  {(['casual', 'professional', 'luxurious'] as const).map(tone => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={`px-10 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
                        selectedTone === tone 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
                          <FileText className="w-6 h-6 text-indigo-600" /> Description
                        </h3>
                        <button onClick={() => copyToClipboard(finalListing[selectedTone].description)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition">
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-slate-600 leading-loose text-base whitespace-pre-wrap font-medium">
                        {finalListing[selectedTone].description}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-slate-800">
                          <Package className="w-6 h-6 text-indigo-600" /> Care & Quality
                        </h3>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">{finalListing[selectedTone].fabricCare}</p>
                      </div>
                      <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-slate-800">
                          <Download className="w-6 h-6 text-indigo-600" /> Shipping Info
                        </h3>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">{finalListing[selectedTone].shipping}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4 bg-slate-900 rounded-[40px] p-10 shadow-2xl text-white">
                    <h3 className="text-xl font-black mb-10 flex items-center gap-3 border-b border-white/10 pb-6">
                      <Layout className="w-6 h-6 text-indigo-400" /> Attributes
                    </h3>
                    <div className="space-y-6">
                      {Object.entries(finalListing[selectedTone].moreInfo).map(([k, v], i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{k}</span>
                          <span className="text-sm font-bold text-slate-200">{v || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab(4)}
                      className="w-full mt-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/40"
                    >
                      Finalize Export <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-40 text-center flex flex-col items-center justify-center">
                <Zap className="w-20 h-20 text-indigo-100 mb-6" />
                <p className="text-slate-400 font-black text-xl">Ready for final generation.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <h2 className="text-3xl font-black mb-4">Export Assets</h2>
              <p className="text-slate-500 font-medium mb-12">Choose your preferred format for the {selectedTone} listing.</p>
              
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-800 flex items-center gap-3"><FileCode className="w-5 h-5 text-indigo-600" /> JSON Object</h4>
                    </div>
                    <pre className="text-[11px] text-slate-500 h-64 overflow-y-auto no-scrollbar font-mono leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
                      {JSON.stringify(finalListing, null, 2)}
                    </pre>
                  </div>
                  <button className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                    Download Manifest
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-800 flex items-center gap-3"><Layout className="w-5 h-5 text-indigo-600" /> HTML Preview</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64 overflow-y-auto text-xs prose prose-slate">
                      <h2 className="text-indigo-600">{details.name}</h2>
                      <p className="font-bold">{finalListing?.[selectedTone].description}</p>
                      <hr/>
                      <ul className="text-[10px] list-none p-0">
                        {finalListing?.[selectedTone].moreInfo && Object.entries(finalListing[selectedTone].moreInfo).map(([k,v], i) => (
                          <li key={i} className="mb-1"><strong>{k}:</strong> {v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                    Copy HTML to Clipboard
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-8">
              <button 
                onClick={() => window.location.reload()}
                className="text-slate-400 hover:text-indigo-600 font-black text-sm transition flex items-center gap-2 mx-auto uppercase tracking-widest"
              >
                Start New Project <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white p-10">
          <div className="bg-white p-12 rounded-[48px] shadow-2xl flex flex-col items-center max-w-sm text-center border border-white/50 animate-in zoom-in duration-300">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
              <div className="relative bg-indigo-600 p-8 rounded-full shadow-2xl shadow-indigo-200">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-slate-900 text-3xl font-black mb-4 tracking-tight">AI Orchestrator</h2>
            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-6">
              {loadingStep || 'Synchronizing platform intelligence...'}
            </p>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
