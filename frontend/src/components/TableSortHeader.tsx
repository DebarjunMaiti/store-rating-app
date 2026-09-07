import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TableSortHeaderProps {
  label: string;
  field: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export const TableSortHeader: React.FC<TableSortHeaderProps> = ({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = ''
}) => {
  const isActive = currentSortBy === field;

  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-800/60 transition-colors select-none ${className}`}
    >
      <div className="flex items-center gap-1.5 group">
        <span>{label}</span>
        <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">
          {isActive ? (
            currentSortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
};