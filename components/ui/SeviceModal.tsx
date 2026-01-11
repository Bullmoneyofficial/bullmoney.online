"use client";

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  FormEvent
} from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// IMPORT YOUR CONTEXT
// Ensure these match your actual exports in StudioContext
import { useStudio, type ServiceCategory, type ServiceItem } from "@/context/StudioContext";

// ==========================================
// 0. CONSTANTS & UTILS
// ==========================================

const BOOKING_URL = "https://www.instagram.com/bullmoney.online/";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 1. ICONS
// ==========================================

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);
const CloseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
);
const ArrowIcon = ({ isOpen, className }: { isOpen: boolean, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-300", isOpen ? "rotate-90" : "-rotate-45", className)}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
);
const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);
const SaveIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
);
const PhotoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
);
const LoaderIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("animate-spin", className)}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

// ==========================================
// 2. MODAL SYSTEM (Unchanged)
// ==========================================

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}
const ModalContext = createContext<ModalContextType | undefined>(undefined);
const ModalProvider = ({ children, externalOpen, onExternalOpenChange }: { 
  children: React.ReactNode; 
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onExternalOpenChange) {
      onExternalOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : 'auto'; }, [open]);
  return <ModalContext.Provider value={{ open, setOpen }}>{children}</ModalContext.Provider>;
};
const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};
export function Modal({ children, isOpen, onOpenChange }: { 
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return <ModalProvider externalOpen={isOpen} onExternalOpenChange={onOpenChange}>{children}</ModalProvider>;
}
export const ModalTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { setOpen } = useModal();
  return (
    <button className={cn('relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none group', className)} onClick={() => setOpen(true)}>
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#a1a1aa_50%,#000000_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-black px-8 py-1 text-sm font-medium text-black dark:text-white backdrop-blur-3xl transition-colors">{children}</span>
    </button>
  );
};
export const ModalBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open, setOpen } = useModal();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    if (open && mounted) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen, mounted]);
  
  // Don't render portal during SSR or before mount
  if (!mounted || typeof window === 'undefined') return null;
  
  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <motion.div 
          key="modal-backdrop"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1, backdropFilter: 'blur(10px)' }} 
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }} 
          className="fixed inset-0 z-[9999] flex items-center justify-center h-full w-full bg-zinc-100/10 dark:bg-black/40"
        >
          <div className={cn('absolute inset-0 z-[-1] bg-transparent')} onClick={() => setOpen(false)} />
          <motion.div 
            key="modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            transition={{ type: 'spring', stiffness: 260, damping: 20 }} 
            className={cn('relative w-[95%] md:w-[90%] max-w-5xl max-h-[90%] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col', className)}
          >
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors shadow-sm"><CloseIcon className="w-4 h-4 text-black dark:text-white" /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>, document.body
  );
};
export const ModalContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex-1 overflow-y-auto p-6 md:p-10 relative', className)}>{children}</div>
);
export const ModalFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex justify-end gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800', className)}>{children}</div>
);

// ==========================================
// 3. EDITABLE COMPONENTS (FIXED)
// ==========================================

// --- A. SERVICE ITEM ROW ---

