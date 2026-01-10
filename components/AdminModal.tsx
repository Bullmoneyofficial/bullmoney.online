"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, X, LogOut, Trash2, Plus, Loader2, 
  Edit2, Upload, ImageIcon, AlertCircle, Link as LinkIcon, 
  FileText, Layers, Grid, Share2, Video, DollarSign, Clock, Wrench, RefreshCw,
  Users, Search, CheckCircle2, HelpCircle, ChevronRight, LayoutDashboard, ChevronDown
} from "lucide-react";

// --- CONTEXT ---
import { useStudio, type ProjectFormData, type ServiceItem } from "@/context/StudioContext"; 

// --- ERGONOMIC UI COMPONENTS ---

const HelpTooltip = ({ text, active, side = "top" }: { text: string, active: boolean, side?: "top" | "bottom" | "left" | "right" }) => {
  if (!active) return null;
  const positionClasses = {
      top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
      bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
      left: "right-full mr-3 top-1/2 -translate-y-1/2",
      right: "left-full ml-3 top-1/2 -translate-y-1/2"
  };
  return (
    <motion.div 
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
        className={`absolute z-[50] w-48 p-3 bg-blue-600 text-white text-[12px] font-medium leading-snug rounded-xl shadow-xl border-2 border-blue-400 pointer-events-none ${positionClasses[side]}`}
    >
        <div className="flex items-start gap-2">
            <HelpCircle size={16} className="mt-0.5 shrink-0 text-blue-200 fill-blue-800" />
            <span>{text}</span>
        </div>
        <div className={`absolute w-3 h-3 bg-blue-600 rotate-45 border-r border-b border-blue-400 ${side === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''} ${side === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2 border-t border-l border-transparent border-r-0 border-b-0 bg-blue-600 border-blue-400' : ''}`} />
    </motion.div>
  );
};

