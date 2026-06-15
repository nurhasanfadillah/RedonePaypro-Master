import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Cari...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query dengan label dari value yang terpilih
  useEffect(() => {
    const selected = options.find(o => o.value === value);
    setQuery(selected ? selected.label : '');
  }, [value, options]);

  // Tutup dropdown dan kembalikan query saat klik di luar
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const selected = options.find(o => o.value === value);
        setQuery(selected ? selected.label : '');
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [value, options]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleFocus = () => {
    setIsOpen(true);
    setQuery('');
  };

  const handleSelect = (option: { value: string; label: string }) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-3 md:py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
        />
        <ChevronDown
          size={16}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(option => (
              <div
                key={option.value}
                onMouseDown={() => handleSelect(option)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  option.value === value
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 italic">
              Tidak ada hasil untuk "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
