"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2, Edit2, Save, X, Trash2, Upload } from "lucide-react";

// --- CONTEXT INTEGRATION ---
import { useStudio, type Project } from "@/context/StudioContext";

// --- EXTERNAL COMPONENTS ---
// Make sure these paths match your project structure
import About from "@/components/ui/About"; 
import ServicesShowcaseModal from "@/components/ui/ServicesShowcaseModal";
import AdminModal from "@/components/AdminModal"; // Assuming this is your AdminModal path
import { useServicesModalUI } from "@/contexts/UIStateContext";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- 1. VISUAL COMPONENTS (Backgrounds) ---

const GridLineVertical = React.memo(({ className, offset }: { className?: string; offset?: string }) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 255, 255, 0.3)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-10", 
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    ></div>
  );
});
GridLineVertical.displayName = "GridLineVertical";

const BackgroundGrids = React.memo(() => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 grid h-full w-full -rotate-45 transform select-none grid-cols-2 gap-10 md:grid-cols-4">
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full bg-linear-to-b from-transparent via-neutral-100 to-transparent dark:via-neutral-900">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
    </div>
  );
});
BackgroundGrids.displayName = "BackgroundGrids";

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  // Fix: Initialize with empty array to match Server Side Rendering
  const [spans, setSpans] = useState<{
    id: number;
    initialX: number;
    initialY: number;
    directionX: number;
    directionY: number;
  }[]>([]);

  useEffect(() => {
    // Fix: Generate random numbers ONLY on the client after mount
    const newSpans = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      initialX: 0,
      initialY: 0,
      directionX: Math.floor(Math.random() * 80 - 40),
      directionY: Math.floor(Math.random() * -50 - 10),
    }));
    setSpans(newSpans);
  }, []);

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-[4px] w-10 rounded-full bg-linear-to-r from-transparent via-amber-400 to-transparent blur-sm"
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-linear-to-b from-amber-400 to-yellow-200"
        />
      ))}
    </div>
  );
};

