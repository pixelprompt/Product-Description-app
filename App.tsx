
import React, { useState, useMemo, useRef } from 'react';
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
  FileText,
  FileDown,
  CheckCircle,
  AlertCircle,
  Truck,
  Waves,
  ShieldCheck,
  Check,
  Globe,
  Filter,
  Plus,
  Trash2,
  RefreshCcw,
  X,
  Upload,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  ProductDetails, 
  ProductMetadata, 
  FullListing, 
  CrossPlatformResearch,
  PlatformListing,
  MatchResult
} from './types';
import { GeminiService } from './geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'priceLow'>('relevance');
  
  // Vision Tab State
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string, base64: string, type: string, name: string }[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visionData, setVisionData] = useState<ProductMetadata | null>(null);
  const [researchData, setResearchData] = useState<CrossPlatformResearch | null>(null);
  const [details, setDetails] = useState<ProductDetails>({
    name: '', brand: '', category: '', fabric: '', colors: '', price: '',
    dimensions: '', itemsIncluded: '1 Main Unit', styleCode: '', topType: '', bottomType: '',
    pattern: '', occasion: '', size: 'Standard', sleeveLength: '', neck: '',
    fabricCare: 'Normal Wash', shippingDays: '3-5 Days'
  });
  const [finalListing, setFinalListing] = useState<FullListing | null>(null);
  const [selectedTone, setSelectedTone] = useState<'casual' | 'professional' | 'luxurious'>('professional');

  const tabs = [
    { id: 0, label: 'Vision', icon: Camera },
    { id: 1, label: 'Research', icon: ArrowRightLeft },
    { id: 2, label: 'Specs', icon: ClipboardList },
    { id: 3, label: 'Generate', icon: Zap },
    { id: 4, label: 'Export', icon: Download },
  ];

  const sortedListings = useMemo(() => {
    if (!researchData) return [];
    const list = [...researchData.listings];
    if (sortBy === 'priceLow') {
      return list.sort((a, b) => {
        const p1 = a.numericPrice || 0;
        const p2 = b.numericPrice || 0;
        return p1 - p2;
      });
    }
    return list;
  }, [researchData, sortBy]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validateFiles = (files: File[]): { valid: File[], errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 30 * 1024 * 1024; // 30MB

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File "${file.name}": Unsupported format (Use JPG, PNG, or WebP)`);
      } else if (file.size > maxSize) {
        errors.push(`File "${file.name}": Too large (Exceeds 30MB)`);
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setFileErrors([]);
    setErrorMessage(null);
    
    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);
    
    if (errors.length > 0) {
      setFileErrors(errors);
    }

    if (valid.length === 0) return;

    const remainingSlots = 5 - uploadedFiles.length;
    const filesToProcess = valid.slice(0, remainingSlots);

    if (valid.length > remainingSlots) {
      setFileErrors(prev => [...prev, `Only first 5 valid images were accepted.`]);
    }

    const newUploadedFiles = [...uploadedFiles];
    
    for (const file of filesToProcess) {
      const base64 = await GeminiService.fileToBase64(file);
      newUploadedFiles.push({
        url: URL.createObjectURL(file),
        base64,
        type: file.type,
        name: file.name
      });
    }

    setUploadedFiles(newUploadedFiles);
    setMatchResult(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const updated = [...uploadedFiles];
    URL.revokeObjectURL(updated[index].url);
    updated.splice(index, 1);
    setUploadedFiles(updated);
    setMatchResult(null);
    setFileErrors([]);
  };

  // Fixed the variable scoping error here by declaring analysisResult outside the try block.
  const runAnalysis = async () => {
    if (uploadedFiles.length === 0) return;
    setIsLoading(true);
    setLoadingStep('Checking product consistency...');
    setErrorMessage(null);
    
    let analysisResult: MatchResult | null = null;
    try {
      analysisResult = await GeminiService.analyzeBatch(uploadedFiles.map(f => ({ data: f.base64, type: f.type })));
      setMatchResult(analysisResult);
      
      if (analysisResult.isMatch && analysisResult.mergedMetadata) {
        const metadata = analysisResult.mergedMetadata;
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

        // PAUSE FOR FEEDBACK - USER NEEDS TO SEE THE MATCH
        setLoadingStep('Success! Product match confirmed.');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // AUTO-SWITCH TO RESEARCH TAB
        setActiveTab(1);
        setLoadingStep('Searching Amazon, Flipkart, Myntra, ASOS, Zara & more...');
        
        const research = await GeminiService.researchCrossPlatform(metadata.suggestedName);
        setResearchData(research);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please try again.');
      setIsLoading(false);
    } finally {
      // Corrected to use analysisResult which is now available in this scope.
      if (!analysisResult?.isMatch) {
        setIsLoading(false);
        setLoadingStep('');
      } else {
        // We keep loading active during research if we haven't finished yet
        // This is handled by the try/catch logic above
        setIsLoading(false);
        setLoadingStep('');
      }
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setLoadingStep('Synthesizing Master Draft & Tones...');
    try {
      const listing = await GeminiService.generateFullListing(details, researchData?.mergedMaster);
      setFinalListing(listing);
      setActiveTab(3);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to generate final listing.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const downloadAsFile = (format: 'txt' | 'md') => {
    if (!finalListing) return;
    const content = finalListing[selectedTone];
    const fileName = `listing-${details.name.replace(/\s+/g, '-').toLowerCase()}-${selectedTone}.${format}`;
    
    let text = '';
    if (format === 'md') {
      text = `# ${details.name}\n\n`;
      text += `**Tone:** ${selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)}\n\n`;
      text += `## Description\n${content.description}\n\n`;
      text += `## Care Instructions\n${content.fabricCare}\n\n`;
      text += `## Shipping Information\n${content.shipping}\n\n`;
      text += `## Product Specifications\n`;
      Object.entries(details).forEach(([key, value]) => {
        if (value) text += `- **${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:** ${value}\n`;
      });
    } else {
      text = `${details.name.toUpperCase()}\n`;
      text += `Tone: ${selectedTone.toUpperCase()}\n\n`;
      text += `DESCRIPTION:\n${content.description}\n\n`;
      text += `CARE INSTRUCTIONS:\n${content.fabricCare}\n\n`;
      text += `SHIPPING:\n${content.shipping}\n\n`;
      text += `SPECIFICATIONS:\n`;
      Object.entries(details).forEach(([key, value]) => {
        if (value) text += `${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        {(errorMessage || fileErrors.length > 0) && (
          <div className="mb-6 space-y-2 animate-in slide-in-from-top-4">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 shadow-sm">
                <AlertCircle className="shrink-0" />
                <p className="font-bold text-sm">{errorMessage}</p>
              </div>
            )}
            {fileErrors.map((err, i) => (
              <div key={i} className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-3 shadow-sm">
                <AlertTriangle className="shrink-0 w-4 h-4" />
                <p className="font-semibold text-xs">{err}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 0 && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Multi-Angle Vision Analysis</h2>
                <p className="text-slate-500 font-medium italic">Upload up to 5 images of the same product for maximum accuracy.</p>
              </div>

              <div className="flex flex-col items-center mb-12">
                <label 
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50', 'border-indigo-400'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-400'); }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-400'); handleFiles(e.dataTransfer.files); }}
                  className={`w-full max-w-2xl border-2 border-dashed border-slate-200 rounded-[32px] p-12 flex flex-col items-center justify-center transition-all cursor-pointer group hover:bg-indigo-50/50 hover:border-indigo-300 ${uploadedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="bg-indigo-100 p-6 rounded-[24px] text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Select Product Images</h3>
                  <p className="text-slate-400 text-sm font-medium text-center">Drag and drop 5 images or click to select from device<br/>(JPG, PNG, WebP - Max 30MB per image)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    hidden 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFiles(e.target.files)} 
                    disabled={uploadedFiles.length >= 5}
                  />
                </label>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {uploadedFiles.length} of 5 uploaded
                    </span>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: `${(uploadedFiles.length / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <button 
                      onClick={() => {
                        uploadedFiles.forEach(f => URL.revokeObjectURL(f.url));
                        setUploadedFiles([]);
                        setMatchResult(null);
                        setFileErrors([]);
                      }}
                      className="text-xs font-black text-red-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <RefreshCcw size={12} /> Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[0, 1, 2, 3, 4].map(idx => {
                    const file = uploadedFiles[idx];
                    const isMismatched = matchResult?.mismatchedIndices.includes(idx);
                    return (
                      <div key={idx} className="relative aspect-[3/4] animate-in zoom-in-95 duration-300">
                        {file ? (
                          <div className={`w-full h-full rounded-2xl overflow-hidden border-4 transition-all shadow-sm ${isMismatched ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : matchResult?.isMatch ? 'border-emerald-500' : 'border-white bg-white'}`}>
                            <img src={file.url} className="w-full h-full object-cover" alt={`View ${idx + 1}`} />
                            <button 
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-red-500 transition-colors z-10"
                            >
                              <X size={14} />
                            </button>
                            {isMismatched && (
                              <div className="absolute inset-0 bg-red-500/10 pointer-events-none flex items-end justify-center pb-4">
                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shadow-lg">Mismatched</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center bg-slate-50/50">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Empty Slot</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-12 flex flex-col items-center">
                <button 
                  disabled={uploadedFiles.length === 0 || isLoading || fileErrors.length > 0}
                  onClick={runAnalysis}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white rounded-[24px] font-black text-sm shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Check Matching & Proceed
                </button>
                {fileErrors.length > 0 && (
                  <p className="mt-4 text-[10px] text-amber-600 font-bold uppercase tracking-widest">Fix errors to proceed</p>
                )}
              </div>

              {matchResult && !matchResult.isMatch && (
                <div className="mt-10 p-6 bg-red-50 border border-red-100 rounded-[32px] animate-in slide-in-from-bottom-2">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500 p-2 rounded-xl text-white">
                      <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-red-900 tracking-tight uppercase text-sm">Images Don't Match</h4>
                      <p className="text-red-700/80 text-xs font-medium italic">{matchResult.reason}</p>
                      <button 
                        onClick={() => {
                          const validOnes = uploadedFiles.filter((_, idx) => !matchResult.mismatchedIndices.includes(idx));
                          setUploadedFiles(validOnes);
                          setMatchResult(null);
                        }}
                        className="mt-4 text-[10px] font-black uppercase text-red-600 border-b border-red-600 hover:text-red-800 hover:border-red-800 transition-colors"
                      >
                        Remove Mismatched & Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {matchResult?.isMatch && (
                <div className="mt-10 p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] animate-in slide-in-from-bottom-2">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500 p-2 rounded-xl text-white">
                      <CheckCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-emerald-900 tracking-tight uppercase text-sm">All Images Match Perfectly!</h4>
                        <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black">Confidence: {matchResult.confidence}%</span>
                      </div>
                      <p className="text-emerald-700/80 text-xs font-medium italic">{matchResult.reason}</p>
                      <p className="text-emerald-600 text-[10px] font-black uppercase mt-2 animate-pulse">Auto-triggering marketplace research...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-3">
                    <Globe className="text-indigo-600" /> Unlimited Marketplace Research
                  </h2>
                  <p className="text-slate-500 font-medium italic">
                    {researchData ? `Found on ${researchData.listings.length} Global Websites` : "Deep-search scanning Amazon, Flipkart, Myntra, ASOS, Zara & more..."}
                  </p>
                </div>
                
                {researchData && (
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <Filter className="w-4 h-4 text-slate-400 ml-2" />
                    <button 
                      onClick={() => setSortBy('relevance')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'relevance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      Relevance
                    </button>
                    <button 
                      onClick={() => setSortBy('priceLow')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'priceLow' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      Price: Low to High
                    </button>
                  </div>
                )}
              </div>

              {isLoading && !researchData ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="relative mb-8">
                    <Globe className="w-16 h-16 text-indigo-100 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin absolute top-0 left-0" />
                  </div>
                  <p className="text-slate-400 font-black text-lg">Scanning the entire web for matches...</p>
                  <p className="text-slate-300 text-sm mt-2 italic">Fetching listings from Amazon, Flipkart, Nykaa, Zara & global platforms...</p>
                </div>
              ) : researchData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in">
                  {sortedListings.map((listing, i) => (
                    <div key={i} className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 flex flex-col hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group min-h-[280px]">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[10px]">
                              {listing.platform.charAt(0)}
                           </div>
                           <span className="font-black text-indigo-600 text-sm tracking-tight">{listing.platform}</span>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{listing.price || 'Market Rate'}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mb-3 line-clamp-2 leading-tight uppercase tracking-tight">{listing.title}</h4>
                      <p className="flex-1 text-[11px] text-slate-500 leading-relaxed mb-6 line-clamp-4 italic">
                        "{listing.description}"
                      </p>
                      {listing.url && (
                        <a href={listing.url} target="_blank" rel="noreferrer" className="w-full py-3 bg-white border border-slate-200 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-black shadow-sm group-hover:border-transparent">
                          View Listing <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-300">
                   <Store size={48} className="mx-auto mb-4 opacity-10" />
                   <p className="font-bold text-sm">Upload matched images to trigger cross-platform research.</p>
                </div>
              )}

              {researchData && (
                <div className="mt-12 bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl animate-in relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={120} />
                  </div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="bg-indigo-600 p-2 rounded-xl">
                       <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">Synthesized Master Draft</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Combined Intelligence from {researchData.listings.length} sources</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-3xl p-8 border border-white/10 text-sm font-medium mb-8 whitespace-pre-wrap leading-relaxed relative z-10 italic text-slate-300">
                    {researchData.mergedMaster}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <button onClick={() => setActiveTab(2)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 border border-white/10">
                      Review & Refine Specs <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={handleGenerate} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/40">
                      Proceed to Content Generation <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
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
          <div className="max-w-[1300px] mx-auto animate-in fade-in space-y-8 pb-12">
            <div className="flex justify-center">
              <div className="inline-flex bg-white p-2 rounded-[28px] shadow-sm border border-slate-200">
                {(['casual', 'professional', 'luxurious'] as const).map(tone => (
                  <button 
                    key={tone} 
                    onClick={() => setSelectedTone(tone)} 
                    className={`px-10 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      selectedTone === tone 
                        ? 'bg-indigo-600 text-white shadow-xl scale-105' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Product Description</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedTone} Tone Optimization</p>
                    </div>
                    <button 
                      onClick={() => handleCopy(finalListing[selectedTone].description, 'desc')} 
                      className="p-3 bg-slate-50 rounded-2xl text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-2"
                    >
                      {copiedId === 'desc' ? <Check size={18} /> : <Copy size={18} />}
                      <span className="text-[10px] font-black uppercase">Copy</span>
                    </button>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-[1.8] font-medium text-lg whitespace-pre-wrap">
                      {finalListing[selectedTone].description}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100 relative group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-4 rounded-3xl text-blue-600">
                        <Waves size={24} />
                      </div>
                      <h3 className="text-xl font-black text-slate-800">Care & Quality</h3>
                    </div>
                    <button 
                      onClick={() => handleCopy(finalListing[selectedTone].fabricCare, 'care')} 
                      className="p-3 bg-slate-50 rounded-2xl text-indigo-600 hover:bg-indigo-100 transition-all"
                    >
                      {copiedId === 'care' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Maintenance</span>
                      <p className="text-slate-600 font-bold leading-relaxed">
                        {finalListing[selectedTone].fabricCare}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                      <ShieldCheck className="text-indigo-600 shrink-0" size={32} />
                      <p className="text-xs font-bold text-slate-500">
                        Professional dry cleaning recommended for longevity and color preservation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600">
                      <Truck size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Shipping Info</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tight">5-7</span>
                        <span className="text-lg font-bold text-slate-500 uppercase tracking-widest">Business Days</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Complimentary nationwide shipping included.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                        <Check size={14} strokeWidth={4} /> Fully Insured
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                        <Check size={14} strokeWidth={4} /> Premium Packaging
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                        <Check size={14} strokeWidth={4} /> Priority Dispatch
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-[#0f172a] rounded-[48px] p-10 shadow-2xl sticky top-24 border border-white/10 flex flex-col min-h-[700px]">
                  <h3 className="text-white text-xl font-black mb-10 flex items-center gap-3">
                    <Package className="text-indigo-400" /> Attributes Panel
                  </h3>
                  
                  <div className="flex-1 space-y-6 overflow-y-auto pr-2 no-scrollbar">
                    {[
                      { label: 'Items Included', value: details.itemsIncluded },
                      { label: 'Brand', value: details.brand || 'Premium Unbranded' },
                      { label: 'Fabric Type', value: details.fabric },
                      { label: 'Style Code', value: details.styleCode || 'N/A' },
                      { label: 'Colors', value: details.colors },
                      { label: 'Size', value: details.size },
                      { label: 'Sleeve Length', value: details.sleeveLength },
                      { label: 'Neckline', value: details.neck },
                      { label: 'Pattern', value: details.pattern },
                      { label: 'Dress Supersoft', value: details.fabric.toLowerCase().includes('soft') ? 'Yes' : 'High Density' },
                      { label: 'Fabric Care', value: details.fabricCare },
                      { label: 'Shipping Days', value: details.shippingDays },
                    ].map((attr, idx) => (
                      <div key={idx} className="border-b border-white/5 pb-4 group">
                        <span className="text-[10px] font-black uppercase text-indigo-400/60 tracking-widest block mb-1.5 group-hover:text-indigo-400 transition-colors">
                          {attr.label}
                        </span>
                        <span className="text-white font-bold text-sm tracking-tight opacity-90 block truncate">
                          {attr.value || 'Not Specified'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveTab(4)}
                    className="mt-10 w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[32px] font-black text-sm shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    Proceed to Export <Download size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="max-w-4xl mx-auto animate-in fade-in space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ready for Launch</h2>
              <p className="text-slate-500 font-medium italic">Download your optimized listings for direct upload to marketplaces.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                    <FileText className="text-indigo-600" /> Export Preview
                  </h3>
                  {finalListing ? (
                    <div className="space-y-4 animate-in">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                         <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-2">Description</span>
                         <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-[12]">
                           {finalListing[selectedTone].description}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Care</span>
                          <p className="text-[10px] font-bold text-slate-600 truncate">{finalListing[selectedTone].fabricCare}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Shipping</span>
                          <p className="text-[10px] font-bold text-slate-600 truncate">{finalListing[selectedTone].shipping}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                      <FileCode size={48} className="opacity-10 mb-4" />
                      <p className="font-medium text-sm">No listing generated yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 h-fit">
                   <h3 className="text-lg font-black mb-6">Choose Format</h3>
                   <div className="space-y-3">
                      <button 
                        onClick={() => downloadAsFile('txt')}
                        disabled={!finalListing}
                        className="w-full group py-4 px-6 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-2xl font-black text-sm transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <FileDown size={20} />
                          Plain Text (.txt)
                        </div>
                        <ChevronRight size={16} className="opacity-40 group-hover:opacity-100" />
                      </button>
                      
                      <button 
                        onClick={() => downloadAsFile('md')}
                        disabled={!finalListing}
                        className="w-full group py-4 px-6 bg-slate-50 hover:bg-slate-900 text-slate-900 hover:text-white rounded-2xl font-black text-sm transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <FileCode size={20} />
                          Markdown (.md)
                        </div>
                        <ChevronRight size={16} className="opacity-40 group-hover:opacity-100" />
                      </button>
                   </div>

                   <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <div className="flex items-center gap-2 mb-2 text-indigo-600">
                         <CheckCircle size={16} />
                         <span className="text-xs font-black uppercase">Pro-Tip</span>
                      </div>
                      <p className="text-[10px] text-indigo-700/70 font-bold leading-relaxed">
                        Markdown is best for platforms that support formatting like Shopify, while TXT is perfect for Amazon/Flipkart basic descriptions.
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl flex flex-col items-center max-w-sm text-center animate-in scale-in duration-300">
            <div className="bg-indigo-600 p-6 rounded-full shadow-2xl mb-6">
              <Globe className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className="text-slate-900 text-2xl font-black mb-2 tracking-tight">Intelligence Workflow</h2>
            <p className="text-slate-500 text-sm font-bold mb-6">{loadingStep}</p>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