const ServiceDetailItem = ({ item }: { item: ServiceItem }) => {
  const { state, updateServiceItem, deleteServiceItem, uploadFile } = useStudio(); 
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: item.name,
    price: item.price,
    detail_type: item.detail_type || "",
    detail_time: item.detail_time || "",
    detail_includes: item.detail_includes || "",
    image_url: (item as any).image_url || "", 
  });

  // Ensure formData stays in sync if parent updates the item
  useEffect(() => {
    setFormData({
      name: item.name,
      price: item.price,
      detail_type: item.detail_type || "",
      detail_time: item.detail_time || "",
      detail_includes: item.detail_includes || "",
      image_url: (item as any).image_url || "", 
    });
  }, [item]);

  const hasDetails = !!item.detail_type || !!item.detail_time || !!item.detail_includes || !!(item as any).image_url;

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop bubbling to accordion
    e.preventDefault();
    try {
      await updateServiceItem(item.id, formData);
      setIsEditing(false);
    } catch (err) {
      console.error("Update Error:", err);
      alert("Failed to update item");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop bubbling to accordion
    e.preventDefault();
    if (confirm("Are you sure you want to delete this service?")) {
      try {
          await deleteServiceItem(item.id);
      } catch (err) {
          console.error("Delete Error:", err);
      }
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent bubble
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    try {
        const { url, error } = await uploadFile(e.target.files[0]);
        if(url) setFormData(prev => ({ ...prev, image_url: url }));
        else alert(error || "Upload failed");
    } catch (err) {
        alert("Upload error");
    } finally {
        setIsUploading(false);
    }
  };

  if (isEditing) {
    return (
      // FIX: Added onClick stopPropagation here to prevent clicking inputs from triggering parent accordion
      <div onClick={(e) => e.stopPropagation()} className="border-b border-neutral-200 dark:border-neutral-800 py-4 px-2 space-y-3 bg-neutral-100 dark:bg-neutral-900/50 rounded-lg my-2 cursor-default">
        <div className="flex gap-2">
           <input 
             className="flex-1 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 p-2 rounded text-sm"
             placeholder="Service Name"
             value={formData.name}
             onChange={(e) => setFormData({...formData, name: e.target.value})}
           />
           <input 
             className="w-24 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 p-2 rounded text-sm"
             placeholder="Price"
             value={formData.price}
             onChange={(e) => setFormData({...formData, price: e.target.value})}
           />
        </div>
        <div className="grid grid-cols-2 gap-2">
           <input 
             className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 p-2 rounded text-sm"
             placeholder="Type (e.g. Gel)"
             value={formData.detail_type}
             onChange={(e) => setFormData({...formData, detail_type: e.target.value})}
           />
           <input 
             className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 p-2 rounded text-sm"
             placeholder="Duration (e.g. 60m)"
             value={formData.detail_time}
             onChange={(e) => setFormData({...formData, detail_time: e.target.value})}
           />
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-black p-2 rounded border border-neutral-300 dark:border-neutral-700">
            {formData.image_url ? (
                <div className="w-8 h-8 relative rounded overflow-hidden">
                    <Image src={formData.image_url} alt="preview" fill className="object-cover" />
                </div>
            ) : <PhotoIcon className="text-neutral-400" />}
            
            <label className="flex-1 cursor-pointer">
                <span className="text-xs text-blue-500 font-bold hover:underline">
                    {isUploading ? "Uploading..." : (formData.image_url ? "Change Picture" : "Upload Picture")}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={isUploading} />
            </label>
            {formData.image_url && (
                <button onClick={() => setFormData({...formData, image_url: ""})} className="text-red-500 text-xs hover:underline">Remove</button>
            )}
        </div>

        <textarea 
          className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 p-2 rounded text-sm"
          placeholder="What's included? (Description)"
          rows={2}
          value={formData.detail_includes}
          onChange={(e) => setFormData({...formData, detail_includes: e.target.value})}
        />
        <div className="flex justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="text-xs px-3 py-2 text-neutral-500">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1 bg-black text-white px-3 py-2 rounded text-xs dark:bg-white dark:text-black">
             <SaveIcon className="w-3 h-3" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 border-dotted last:border-0 group/item">
      {/* Clickable Header */}
      <div 
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        className={cn(
          "flex justify-between items-center py-4 cursor-pointer transition-all duration-200 rounded-lg px-3 -mx-3",
          (hasDetails || state.isAdmin) ? "hover:bg-neutral-100 dark:hover:bg-neutral-800" : "cursor-default"
        )}
      >
        <div className="flex flex-col">
           <div className="flex items-center gap-2">
              <span className="font-medium text-sm md:text-base uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  {item.name}
              </span>
              {(item as any).image_url && <PhotoIcon className="w-3 h-3 text-amber-500 opacity-50" />}
           </div>
           
           <div className="mt-1 flex items-center gap-3">
             {/* 🔒 STRICT ADMIN CHECK */}
             {state.isAdmin && (
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-neutral-400 hover:text-blue-500 p-1">
                    <EditIcon className="w-3 h-3" />
                  </button>
                  <button onClick={handleDelete} className="text-neutral-400 hover:text-red-500 p-1">
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
             )}
             
             {(hasDetails) && (
                 <span className="text-[10px] uppercase tracking-widest text-neutral-400 group-hover/item:text-black dark:group-hover/item:text-white transition-colors flex items-center gap-1">
                    {isExpanded ? "Fechar" : "Ver detalhes"}
                    <ArrowIcon isOpen={isExpanded} className="w-3 h-3" />
                 </span>
             )}
           </div>
        </div>
        
        <span className="font-bold text-sm md:text-base text-neutral-900 dark:text-white">
            {item.price}
        </span>
      </div>

      {/* Details Accordion */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            onClick={e => e.stopPropagation()} // Stop bubbling inside details too
          >
            <div className="pb-6 pt-0 px-4 text-sm">
              <motion.div 
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-4 bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-xl text-neutral-600 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-800"
              >
                 <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-4">
                    {item.detail_type && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">Tipo</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{item.detail_type}</span>
                      </div>
                    )}
                    {item.detail_time && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">Duração</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{item.detail_time}</span>
                      </div>
                    )}
                 </div>

                 {item.detail_includes && (
                   <div>
                       <span className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">O que inclui</span>
                       <p className="leading-relaxed text-sm">{item.detail_includes}</p>
                   </div>
                 )}

                 {(item as any).image_url && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowImage(!showImage); }}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 hover:text-amber-500 transition-colors"
                        >
                            <PhotoIcon className="w-4 h-4" /> 
                            {showImage ? "Esconder Foto" : "Ver Foto do Resultado"}
                        </button>

                        <AnimatePresence>
                            {showImage && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    className="relative w-full aspect-[4/5] md:aspect-video rounded-lg overflow-hidden bg-neutral-200 dark:bg-black"
                                >
                                    <Image src={(item as any).image_url} alt={item.name} fill className="object-cover"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                 )}
                 
                 <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="block w-full text-center mt-2 py-2 text-xs font-bold uppercase tracking-widest border border-black dark:border-white rounded hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                     Reservar este serviço
                 </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- B. ADD SERVICE ITEM FORM ---