// FIX: Hidden label on mobile (hidden md:block) to save horizontal space
const NavPill = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200 w-full ${active ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]" : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"}`}>
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold uppercase tracking-wide hidden md:block">{label}</span>
  </button>
);

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
  <div className="mb-6 flex items-center gap-4">
    <div className="h-10 w-1 bg-amber-500 rounded-full shrink-0" />
    <div>
      <h3 className="text-white font-bold text-xl tracking-tight">{title}</h3>
      <p className="text-neutral-500 text-xs">{sub}</p>
    </div>
  </div>
);

const InputGroup = ({ label, children, className, helpText, helpActive }: { label: string; children: React.ReactNode, className?: string, helpText?: string, helpActive?: boolean }) => (
  <div className={`mb-5 relative ${className}`}>
    <label className="mb-2 block text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">{label}</label>
    {children}
    {helpText && <HelpTooltip active={!!helpActive} text={helpText} side="top" />}
  </div>
);

// --- 1. LOGIN SCREEN ---
function AdminLogin() {
  const { login } = useStudio();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await login(email.trim().toLowerCase(), password.trim());
    if (!result.success) {
      setError(result.msg || "Credenciais inválidas.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-4 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl relative z-[1000]" onClick={(e) => e.stopPropagation()}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-[50px] pointer-events-none" />
      <div className="p-8 relative z-10 flex flex-col items-center">
        <div className="mb-6"><div className="inline-flex p-3 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-lg"><Sparkles className="h-6 w-6 text-amber-500 fill-amber-500/20" /></div></div>
        <h2 className="font-serif text-2xl text-white mb-1">Bem-vinda</h2>
        <p className="text-neutral-400 text-xs uppercase tracking-widest mb-8">Painel Administrativo</p>
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-neutral-500 ml-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-login" placeholder="admin@studio.com" autoFocus />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-neutral-500 ml-1 block">Senha</label>
             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-login" placeholder="••••••••" />
          </div>
          {error && <div className="flex items-center justify-center gap-2 text-red-400 text-xs bg-red-950/30 p-3 rounded-lg border border-red-900/50 mt-2"><span className="font-bold">Erro:</span> {error}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold h-12 rounded-xl mt-6 hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
            {isLoading ? <Loader2 className="animate-spin h-5 w-5 text-black" /> : "ENTRAR"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- 2. DASHBOARD ---
function Dashboard({ onClose }: { onClose: () => void }) {
  const { 
    state, logout, uploadFile,
    updateHero, updateAbout,
    addProject, updateProject, deleteProject,
    addServiceCategory, deleteServiceCategory,
    addServiceItem, updateServiceItem, deleteServiceItem,
    addGalleryItem, deleteGalleryItem,
    updateSocialLink,
    searchUserByEmail, updateUserLoyalty, fetchAllLoyaltyUsers
  } = useStudio();

  const [activeTab, setActiveTab] = useState<"hero" | "about" | "services" | "portfolio" | "gallery" | "socials" | "loyalty">("hero");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isUploading, setIsUploading] = useState(false);
  const [helpMode, setHelpMode] = useState(false);

  // Forms
  const [heroForm, setHeroForm] = useState(state.hero);
  const [aboutForm, setAboutForm] = useState(state.about);
  const initialProject: ProjectFormData = { title: "", thumbnail: "", description: "", price: "", duration: "", technique: "", link: "" };
  const [projectForm, setProjectForm] = useState<ProjectFormData>(initialProject);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  // Services State
  const [newCatName, setNewCatName] = useState("");
  const initialServiceItem: Partial<ServiceItem> = { name: "", price: "", detail_type: "", detail_time: "", detail_includes: "", image_url: "" };
  const [serviceForm, setServiceForm] = useState<Partial<ServiceItem>>(initialServiceItem);
  const [activeCatId, setActiveCatId] = useState<number | null>(null); 
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null); 

  // Loyalty State
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [loyaltyUser, setLoyaltyUser] = useState<any>(null);
  const [loyaltyMsg, setLoyaltyMsg] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [allLoyaltyUsers, setAllLoyaltyUsers] = useState<any[]>([]);
  const [isFetchingAllUsers, setIsFetchingAllUsers] = useState(false);

  useEffect(() => {
    if(state.hero) setHeroForm({ ...state.hero, hero_images: state.hero.hero_images || [], beam_text_1: state.hero.beam_text_1 || "", beam_text_2: state.hero.beam_text_2 || "", beam_text_3: state.hero.beam_text_3 || "" });
    if(state.about) setAboutForm(state.about);
  }, [state.hero, state.about]);
  
  useEffect(() => {
    if (activeTab === "loyalty" && state.isAdmin) {
        setIsFetchingAllUsers(true);
        fetchAllLoyaltyUsers().then(users => { setAllLoyaltyUsers(users); }).finally(() => setIsFetchingAllUsers(false));
    }
  }, [activeTab, state.isAdmin, fetchAllLoyaltyUsers]);

  const handleSave = async (fn: () => Promise<void>) => {
    setSaveState("saving");
    try { await fn(); setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2000); } 
    catch (e) { setSaveState("idle"); alert("Erro ao salvar"); console.error(e); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    const { url, error } = await uploadFile(e.target.files[0]);
    setIsUploading(false);
    if (url) onSuccess(url);
    else alert(error || "Falha no upload");
  };

  // Logic Helpers
  const addHeroImage = (url: string) => setHeroForm(prev => ({ ...prev, hero_images: [...(prev.hero_images || []), url] }));
  const removeHeroImage = (index: number) => setHeroForm(prev => ({ ...prev, hero_images: prev.hero_images.filter((_, i) => i !== index) }));
  
  const handleUserSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSearchingUser(true); setLoyaltyMsg(""); setLoyaltyUser(null);
      try {
          const cleanEmail = loyaltySearch.trim().toLowerCase(); 
          if (!cleanEmail) { setLoyaltyMsg("Digite um email."); setIsSearchingUser(false); return; }
          const user = await searchUserByEmail(cleanEmail);
          if(user) setLoyaltyUser(user); else setLoyaltyMsg("Usuário não encontrado.");
      } catch(err) { setLoyaltyMsg("Erro ao buscar."); }
      setIsSearchingUser(false);
  };

  const handleUpdateStamps = async (count: number) => {
      if(!loyaltyUser) return;
      await updateUserLoyalty(loyaltyUser.id, count);
      setLoyaltyUser({...loyaltyUser, stamps: count});
      setAllLoyaltyUsers(prev => prev.map(u => u.id === loyaltyUser.id ? {...u, stamps: count} : u));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      // FIX: Ensure it takes full width on mobile
      className="fixed inset-0 md:inset-6 lg:inset-x-[15%] lg:inset-y-[5%] bg-neutral-950 border border-neutral-800 shadow-2xl md:rounded-3xl flex flex-col overflow-hidden z-[1000]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. HEADER BAR */}
      <div className="flex-none h-16 px-4 md:px-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 z-20">
        <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg"><LayoutDashboard size={20} className="text-amber-500"/></div>
            <div>
                <h2 className="text-white font-bold tracking-tight text-sm">Painel</h2>
                <p className="text-neutral-500 text-[10px] uppercase tracking-wider hidden md:block">Modo Admin</p>
            </div>
        </div>
        <div className="flex gap-2 md:gap-3 items-center">
          <button onClick={() => setHelpMode(!helpMode)} className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold transition-all border ${helpMode ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"}`}>
            <HelpCircle size={14} /><span className="hidden md:inline">{helpMode ? "AJUDA ON" : "Ajuda?"}</span>
          </button>
          <div className="h-6 w-px bg-neutral-800 mx-1" />
          <button onClick={() => logout()} title="Sair" className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-900/10 transition-colors"><LogOut size={18} /></button>
          <button onClick={onClose} title="Fechar" className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"><X size={18} /></button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: SPLIT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR NAVIGATION (NARROW ON MOBILE) */}
        {/* FIX: Reduced width on mobile (w-[60px]) to give content more room */}
        <div className="w-[60px] md:w-[100px] bg-neutral-900/50 border-r border-neutral-800 flex-none flex flex-col gap-2 p-2 overflow-y-auto scrollbar-hide">
            <NavPill active={activeTab === "hero"} onClick={() => setActiveTab("hero")} icon={Sparkles} label="Capa" />
            <NavPill active={activeTab === "portfolio"} onClick={() => setActiveTab("portfolio")} icon={ImageIcon} label="Looks" />
            <NavPill active={activeTab === "services"} onClick={() => setActiveTab("services")} icon={Layers} label="Serviços" />
            <NavPill active={activeTab === "loyalty"} onClick={() => setActiveTab("loyalty")} icon={Users} label="Fidelidade" />
            <NavPill active={activeTab === "about"} onClick={() => setActiveTab("about")} icon={FileText} label="Sobre" />
            <NavPill active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} icon={Grid} label="Galeria" />
            <NavPill active={activeTab === "socials"} onClick={() => setActiveTab("socials")} icon={Share2} label="Links" />
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-neutral-950/50">
            {/* === HERO TAB === */}
            {activeTab === "hero" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Capa do Site (Hero)" sub="Personalize a primeira impressão do seu site." />
                <div className="card-section mb-6 relative">
                    <div className="flex justify-between items-center mb-4">
                        <span className="section-label">Imagens de Fundo</span>
                        <div className="relative">
                            <label className="btn-secondary text-[10px] py-1.5 px-3">
                                {isUploading ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />} <span className="hidden md:inline ml-1">Adicionar</span>
                                <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, addHeroImage)} />
                            </label>
                            <HelpTooltip active={helpMode} text="Adicione camadas PNG transparentes para o efeito 3D." side="left" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {heroForm.hero_images && heroForm.hero_images.map((url, idx) => (
                            <div key={idx} className="aspect-[2/3] relative group rounded-xl overflow-hidden bg-black border border-neutral-800">
                                <img src={url} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <button onClick={() => removeHeroImage(idx)} className="text-red-500 bg-white p-2 rounded-full hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                                </div>
                                <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/50 backdrop-blur-md text-white px-2 py-0.5 rounded-md border border-white/10">{idx + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-section space-y-4">
                    <InputGroup label="Título Principal (Headline)" helpText="O texto grande que aparece no centro." helpActive={helpMode}>
                        <input value={heroForm.headline} onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })} className="input-dark text-lg" />
                    </InputGroup>
                    <InputGroup label="Subtítulo">
                        <textarea rows={2} value={heroForm.subheadline} onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })} className="input-dark resize-none" />
                    </InputGroup>
                    <InputGroup label="Texto do Botão">
                        <input value={heroForm.button_text} onChange={(e) => setHeroForm({ ...heroForm, button_text: e.target.value })} className="input-dark" />
                    </InputGroup>
                </div>
                <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent z-10">
                    <button onClick={() => handleSave(() => updateHero(heroForm))} className="w-full btn-primary shadow-2xl relative">
                         {saveState === "saving" ? <Loader2 className="animate-spin" /> : (saveState === "saved" ? "Salvo com Sucesso!" : "Salvar Alterações")}
                    </button>
                </div>
            </div>
            )}

            {/* === PORTFOLIO TAB === */}
            {activeTab === "portfolio" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Portfólio" sub="Gerencie os visuais (Looks) exibidos." />
                <div className={`card-section mb-8 transition-colors ${editingProjectId ? "border-amber-500/50 bg-amber-900/5" : ""}`}>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                         <div className="w-full md:w-28 aspect-square md:h-28 bg-black rounded-xl border border-neutral-700 overflow-hidden relative group shrink-0">
                            {projectForm.thumbnail ? <img src={projectForm.thumbnail} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-neutral-600"><ImageIcon/></div>}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                                <Upload className="text-white mb-1" size={20}/>
                                <span className="text-[9px] text-white font-bold uppercase">Alterar Foto</span>
                                <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, (url) => setProjectForm(p => ({...p, thumbnail: url})))} />
                            </label>
                        </div>
                        <div className="flex-1 space-y-3">
                             <InputGroup label="Nome do Look" className="mb-0">
                                 <input className="input-dark" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} placeholder="Título..." />
                             </InputGroup>
                             <div className="grid grid-cols-2 gap-3">
                                <InputGroup label="Preço" className="mb-0">
                                     <input className="input-dark" value={projectForm.price || ""} onChange={e => setProjectForm({...projectForm, price: e.target.value})} placeholder="€..." />
                                </InputGroup>
                                <InputGroup label="Duração" className="mb-0">
                                     <input className="input-dark" value={projectForm.duration || ""} onChange={e => setProjectForm({...projectForm, duration: e.target.value})} placeholder="90m..." />
                                </InputGroup>
                             </div>
                        </div>
                    </div>
                    
                    <button onClick={async () => {
                        if(!projectForm.title || !projectForm.thumbnail) return alert("Título e Foto são obrigatórios");
                        if(editingProjectId) { await updateProject(editingProjectId, projectForm); setEditingProjectId(null); }
                        else { await addProject(projectForm); }
                        setProjectForm(initialProject);
                    }} className="w-full btn-primary text-xs">
                    {editingProjectId ? "Atualizar Look" : "Adicionar ao Portfólio"}
                    </button>
                    {editingProjectId && <button onClick={() => { setEditingProjectId(null); setProjectForm(initialProject); }} className="w-full mt-2 text-xs text-neutral-500 hover:text-white underline">Cancelar Edição</button>}
                </div>

                <div className="space-y-2">
                    <h4 className="section-label mb-2">Seus Looks Ativos ({state.projects.length})</h4>
                    {state.projects.map(p => (
                        <div key={p.id} className="flex items-center gap-4 bg-neutral-900 p-3 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors group">
                            <img src={p.thumbnail} className="h-12 w-12 rounded-lg object-cover" />
                            <div className="flex-1">
                                <div className="text-white text-sm font-bold">{p.title}</div>
                                <div className="text-neutral-500 text-xs">{p.price} • {p.duration}</div>
                            </div>
                            <div className="flex gap-2 opacity-100 md:opacity-50 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingProjectId(p.id); setProjectForm(p as ProjectFormData); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 bg-neutral-800 rounded-lg hover:text-white"><Edit2 size={16}/></button>
                                <button onClick={() => { if(confirm("Apagar?")) deleteProject(p.id); }} className="p-2 bg-neutral-800 rounded-lg hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* === SERVICES TAB (FIXED RESPONSIVE LAYOUT) === */}
            {activeTab === "services" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <SectionHeader title="Menu de Serviços" sub="Categorias e preços." />
                 
                 <div className="flex gap-2 mb-8 relative">
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nova Categoria (ex: Sobrancelhas)" className="input-dark flex-1" />
                    <button 
                      onClick={async () => { if(newCatName) { await addServiceCategory(newCatName); setNewCatName(""); } }}
                      className="btn-secondary whitespace-nowrap"
                    >Criar</button>
                 </div>

                 <div className="grid gap-6">
                    {state.serviceCategories.map(cat => (
                       <div key={cat.id} className="card-section p-0 overflow-hidden">
                          <div className="p-4 bg-neutral-800/30 flex justify-between items-center border-b border-neutral-800">
                             <h4 className="font-bold text-white text-sm tracking-wide uppercase">{cat.name}</h4>
                             <button onClick={() => { if(confirm("Apagar categoria e itens?")) deleteServiceCategory(cat.id); }} className="text-neutral-500 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>

                          <div className="p-4 space-y-3">
                                {/* List of Items - FIXED: Stacked on Mobile, Row on Desktop */}
                                {state.serviceItems.filter(i => i.category_id === cat.id).map(item => (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-neutral-300 p-3 hover:bg-neutral-800 rounded-lg transition-colors group border border-transparent hover:border-neutral-700">
                                       
                                       {/* Left: Info */}
                                       <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
                                          {item.image_url && <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover bg-neutral-900" />}
                                          <div className="flex flex-col">
                                            <span className="font-bold text-white text-base sm:text-sm">{item.name}</span>
                                            <span className="text-[10px] text-neutral-500">{item.detail_time}</span>
                                          </div>
                                       </div>

                                       {/* Right: Price & Actions - Full width on mobile, space-between */}
                                       <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                          <span className="text-amber-500 font-bold bg-amber-900/20 px-3 py-1.5 rounded-lg text-xs tracking-wide">{item.price}</span>
                                          
                                          <div className="flex gap-2">
                                            <button 
                                                onClick={() => { 
                                                    setServiceForm(item); 
                                                    setActiveCatId(cat.id); 
                                                    setEditingServiceId(item.id); 
                                                }} 
                                                className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-600"
                                            >
                                                <Edit2 size={14}/>
                                            </button>
                                            <button 
                                                onClick={() => deleteServiceItem(item.id)} 
                                                className="p-2 text-neutral-400 hover:text-red-500 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-red-900/50"
                                            >
                                                <X size={14}/>
                                            </button>
                                          </div>
                                       </div>
                                    </div>
                                ))}

                                {/* Add/Edit Form */}
                                {activeCatId === cat.id ? (
                                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-dashed border-neutral-700 animate-in fade-in relative">
                                        
                                       {/* Image Upload for Service */}
                                       <div className="mb-4 flex items-center gap-3">
                                            <div className="w-16 h-16 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-center relative overflow-hidden group shrink-0">
                                                {serviceForm.image_url ? <img src={serviceForm.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-neutral-600" />}
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <Upload size={14} className="text-white"/>
                                                    <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, (url) => setServiceForm(prev => ({...prev, image_url: url})))} />
                                                </label>
                                            </div>
                                            <div className="text-[10px] text-neutral-500">
                                                Toque no quadrado para<br/>adicionar foto (opcional).
                                            </div>
                                       </div>

                                       {/* Inputs - Stacked on Mobile, Split on Desktop */}
                                       <div className="space-y-4">
                                           <div className="w-full">
                                                <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1 block">Nome do Serviço</label>
                                                <input 
                                                    className="input-dark w-full" 
                                                    placeholder="Ex: Unhas de Gel" 
                                                    value={serviceForm.name} 
                                                    onChange={e => setServiceForm({...serviceForm, name: e.target.value})} 
                                                    autoFocus 
                                                />
                                           </div>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1 block">Preço</label>
                                                    <input 
                                                        className="input-dark w-full" 
                                                        placeholder="Ex: €20" 
                                                        value={serviceForm.price} 
                                                        onChange={e => setServiceForm({...serviceForm, price: e.target.value})} 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1 block">Tempo</label>
                                                    <input 
                                                        className="input-dark w-full" 
                                                        placeholder="Ex: 30m" 
                                                        value={serviceForm.detail_time || ""} 
                                                        onChange={e => setServiceForm({...serviceForm, detail_time: e.target.value})} 
                                                    />
                                                </div>
                                           </div>
                                       </div>

                                       {/* Actions */}
                                       <div className="flex gap-2 mt-6">
                                           <button onClick={async () => {
                                              if(serviceForm.name && serviceForm.price) {
                                                  if (editingServiceId) {
                                                      await updateServiceItem(editingServiceId, serviceForm);
                                                  } else {
                                                      await addServiceItem({ ...serviceForm as any, category_id: cat.id, display_order: 0 });
                                                  }
                                                  setServiceForm(initialServiceItem);
                                                  setActiveCatId(null);
                                                  setEditingServiceId(null);
                                              } else {
                                                  alert("Nome e Preço são obrigatórios");
                                              }
                                          }} className="btn-primary text-xs flex-1 justify-center py-3">
                                            {editingServiceId ? "Atualizar" : "Salvar Item"}
                                          </button>
                                          
                                          <button onClick={() => {
                                              setActiveCatId(null);
                                              setEditingServiceId(null);
                                              setServiceForm(initialServiceItem);
                                          }} className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white text-xs border border-neutral-700">
                                            Cancelar
                                          </button>
                                       </div>
                                    </div>
                                ) : (
                                    <button onClick={() => { setActiveCatId(cat.id); setServiceForm(initialServiceItem); setEditingServiceId(null); }} className="w-full py-3 text-xs text-neutral-400 border border-dashed border-neutral-800 rounded-xl hover:text-amber-500 hover:border-amber-500 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2 mt-2">
                                       <Plus size={14} /> Adicionar Serviço em {cat.name}
                                    </button>
                                )}
                          </div>
                       </div>
                    ))}
                 </div>
            </div>
            )}
            
            {/* === LOYALTY TAB === */}
            {activeTab === "loyalty" && (
                <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionHeader title="Fidelidade" sub="Cartões de selos digitais." />
                    <div className="card-section flex gap-2 mb-6 p-2 relative">
                         <div className="relative flex-1">
                             <Search className="absolute left-3 top-3 text-neutral-500" size={16} />
                             <input className="w-full bg-neutral-950 border-none text-white pl-10 h-10 rounded-lg focus:ring-0" placeholder="Buscar email do cliente..." value={loyaltySearch} onChange={(e) => { setLoyaltySearch(e.target.value); if(loyaltyUser) setLoyaltyUser(null); }}/>
                         </div>
                         <button onClick={handleUserSearch} className="btn-secondary h-10 px-4">
                            {isSearchingUser ? <Loader2 className="animate-spin" size={16}/> : "Buscar"}
                         </button>
                    </div>

                    {loyaltyUser ? (
                        <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl relative">
                             <h3 className="text-2xl font-bold text-white mb-2">{loyaltyUser.email}</h3>
                             <p className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-8">Cartão Atual</p>
                             <div className="flex justify-center gap-4 mb-8 relative">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button key={num} onClick={() => handleUpdateStamps(num)} className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${loyaltyUser.stamps >= num ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110" : "bg-transparent border-neutral-700 text-neutral-600 hover:border-neutral-500"}`}>
                                        {loyaltyUser.stamps >= num ? <CheckCircle2 size={24} strokeWidth={3} /> : <span className="text-sm font-bold">{num}</span>}
                                    </button>
                                ))}
                             </div>
                             <div className="flex justify-center gap-4">
                                <button onClick={() => handleUpdateStamps(0)} className="px-4 py-2 bg-neutral-800 rounded-lg text-xs hover:bg-red-900/20 hover:text-red-400 transition-colors flex items-center gap-2"><RefreshCw size={14}/> Zerar</button>
                                <button onClick={() => { setLoyaltyUser(null); setLoyaltySearch(""); }} className="px-4 py-2 bg-neutral-800 rounded-lg text-xs hover:bg-neutral-700 text-white transition-colors">Fechar</button>
                             </div>
                        </div>
                    ) : (
                        <div className="card-section p-0">
                             <div className="p-4 border-b border-neutral-800 bg-neutral-900"><h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Clientes Recentes</h4></div>
                             <div className="max-h-[300px] overflow-y-auto">
                                 {allLoyaltyUsers.length === 0 ? <div className="p-8 text-center text-neutral-600 text-xs">Nenhum cliente encontrado.</div> : allLoyaltyUsers.map(user => (
                                     <div key={user.id} onClick={() => { setLoyaltyUser(user); setLoyaltySearch(user.email); }} className="p-4 border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer flex justify-between items-center group">
                                         <div>
                                             <div className="text-white text-sm font-bold">{user.email}</div>
                                             <div className={`text-xs mt-1 ${user.stamps >= 5 ? "text-green-500 font-bold" : "text-neutral-500"}`}>{user.stamps} / 5 Selos {user.stamps >= 5 && "• PRÊMIO DISPONÍVEL"}</div>
                                         </div>
                                         <ChevronRight className="text-neutral-600 group-hover:text-amber-500 transition-colors" size={16} />
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "about" && (
                <div className="max-w-2xl mx-auto animate-in fade-in">
                    <SectionHeader title="Sobre Nós" sub="Texto do 'Sobre'." />
                    <div className="card-section space-y-4">
                        <InputGroup label="Título & Subtítulo">
                            <input value={aboutForm.title} onChange={(e) => setAboutForm({...aboutForm, title: e.target.value})} className="input-dark mb-2" placeholder="Título" />
                            <input value={aboutForm.subtitle} onChange={(e) => setAboutForm({...aboutForm, subtitle: e.target.value})} className="input-dark" placeholder="Subtítulo" />
                        </InputGroup>
                        <InputGroup label="Parágrafos">
                            <textarea rows={4} value={aboutForm.description_1} onChange={(e) => setAboutForm({...aboutForm, description_1: e.target.value})} className="input-dark mb-2 resize-none" placeholder="Parágrafo 1" />
                            <textarea rows={4} value={aboutForm.description_2} onChange={(e) => setAboutForm({...aboutForm, description_2: e.target.value})} className="input-dark resize-none" placeholder="Parágrafo 2" />
                        </InputGroup>
                        <button onClick={() => handleSave(() => updateAbout(aboutForm))} className="w-full btn-primary">Salvar Texto</button>
                    </div>
                </div>
            )}
            
            {activeTab === "gallery" && (
                <div className="max-w-2xl mx-auto animate-in fade-in">
                    <SectionHeader title="Galeria" sub="Upload de fotos e vídeos." />
                    <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-neutral-500 hover:bg-neutral-900/50 hover:border-amber-500/50 transition-all cursor-pointer group mb-6 relative">
                         <Upload size={32} className="mb-2 text-neutral-600 group-hover:text-amber-500 transition-colors"/>
                         <span className="text-xs font-bold uppercase">Clique para Upload</span>
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" onChange={async (e) => {
                             if(e.target.files?.[0]) {
                                 const file = e.target.files[0];
                                 const type = file.type.startsWith('video') ? 'video' : 'image';
                                 handleUpload(e, (url) => addGalleryItem({ media_url: url, media_type: type, caption: '', display_order: 0 }));
                             }
                         }}/>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {state.gallery.map(item => (
                             <div key={item.id} className="aspect-square bg-neutral-900 rounded-xl overflow-hidden relative group border border-neutral-800">
                                 {item.media_type === 'video' ? <video src={item.media_url} className="h-full w-full object-cover" muted /> : <img src={item.media_url} className="h-full w-full object-cover" />}
                                 <button onClick={() => deleteGalleryItem(item.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-all"><Trash2 size={24} /></button>
                             </div>
                         ))}
                    </div>
                </div>
            )}
            
            {activeTab === "socials" && (
                <div className="max-w-2xl mx-auto animate-in fade-in">
                    <SectionHeader title="Redes Sociais" sub="Links externos." />
                    <div className="space-y-4">
                        {state.socials.map(link => (
                            <div key={link.id} className="card-section flex flex-col gap-2 relative">
                                <div className="flex justify-between font-bold text-white text-sm">
                                    <span>{link.platform}</span>
                                    <input type="checkbox" checked={link.active} onChange={(e) => updateSocialLink(link.id, link.url, e.target.checked)} className="accent-amber-500 h-4 w-4" />
                                </div>
                                <input className="input-dark text-xs" value={link.url} onChange={(e) => updateSocialLink(link.id, e.target.value, link.active)} placeholder="https://..." />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
      
      {/* GLOBAL STYLES */}
      <style jsx global>{`
        .input-login {
            width: 100%;
            background-color: rgb(38 38 38);
            border: 1px solid rgb(64 64 64);
            border-radius: 0.75rem;
            padding: 1rem;
            color: white;
            font-size: 16px; /* Prevents mobile zoom */
            outline: none;
            transition: all 0.2s;
        }
        .input-login:focus { border-color: white; background-color: rgb(50 50 50); box-shadow: 0 0 0 1px white; }
        
        .input-dark {
            width: 100%;
            background-color: rgb(10 10 10);
            border: 1px solid rgb(38 38 38);
            border-radius: 0.75rem;
            padding: 0.875rem;
            color: white;
            outline: none;
            transition: all 0.2s;
            font-size: 16px; /* CRITICAL: Fixed mobile zoom issue */
        }
        .input-dark:focus { border-color: rgb(245 158 11); box-shadow: 0 0 0 1px rgb(245 158 11); background-color: rgb(23 23 23); }
        
        .card-section { background-color: rgb(23 23 23); border: 1px solid rgb(38 38 38); border-radius: 1rem; padding: 1.25rem; }
        .section-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(115 115 115); }
        .btn-primary { background-color: rgb(245 158 11); color: black; font-weight: 800; padding: 0.875rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        .btn-primary:hover { background-color: rgb(251 191 36); transform: translateY(-2px); }
        .btn-secondary { background-color: rgb(38 38 38); color: white; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; font-size: 0.75rem; }
        .btn-secondary:hover { background-color: rgb(64 64 64); color: white; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </motion.div>
  );
}

// --- MAIN EXPORT ---
export default function AdminModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state } = useStudio();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={onClose} 
          />
          {!state.isAuthenticated ? <AdminLogin /> : <Dashboard onClose={onClose} />}
        </div>
      )}
    </AnimatePresence>
  );
}