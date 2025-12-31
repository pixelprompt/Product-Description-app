
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
  CrossPlatformResearch
} from './types';
import { GeminiService } from './geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
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
    { id: 1, label: 'Cross-Platform Listings', icon: ArrowRightLeft },
    { id: 2, label: 'Product Specs', icon: ClipboardList },
    { id: 3, label: 'Generate', icon: Zap },
    { id: 4, label: 'Export', icon: Download },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
    setIsLoading(true);
    setLoadingStep('Analysing with Gemini Vision...');
    
    try {
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

      // AUTOMATIC TRANSITION TO RESEARCH
      setActiveTab(1);
      setLoadingStep('Auto-Searching: Amazon, Flipkart, Meesho, Ajio, Myntra, Shein...');
      const research = await GeminiService.researchCrossPlatform(metadata.suggestedName);
      setResearchData(research);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setLoadingStep('Synthesizing Master Draft & Tones...');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            ListingAI <span className="text-indigo-600">Cross-Platform</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingStep}
            </div>
          )}
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-8 flex gap-8 overflow-x-auto no-scrollbar shadow-sm">
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

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 0 && (
          <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
              {previewImage ? (
                <div className="relative w-full h-full rounded-3xl overflow-hidden group">
                  <img src={previewImage} className="w-full h-full object-contain bg-slate-50" alt="Product" />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="font-bold">Change Image</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              ) : (
                <label className="w-full h-full border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-12 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="bg-indigo-100 p-6 rounded-[24px] text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                    <Camera className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Upload Product</h3>
                  <p className="text-slate-500 text-center mt-3 max-w-sm font-medium italic">
                    Automated research will trigger after upload.
                  </p>
                  <input type="file" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
                <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-indigo-600" /> Intelligence Dashboard
                </h2>
                {visionData ? (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest block mb-1">Detected Product</span>
                      <h4 className="text-lg font-bold text-indigo-900">{visionData.suggestedName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(visionData).filter(([k]) => k !== 'suggestedName').map(([k, v], i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-1">{k}</span>
                          <span className="text-xs font-bold text-slate-700 truncate block">{Array.isArray(v) ? v.join(', ') : v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-300">
                    <Layout className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-medium">Upload an image to see detection data.</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Cross-Platform Comparison</h2>
              <p className="text-slate-500 font-medium mb-10 italic">Automatic aggregation from Amazon, Flipkart, Meesho, Ajio, Myntra, & Shein.</p>

              {researchData ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {researchData.listings.map((listing, i) => (
                    <div key={i} className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 flex flex-col hover:bg-white transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-indigo-600 text-sm tracking-tight">{listing.platform}</span>
                        <span className="text-slate-400 font-black text-sm">{listing.price || 'Market Rate'}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2 line-clamp-1">{listing.title}</h4>
                      <p className="flex-1 text-[11px] text-slate-500 leading-relaxed mb-6 line-clamp-5 italic">
                        "{listing.description}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-indigo-200 animate-spin mb-4" />
                  <p className="text-slate-400 font-medium">Auto-searching marketplaces...</p>
                </div>
              )}

              {researchData && (
                <div className="mt-12 bg-indigo-600 rounded-[32px] p-10 text-white shadow-2xl shadow-indigo-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6" />
                    <h3 className="text-xl font-black">Merged Master Copy</h3>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-sm font-medium mb-8 whitespace-pre-wrap leading-relaxed">
                    {researchData.mergedMaster}
                  </div>
                  <button onClick={() => setActiveTab(2)} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                    Review Specs <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="max-w-5xl mx-auto animate-in fade-in">
            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-3 text-slate-800">
                <ClipboardList className="w-6 h-6 text-indigo-600" /> Specification Details
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(details).map((key) => (
                  <div key={key}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={(details as any)[key]}
                      onChange={e => setDetails({...details, [key]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-12 flex gap-4">
                <button onClick={handleGenerate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                  Generate Tone-Specific Content <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && finalListing && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-fit mx-auto gap-1">
                {(['casual', 'professional', 'luxurious'] as const).map(tone => (
                  <button key={tone} onClick={() => setSelectedTone(tone)} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${selectedTone === tone ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tone}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800">Final Optimized Listing</h3>
                    <button onClick={() => navigator.clipboard.writeText(finalListing[selectedTone].description)} className="p-3 bg-slate-50 rounded-xl text-indigo-600 hover:bg-indigo-50 transition">
                      <Copy size={20} />
                    </button>
                 </div>
                 <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                   {finalListing[selectedTone].description}
                 </p>
                 <button onClick={() => setActiveTab(4)} className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                   Go to Export <Download size={18} />
                 </button>
              </div>
          </div>
        )}
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl flex flex-col items-center max-w-sm text-center">
            <div className="bg-indigo-600 p-6 rounded-full shadow-2xl mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-slate-900 text-2xl font-black mb-2">Automating Workflow</h2>
            <p className="text-slate-500 text-sm font-bold mb-6">{loadingStep}</p>
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