const AddServiceForm = ({ categoryId, onCancel }: { categoryId: number; onCancel: () => void }) => {
  const { addServiceItem, uploadFile } = useStudio();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    detail_type: "",
    detail_time: "",
    detail_includes: "",
    image_url: "",
    display_order: 99
  });

  const handleSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!formData.name || !formData.price) return alert("Name and Price are required");
    try {
      await addServiceItem({ ...formData, category_id: categoryId });
      onCancel();
    } catch (e) { alert("Failed to add service"); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if(!e.target.files?.[0]) return;
      setIsUploading(true);
      const { url } = await uploadFile(e.target.files[0]);
      setIsUploading(false);
      if(url) setFormData(p => ({ ...p, image_url: url }));
  };

  // FIX: Added stopPropagation here too
  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg my-4 space-y-3 border border-neutral-200 dark:border-neutral-800 cursor-default">
        <h4 className="text-xs font-bold uppercase text-neutral-500">New Service</h4>
        <div className="flex gap-2">
           <input className="flex-1 p-2 rounded text-sm bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           <input className="w-24 p-2 rounded text-sm bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        </div>
        <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-white dark:bg-black border border-dashed border-neutral-300 dark:border-neutral-700 px-3 py-2 rounded text-xs flex items-center gap-2 hover:border-amber-500 transition-colors">
                {isUploading ? <LoaderIcon /> : <PhotoIcon className="w-3 h-3" />}
                {formData.image_url ? "Image Uploaded" : "Upload Image (Optional)"}
                <input type="file" hidden accept="image/*" onChange={handleUpload} />
            </label>
            {formData.image_url && <span className="text-xs text-green-500 font-bold">✓</span>}
        </div>
        <textarea className="w-full p-2 rounded text-sm bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700" rows={2} placeholder="Includes..." value={formData.detail_includes} onChange={e => setFormData({...formData, detail_includes: e.target.value})} />
        <div className="flex justify-end gap-2">
            <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="px-3 py-1 text-xs text-neutral-500">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1 bg-black text-white text-xs rounded dark:bg-white dark:text-black">Add Service</button>
        </div>
    </div>
  )
}

// --- C. SERVICE CATEGORY ITEM ---

