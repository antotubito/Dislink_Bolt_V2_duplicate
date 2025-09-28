import React from 'react';
import { LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
    linkTo?: string;
    textClassName?: string;
    iconClassName?: string;
}

export function Logo({
    size = 'md',
    showText = true,
    className = '',
    linkTo = '/',
    textClassName = '',
    iconClassName = ''
}: LogoProps) {
    const sizeClasses = {
        sm: {
            container: 'p-1.5',
            icon: 'h-4 w-4',
            text: 'text-sm'
        },
        md: {
            container: 'p-2',
            icon: 'h-6 w-6',
            text: 'text-xl'
        },
        lg: {
            container: 'p-3',
            icon: 'h-8 w-8',
            text: 'text-2xl'
        }
    };

    const currentSize = sizeClasses[size];

    const logoContent = (
        <div className={`flex items-center ${className}`}>
            <div className={`bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg mr-2 ${currentSize.container} ${iconClassName}`}>
                <LinkIcon className={`text-white ${currentSize.icon}`} />
            </div>
            {showText && (
                <span className={`font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent ${currentSize.text} ${textClassName}`}>
                    Dislink
                </span>
            )}
        </div>
    );

    if (linkTo) {
        return (
            <Link to={linkTo} className="flex-shrink-0">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
}
