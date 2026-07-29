import { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';

interface CompanyChipSelectorProps {
  selectedCompanies: string[];
  onChange: (companies: string[]) => void;
}

const DEFAULT_COMPANIES = [
  'Google',
  'Amazon',
  'Microsoft',
  'Adobe',
  'Atlassian',
  'Oracle',
  'Uber',
  'Flipkart',
  'Swiggy',
  'Razorpay',
  'CRED',
  'Netflix',
];

export default function CompanyChipSelector({ selectedCompanies, onChange }: CompanyChipSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return DEFAULT_COMPANIES.filter((c) => !selectedCompanies.includes(c));

    return DEFAULT_COMPANIES.filter(
      (c) => c.toLowerCase().includes(query) && !selectedCompanies.includes(c)
    );
  }, [searchQuery, selectedCompanies]);

  const handleSelect = (company: string) => {
    if (!selectedCompanies.includes(company)) {
      onChange([...selectedCompanies, company]);
    }
    setSearchQuery('');
  };

  const handleRemove = (company: string) => {
    onChange(selectedCompanies.filter((c) => c !== company));
  };

  const handleAddCustom = () => {
    const cleaned = searchQuery.trim();
    if (cleaned && !selectedCompanies.includes(cleaned)) {
      onChange([...selectedCompanies, cleaned]);
    }
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Selected Chips */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 dark:bg-gray-800/25 rounded-xl border border-gray-150 dark:border-gray-800">
        {selectedCompanies.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm self-center px-2">
            No companies selected yet. Search or add below.
          </span>
        ) : (
          selectedCompanies.map((company) => (
            <span
              key={company}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-100 dark:border-indigo-500/20"
            >
              {company}
              <button
                type="button"
                onClick={() => handleRemove(company)}
                className="hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (searchQuery.trim()) {
                // If it exists in suggestions, select first. Otherwise add custom.
                if (filteredSuggestions.length > 0 && filteredSuggestions[0].toLowerCase() === searchQuery.trim().toLowerCase()) {
                  handleSelect(filteredSuggestions[0]);
                } else {
                  handleAddCustom();
                }
              }
            }
          }}
          className="input-field pl-10 pr-24"
          placeholder="Search companies or type custom..."
        />
        {searchQuery.trim() && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Popular Companies
          </span>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.map((company) => (
              <button
                key={company}
                type="button"
                onClick={() => handleSelect(company)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-200"
              >
                {company}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