function ServiceCategoryItem({ category, items }: { category: ServiceCategory; items: ServiceItem[] }) {
  const { state, updateServiceCategory, deleteServiceCategory } = useStudio();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [catForm, setCatForm] = useState({ name: category.name, notes: category.notes ? category.notes.join('\n') : '' });
  
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);

  const animationDefaults = { duration: 0.6, ease: "expo" };
  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = (mouseX - width / 2) ** 2 + (mouseY - 0) ** 2;
    const bottomEdgeDist = (mouseX - width / 2) ** 2 + (mouseY - height) ** 2;
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };
  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current || isEditingCat) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);
    gsap.timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };
  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current || isEditingCat) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);
    gsap.timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const saveCat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        await updateServiceCategory(category.id, catForm.name, catForm.notes.split('\n').filter(Boolean));
        setIsEditingCat(false);
    } catch(err) { alert("Failed update"); }
  };

  const deleteCat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Delete this entire category and all its services?")) {
        await deleteServiceCategory(category.id);
    }
  };

  return (
    <div className="menu__item bg-white dark:bg-neutral-950">
      <div 
        ref={itemRef} 
        onClick={() => !isEditingCat && setIsOpen(!isOpen)}
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden"
      >
        <div className="menu__item-header group">
            {isEditingCat ? (
                <div onClick={e => e.stopPropagation()} className="z-30 w-full flex items-center gap-4">
                    <input 
                      value={catForm.name} 
                      onChange={e => setCatForm({...catForm, name: e.target.value})}
                      className="text-2xl font-light bg-transparent border-b border-black dark:border-white w-full outline-none"
                      autoFocus
                    />
                    <button onClick={saveCat}><SaveIcon className="w-5 h-5 text-green-600" /></button>
                    <button onClick={() => setIsEditingCat(false)} className="text-xs uppercase">Cancel</button>
                </div>
            ) : (
                <>
                    <span className={cn("text-2xl md:text-4xl font-light tracking-tight transition-opacity duration-300 z-20", "group-hover:opacity-0")}>
                    {category.name}
                    </span>
                    <div className="z-20 flex items-center gap-4 transition-colors duration-300">
                        {state.isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setIsEditingCat(true); }} className="text-neutral-400 hover:text-black dark:hover:text-white"><EditIcon className="w-4 h-4" /></button>
                                <button onClick={deleteCat} className="text-neutral-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        )}
                        <ArrowIcon isOpen={isOpen} className="text-neutral-400 group-hover:text-white" />
                    </div>
                </>
            )}
        </div>
        {!isEditingCat && (
            <div className="marquee" ref={marqueeRef}>
                <div className="marquee__inner-wrap" ref={marqueeInnerRef}>
                    <div className="marquee__inner" aria-hidden="true">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="marquee__content"><span className="marquee__text">{category.name}</span></div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-neutral-50 dark:bg-neutral-900">
            <div className="px-6 py-4 md:px-10">
                {isEditingCat ? (
                    <div className="mb-4">
                        <label className="text-[10px] uppercase font-bold text-neutral-400">Notes (one per line)</label>
                        <textarea className="w-full bg-white dark:bg-black border p-2 text-xs" value={catForm.notes} onChange={e => setCatForm({...catForm, notes: e.target.value})}/>
                    </div>
                ) : (
                    category.notes && category.notes.length > 0 && (
                        <div className="mb-6 space-y-1 px-2 border-l-2 border-neutral-200 dark:border-neutral-800">
                            {category.notes.map((note, n) => (<p key={n} className="text-xs text-neutral-500 italic pl-2">{note}</p>))}
                        </div>
                    )
                )}

                <div className="grid gap-2 max-w-3xl">
                    {items.map((item) => <ServiceDetailItem key={item.id} item={item} />)}
                    {items.length === 0 && !isAddingService && <p className="text-sm text-neutral-400 italic">No services yet.</p>}
                    {state.isAdmin && (
                        <div className="mt-4">
                            {!isAddingService ? (
                                <button onClick={(e) => { e.stopPropagation(); setIsAddingService(true); }} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                                    <PlusIcon className="w-4 h-4" /> Add Service to {category.name}
                                </button>
                            ) : (
                                <AddServiceForm categoryId={category.id} onCancel={() => setIsAddingService(false)} />
                            )}
                        </div>
                    )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 4. MAIN EXPORT COMPONENT
// ==========================================

const styles = `
.menu-wrap { position: relative; overflow: hidden; width: 100%; }
.menu__item { position: relative; border-bottom: 1px solid rgba(0, 0, 0, 0.1); }
@media (prefers-color-scheme: dark) { .menu__item { border-bottom: 1px solid rgba(255, 255, 255, 0.1); } }
.menu__item-header { display: flex; align-items: center; justify-content: space-between; position: relative; padding: 1.5rem 0.5rem; z-index: 10; cursor: pointer; background: transparent; width: 100%; overflow: hidden; }
.marquee { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; z-index: 1; background: #000; transform: translate3d(0, 101%, 0); }
.marquee__inner-wrap { width: 100%; height: 100%; transform: translate3d(0, -101%, 0); }
.marquee__inner { width: 100%; height: 100%; display: flex; align-items: center; position: relative; animation: marquee 15s linear infinite; will-change: transform; }
.marquee__content { display: flex; align-items: center; flex-shrink: 0; }
.marquee__text { font-size: 3rem; font-weight: 900; text-transform: uppercase; color: #fff; white-space: nowrap; padding: 0 1rem; font-style: italic; opacity: 0.9; }
@keyframes marquee { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-50%, 0, 0); } }
`;

interface ServicesModalProps { 
  btnText?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function ServicesModal({ btnText, isOpen, onOpenChange, showTrigger = true }: ServicesModalProps) {
  const { state, addServiceCategory } = useStudio();
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const handleCreateCategory = async () => {
      if(!newCatName) return;
      await addServiceCategory(newCatName);
      setNewCatName("");
      setIsAddingCat(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      {showTrigger && (
        <ModalTrigger>
           <span className="flex items-center gap-2">{btnText || "Ver Serviços e Preços"} <SparklesIcon className="w-4 h-4" /></span>
        </ModalTrigger>
      )}
      <ModalBody>
        <ModalContent>
          <style>{styles}</style>
          <div className="w-full">
            <div className="p-6 md:p-10 pb-0 md:pb-0">
                <div className="mb-8 md:mb-12 flex justify-between items-end">
                    <div>
                        <h4 className="font-serif italic text-lg text-neutral-500 mb-2">Menu de Serviços</h4>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-neutral-900 dark:text-white">Tabela de Preços</h1>
                    </div>
                </div>
            </div>
            <div className="menu-wrap border-t border-neutral-300 dark:border-neutral-800">
                {state.loading ? (
                   <div className="p-10 text-center text-neutral-400 animate-pulse">Carregando serviços...</div>
                ) : (
                  <nav className="menu flex flex-col">
                      {state.serviceCategories.map((cat) => {
                          const catItems = state.serviceItems.filter(i => i.category_id === cat.id);
                          return <ServiceCategoryItem key={cat.id} category={cat} items={catItems} />;
                      })}
                  </nav>
                )}
                {state.isAdmin && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/30 border-t border-neutral-200 dark:border-neutral-800">
                        {!isAddingCat ? (
                            <button onClick={() => setIsAddingCat(true)} className="w-full py-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-400 font-bold uppercase tracking-widest hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white transition-all flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5" /> Add New Category</button>
                        ) : (
                            <div className="flex gap-2 items-center p-2">
                                <input autoFocus className="flex-1 text-xl bg-transparent border-b border-black dark:border-white p-2 outline-none" placeholder="New Category Name..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()} />
                                <button onClick={handleCreateCategory} className="bg-black text-white px-4 py-2 rounded text-sm font-bold dark:bg-white dark:text-black">Add</button>
                                <button onClick={() => setIsAddingCat(false)} className="px-4 py-2 text-sm text-neutral-500">Cancel</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-6 md:p-10 mt-4 text-center md:text-right text-xs uppercase tracking-widest text-neutral-400">* Preços sujeitos a alteração</div>
          </div>
        </ModalContent>
        <ModalFooter>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="block text-center bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors text-sm px-6 py-2.5 rounded-full font-medium shadow-lg w-full md:w-auto">Book Appointment</a>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}