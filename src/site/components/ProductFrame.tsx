interface ProductFrameProps {
  children: React.ReactNode;
  caption?: string;
}

export default function ProductFrame({ children, caption }: ProductFrameProps) {
  return (
    <div className="border border-art-ink/10 rounded-lg overflow-hidden bg-surface-1 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      {/* Browser chrome — macOS-style traffic lights */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-art-ink/10 bg-surface-2">
        <div className="flex items-center gap-1.5">
          <span className="w-[11px] h-[11px] rounded-full bg-[#FF5F57] opacity-80" />
          <span className="w-[11px] h-[11px] rounded-full bg-[#FEBC2E] opacity-80" />
          <span className="w-[11px] h-[11px] rounded-full bg-[#28C840] opacity-80" />
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-art-ink/5 rounded h-4 max-w-[200px] mx-auto" />
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
      {caption && (
        <p className="text-[10px] text-art-ink/40 font-mono px-3 pb-3 border-t border-art-ink/5 pt-2">{caption}</p>
      )}
    </div>
  );
}
