import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

export default function PresetSelector({ selectedPreset, onSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Generate 30 character presets locally
  const presets = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: `Charakter_${i + 1}`,
      name: `Character ${i + 1}`,
    }));
  }, []);

  useEffect(() => {
    const idx = presets.findIndex((p) => p.id === selectedPreset);
    if (idx >= 0) setCurrentIndex(idx);
    else setCurrentIndex(0);
  }, [selectedPreset, presets]);

  if (presets.length === 0) return null;

  const current = presets[currentIndex];

  const handlePrev = () => {
    setImageError(false);
    const newIndex = (currentIndex - 1 + presets.length) % presets.length;
    setCurrentIndex(newIndex);
    onSelect(presets[newIndex].id);
  };

  const handleNext = () => {
    setImageError(false);
    const newIndex = (currentIndex + 1) % presets.length;
    setCurrentIndex(newIndex);
    onSelect(presets[newIndex].id);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Slideshow container */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors flex-shrink-0"
          title="Vorherige"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Character display */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
            {!imageError ? (
              <img
                src={`/assets/${current.id}.png`}
                alt={current.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <User size={32} className="text-white/30" />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs md:text-sm font-semibold text-white">
              {current.name}
            </p>
            <p className="text-xs text-white/40">
              {currentIndex + 1} / {presets.length}
            </p>
          </div>
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors flex-shrink-0"
          title="Nächste"
        >
          <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
}
