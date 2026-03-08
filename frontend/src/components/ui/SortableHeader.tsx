import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { SortConfig } from '@/hooks/useTableSort';

interface SortableHeaderProps<T> {
    label: string;
    sortKey: keyof T;
    sortConfig: SortConfig<T>;
    onSort: (key: keyof T) => void;
    align?: 'left' | 'right' | 'center';
    className?: string;
}

export function SortableHeader<T>({
    label,
    sortKey,
    sortConfig,
    onSort,
    align = 'left',
    className = '',
}: SortableHeaderProps<T>) {
    const isActive = sortConfig.key === sortKey;

    const getSortIcon = () => {
        if (!isActive) return <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 ml-1 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-indigo-500 ml-1 inline" />
            : <ArrowDown className="w-3 h-3 text-indigo-500 ml-1 inline" />;
    };

    const alignmentClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    return (
        <th
            className={`px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group bg-inherit ${alignmentClass} ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <span className="flex items-center gap-1 group-data-[align=right]:flex-row-reverse group-data-[align=right]:justify-start" data-align={align}>
                {label}
                {getSortIcon()}
            </span>
        </th>
    );
}
