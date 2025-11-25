import React, { useState } from 'react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'small' | 'medium' | 'large';
    showValue?: boolean;
}

/**
 * StarRating Component
 * Displays and optionally allows editing of a 5-star rating
 * 
 * @param rating - Current rating value (0-5, supports decimals)
 * @param onRatingChange - Callback when rating changes (makes it editable)
 * @param readonly - If true, rating cannot be changed
 * @param size - Size of stars (small: 16px, medium: 24px, large: 32px)
 * @param showValue - If true, displays numeric value next to stars
 */
export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    readonly = false,
    size = 'medium',
    showValue = false
}) => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const isEditable = !readonly && onRatingChange;
    const displayRating = hoverRating !== null ? hoverRating : rating;

    const sizeMap = {
        small: '16px',
        medium: '24px',
        large: '32px'
    };

    const starSize = sizeMap[size];

    const handleClick = (value: number) => {
        if (isEditable && onRatingChange) {
            onRatingChange(value);
        }
    };

    const handleMouseEnter = (value: number) => {
        if (isEditable) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (isEditable) {
            setHoverRating(null);
        }
    };

    const renderStar = (index: number) => {
        const value = index + 1;
        const filled = displayRating >= value;
        const halfFilled = displayRating >= value - 0.5 && displayRating < value;

        return (
            <span
                key={index}
                onClick={() => handleClick(value)}
                onMouseEnter={() => handleMouseEnter(value)}
                onMouseLeave={handleMouseLeave}
                style={{
                    cursor: isEditable ? 'pointer' : 'default',
                    fontSize: starSize,
                    color: filled || halfFilled ? '#fbbf24' : '#4b5563',
                    transition: 'color 0.2s, transform 0.1s',
                    display: 'inline-block',
                    transform: isEditable && hoverRating === value ? 'scale(1.2)' : 'scale(1)'
                }}
                title={isEditable ? `Rate ${value} star${value > 1 ? 's' : ''}` : `${rating} out of 5 stars`}
            >
                {filled ? '★' : halfFilled ? '⯨' : '☆'}
            </span>
        );
    };

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: showValue ? '8px' : '2px',
            userSelect: 'none'
        }}>
            {[0, 1, 2, 3, 4].map(renderStar)}
            {showValue && (
                <span style={{
                    fontSize: size === 'small' ? '0.85rem' : '1rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                }}>
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
};
