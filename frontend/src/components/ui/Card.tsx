import React from 'react';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CardProps {
    title?: string;
    href?: string;
    children: React.ReactNode;
    className?: string;
}

export function Card({ title, href, children, className = '' }: CardProps) {
    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            {title && (
                href ? (
                    <Link href={href} className="group flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors duration-200">
                        <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                            {title}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                    </Link>
                ) : (
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>
                )
            )}
            {children}
        </div>
    );
}
