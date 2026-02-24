export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin animation-delay-150" />
        </div>
        <div className="text-white/80 text-sm font-medium tracking-wide">
          Loading...
        </div>
      </div>
    </div>
  );
}