const CollisionMechanism = React.memo(React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement | null>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    beamOptions?: {
      initialX?: number;
      translateX?: number;
      initialY?: number;
      translateY?: number;
      rotate?: number;
      className?: string;
      duration?: number;
      delay?: number;
      repeatDelay?: number;
    };
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX =
            beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: {
              x: relativeX,
              y: relativeY,
            },
          });
          setCycleCollisionDetected(true);
          if (beamRef.current) {
            beamRef.current.style.opacity = "0";
          }
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 50);

    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
        if (beamRef.current) {
          beamRef.current.style.opacity = "1";
        }
      }, 2000);

      setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1);
      }, 2000);
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || "-200px",
          translateX: beamOptions.initialX || "0px",
          rotate: beamOptions.rotate || -45,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || "800px",
            translateX: beamOptions.translateX || "700px",
            rotate: beamOptions.rotate || -45,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          "absolute left-96 top-20 m-auto h-14 w-px rounded-full bg-linear-to-t from-orange-500 via-yellow-500 to-transparent",
          beamOptions.className
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            style={{
              left: `${collision.coordinates.x + 20}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}));
CollisionMechanism.displayName = "CollisionMechanism";

// --- 2. HEADER COMPONENT ---
const Header = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const { state } = useStudio();
  const { hero } = state;
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { isOpen: isServicesModalOpen, setIsOpen: setIsServicesModalOpen } = useServicesModalUI();

  // Fallback defaults if hero is loading
  const headline = hero?.headline || "Alexa Studio";
  const subheadline = hero?.subheadline || "Precision, durability, and a flawless finish designed just for you.";
  const buttonText = hero?.button_text || "Book Now";

  return (
    <div
      ref={parentRef}
      className="max-w-7xl relative mx-auto py-12 md:py-20 px-4 w-full left-0 top-0 mb-20"
    >
       {/* --- ADMIN MODAL COMPONENT --- */}
       <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

       {/* --- ADMIN TRIGGER --- */}
      <div 
        onClick={() => setIsAdminOpen(true)}
        className="fixed top-4 right-4 z-[9999] opacity-0 hover:opacity-100 transition-opacity"
      >
        <div className="bg-black/80 text-white text-xs px-3 py-1 rounded-full cursor-pointer border border-white/20">
          Admin Login
        </div>
      </div>

      <div className="absolute inset-0 h-full w-full overflow-hidden opacity-40">
        <BackgroundGrids />
        <CollisionMechanism
          beamOptions={{
            initialX: -400,
            translateX: 600,
            duration: 7,
            repeatDelay: 3,
            className: "from-amber-300 via-yellow-500 to-transparent",
          }}
          containerRef={containerRef}
          parentRef={parentRef}
        />
        <CollisionMechanism
          beamOptions={{
            initialX: 200,
            translateX: 1200,
            duration: 5,
            repeatDelay: 3,
            className: "from-amber-200 via-yellow-400 to-transparent",
          }}
          containerRef={containerRef}
          parentRef={parentRef}
        />
         <CollisionMechanism
          beamOptions={{
            initialX: 400,
            translateX: 1400,
            duration: 6,
            repeatDelay: 3,
            className: "from-amber-100 via-yellow-300 to-transparent",
          }}
          containerRef={containerRef}
          parentRef={parentRef}
        />
      </div>

      <div className="relative z-20 pointer-events-none">
        <h1 className="text-4xl md:text-8xl font-serif font-bold dark:text-white text-neutral-900 leading-[1.1]">
          {headline.split(" ").map((word, index) => (
            <motion.span
              key={index}
              initial={{ filter: "blur(10px)", opacity: 0, y: 10 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="inline-block mr-4"
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="max-w-2xl text-base md:text-xl mt-6 dark:text-neutral-200 text-neutral-600 font-light tracking-wide whitespace-pre-line"
        >
          {subheadline}
        </motion.p>
      </div>
       
      <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 1 }}
           className="mt-6 flex gap-4 items-center relative z-30 pointer-events-auto"
        >
             <ServicesShowcaseModal
               btnText={buttonText}
               isOpen={isServicesModalOpen}
               onOpenChange={setIsServicesModalOpen}
             />
             <About />
      </motion.div>

      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 w-full h-px opacity-0 pointer-events-none"
      />
    </div>
  );
});
Header.displayName = "Header";


// --- 3. PRODUCT CARD ---
const ProductCard = React.memo(({
  project,
  uniqueLayoutId, 
  translate,
  setActive,
}: {
  project: Project;
  uniqueLayoutId: string;
  translate: MotionValue<number>;
  setActive: (project: Project, layoutId: string) => void; 
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      onClick={() => setActive(project, uniqueLayoutId)} 
      className="group/product h-96 w-[30rem] relative flex-shrink-0 cursor-pointer"
    >
      <div className="block group-hover/product:shadow-2xl ">
        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-96 w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800"
        >
            <Image
                src={project.thumbnail}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                className="object-cover object-center absolute h-full w-full inset-0"
                alt={project.title}
            />
        </motion.div>
      </div>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none transition-opacity duration-500 rounded-xl"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white font-serif tracking-wider transition-opacity duration-500 text-2xl">
        {project.title}
      </h2>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";


// --- 4. HERO PARALLAX (MAIN) ---
const HeroParallax = () => {
  const { state, updateProject, deleteProject } = useStudio();
  const { projects, loading, isAuthenticated } = state;

  // --- PARALLAX DATA PREP ---
  const displayProjects = useMemo(() => {
    if (projects.length === 0) return [];
    
    // Fill the grid to ensure smooth scrolling animation even with few projects
    let filledProjects = [...projects];
    while (filledProjects.length < 15) {
      filledProjects = [...filledProjects, ...projects];
    }
    return filledProjects;
  }, [projects]);

  const firstRow = displayProjects.slice(0, 5);
  const secondRow = displayProjects.slice(5, 10);
  const thirdRow = displayProjects.slice(10, 15);

  // --- ANIMATION REFS ---
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springConfig);

  // --- MODAL STATE ---
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  // --- EDITING STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false); // NEW: Local image upload state
  const quickEditFileInputRef = useRef<HTMLInputElement>(null); // NEW: Ref for file input

  const [editForm, setEditForm] = useState({
    title: "",
    thumbnail: "",
    description: "",
    price: "",
    duration: "",
    technique: "",
    link: ""
  });

  const handleOpen = (project: Project, layoutId: string) => {
    setActiveProject(project);
    setActiveLayoutId(layoutId); 
    setEditForm({
      title: project.title,
      thumbnail: project.thumbnail,
      description: project.description || "",
      price: project.price || "",
      duration: project.duration || "",
      technique: project.technique || "",
      link: project.link || ""
    });
    setIsEditing(false);
  };

  const handleClose = useCallback(() => {
    setActiveProject(null);
    setActiveLayoutId(null);
    setIsEditing(false);
  }, []);

  // --- FORM HANDLERS ---
  const handleSaveEdit = async () => {
    if(!activeProject) return;
    setIsSaving(true);
    try {
      await updateProject(activeProject.id, editForm);
      // Optimistically update the active project so the modal doesn't flicker old data
      setActiveProject({ ...activeProject, ...editForm });
      setIsEditing(false);
    } catch (error) {
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if(!activeProject) return;
    if(window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      setIsSaving(true);
      try {
        await deleteProject(activeProject.id);
        handleClose();
      } catch (error) {
        alert("Failed to delete.");
      } finally {
        setIsSaving(false);
      }
    }
  }

  // --- NEW: QUICK IMAGE UPLOAD HANDLER ---
  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploadingImage(true);
    const file = e.target.files[0];

    try {
      // TODO: Implement image upload logic or add uploadImage to StudioContext
      // For now, creating a local URL preview
      const url = URL.createObjectURL(file);
      const error = null;
      
      if (error) {
        alert("Upload failed: " + error);
      } else if (url) {
        setEditForm(prev => ({ ...prev, thumbnail: url }));
      }
    } catch (err) {
      alert("An unexpected error occurred during upload.");
    } finally {
      setIsUploadingImage(false);
      // Reset input so selecting the same file works again if needed
      if (quickEditFileInputRef.current) quickEditFileInputRef.current.value = ""; 
    }
  };

  // Lock scroll when modal is open
  useEffect(() => {
    if (activeProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "visible";
    }
    return () => { document.body.style.overflow = "visible"; }
  }, [activeProject]);

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-neutral-950 text-amber-500">
              <Loader2 className="animate-spin w-10 h-10" />
          </div>
      )
  }

  return (
    <>
    <div
      ref={ref}
      className="h-[280vh] md:h-[300vh] pt-20 pb-40 overflow-hidden bg-neutral-50 dark:bg-neutral-950 antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        {/* ROW 1 */}
        <motion.div style={{ willChange: "transform" }} className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((project, idx) => {
             const uniqueId = `image-${project.id}-row1-${idx}`;
             return (
               <ProductCard 
                  project={project} 
                  uniqueLayoutId={uniqueId} 
                  translate={translateX} 
                  key={uniqueId} 
                  setActive={handleOpen} 
               />
             );
          })}
        </motion.div>
        
        {/* ROW 2 */}
        <motion.div style={{ willChange: "transform" }} className="flex flex-row mb-20 space-x-20 ">
          {secondRow.map((project, idx) => {
             const uniqueId = `image-${project.id}-row2-${idx}`;
             return (
               <ProductCard 
                  project={project} 
                  uniqueLayoutId={uniqueId} 
                  translate={translateXReverse} 
                  key={uniqueId} 
                  setActive={handleOpen} 
               />
             );
          })}
        </motion.div>
        
        {/* ROW 3 */}
        <motion.div style={{ willChange: "transform" }} className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((project, idx) => {
             const uniqueId = `image-${project.id}-row3-${idx}`;
             return (
               <ProductCard 
                  project={project} 
                  uniqueLayoutId={uniqueId} 
                  translate={translateX} 
                  key={uniqueId} 
                  setActive={handleOpen} 
               />
             );
          })}
        </motion.div>
      </motion.div>
    </div>

    {/* PROJECT OVERLAY (MODAL) */}
    <AnimatePresence>
        {activeProject && activeLayoutId && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
                onClick={handleClose}
            >
                <motion.div
                    layoutId={activeLayoutId} 
                    className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()} 
                >
                    {/* CLOSE BUTTON */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-50 p-2 bg-white/20 backdrop-blur rounded-full text-black dark:text-white hover:bg-white/40 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* --- ADMIN EDIT TOGGLE --- */}
                    {isAuthenticated && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-4 right-16 z-50 p-2 bg-amber-500 rounded-full text-black hover:bg-amber-400 transition-colors shadow-lg flex gap-2 items-center px-4 font-bold text-xs"
                      >
                         <Edit2 size={14} /> Edit Look
                      </button>
                    )}

                    {/* --- IMAGE SECTION --- */}
                    <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-neutral-200 dark:bg-neutral-800 group/image">
                         <Image
                            src={isEditing ? editForm.thumbnail : activeProject.thumbnail}
                            fill
                            priority={true}
                            className="object-cover"
                            alt={activeProject.title}
                        />
                         
                         {/* EDIT MODE IMAGE OVERLAY */}
                         {isEditing && (
                          <>
                            <div 
                              onClick={() => !isUploadingImage && quickEditFileInputRef.current?.click()}
                              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/70 transition-colors"
                            >
                              {isUploadingImage ? (
                                <Loader2 className="animate-spin text-amber-500 w-8 h-8" />
                              ) : (
                                <>
                                  <Upload className="text-amber-500 w-8 h-8 mb-2" />
                                  <p className="text-white text-xs font-bold uppercase tracking-widest">Click to Change Image</p>
                                </>
                              )}
                            </div>
                            {/* Hidden File Input */}
                            <input 
                              type="file" 
                              ref={quickEditFileInputRef} 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleQuickImageUpload}
                            />
                          </>
                        )}
                    </div>

                    {/* --- DETAILS SECTION --- */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col justify-center overflow-y-auto">
                        
                        {isEditing ? (
                          // --- EDIT MODE FORM ---
                          <div className="space-y-4 animate-in fade-in duration-300">
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Title</label>
                                <input 
                                  value={editForm.title} 
                                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                  className="w-full bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-amber-500 text-white"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Description</label>
                                <textarea 
                                  rows={3}
                                  value={editForm.description || ""} 
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  className="w-full bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-amber-500 text-white"
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Price</label>
                                  <input 
                                    value={editForm.price || ""} 
                                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                    className="w-full bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-amber-500 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Duration</label>
                                  <input 
                                    value={editForm.duration || ""} 
                                    onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                                    className="w-full bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-amber-500 text-white"
                                  />
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Technique</label>
                                <input 
                                  value={editForm.technique || ""} 
                                  onChange={(e) => setEditForm({...editForm, technique: e.target.value})}
                                  className="w-full bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-amber-500 text-white"
                                />
                             </div>

                             <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={handleSaveEdit} 
                                  disabled={isSaving || isUploadingImage}
                                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                  {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} /> Save Changes</>}
                                </button>
                                <button 
                                  onClick={handleDelete}
                                  disabled={isSaving}
                                  className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setIsEditing(false);
                                    setEditForm({
                                      title: activeProject.title,
                                      thumbnail: activeProject.thumbnail,
                                      description: activeProject.description || "",
                                      price: activeProject.price || "",
                                      duration: activeProject.duration || "",
                                      technique: activeProject.technique || "",
                                      link: activeProject.link || ""
                                    });
                                  }}
                                  className="text-neutral-500 hover:text-white text-xs px-2"
                                >
                                  Cancel
                                </button>
                             </div>
                          </div>
                        ) : (
                          // --- VIEW MODE ---
                          <>
                            <motion.h3 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-serif font-bold text-neutral-900 dark:text-white mb-2"
                            >
                                {activeProject.title}
                            </motion.h3>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-neutral-600 dark:text-neutral-300 mb-6 text-sm"
                            >
                                {activeProject.description || "Precision, durability, and a flawless finish designed just for you."}
                            </motion.p>
                            
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2 mb-8"
                            >
                                {activeProject.duration && (
                                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                        <span className="text-sm font-medium dark:text-neutral-300">Duration</span>
                                        <span className="text-sm dark:text-neutral-300">{activeProject.duration}</span>
                                    </div>
                                )}
                                {activeProject.technique && (
                                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                        <span className="text-sm font-medium dark:text-neutral-300">Technique</span>
                                        <span className="text-sm dark:text-neutral-300">{activeProject.technique}</span>
                                    </div>
                                )}
                                {activeProject.price && (
                                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                        <span className="text-sm font-medium dark:text-neutral-300">Price</span>
                                        <span className="text-sm dark:text-neutral-300 text-amber-500 font-bold">{activeProject.price}</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:scale-105 transition-transform"
                            >
                                Book This Look
                            </motion.button>
                          </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default function NailStudioHero() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-950">
      <HeroParallax />
    </div>
  );
}
