import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
    key: keyof T | null;
    direction: SortDirection;
}

export function useTableSort<T>(defaultKey: keyof T | null = null, defaultDirection: SortDirection = 'desc') {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
        key: defaultKey,
        direction: defaultDirection,
    });

    const handleSort = (key: keyof T) => {
        let direction: SortDirection = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = <U extends T>(items: U[]) => {
        if (!sortConfig.key) return items;

        return [...items].sort((a, b) => {
            const valA = a[sortConfig.key!] ?? (typeof a[sortConfig.key!] === 'string' ? '' : -Infinity);
            const valB = b[sortConfig.key!] ?? (typeof b[sortConfig.key!] === 'string' ? '' : -Infinity);

            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    return {
        sortConfig,
        handleSort,
        sortedItems,
    };
}
