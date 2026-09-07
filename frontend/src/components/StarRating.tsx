import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  max?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (val: number) => void;
  showValueText?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 5,
  readOnly = false,
  size = 'md',
  onChange,
  showValueText = false
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const displayRating = hoverValue !== null ? hoverValue : value;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= displayRating;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={readOnly}
              onClick={() => onChange && onChange(starNumber)}
              onMouseEnter={() => !readOnly && setHoverValue(starNumber)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              className={`transition-transform duration-100 ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-115 focus:outline-none'
              }`}
              title={readOnly ? `${value} out of ${max} stars` : `Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-600 fill-transparent'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
      {showValueText && (
        <span className="text-sm font-semibold text-amber-400 ml-1">
          {value > 0 ? value.toFixed(1) : 'No ratings'}
        </span>
      )}
    </div>
  );
};