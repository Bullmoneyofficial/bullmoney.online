export default function DesignLoading() {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center">
      <div className="text-center">
        <div
          className="inline-block w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin mb-5"
          role="status"
          aria-label="Loading design page"
        />
        <p className="text-white/80 text-sm font-medium tracking-wide">Loading Design Studio</p>
      </div>
    </div>
  );
}
