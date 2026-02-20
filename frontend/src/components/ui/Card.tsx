import React from 'react';

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            {title && <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>}
            {children}
        </div>
    );
}
