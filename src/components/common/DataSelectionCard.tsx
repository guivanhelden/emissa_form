import React from 'react';

export interface DataSelectionCardProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onSelect: (index: number, selected: boolean) => void;
  description?: string;
  className?: string;
}

export function DataSelectionCard<T>({
  title,
  items,
  renderItem,
  onSelect,
  description,
  className = '',
}: DataSelectionCardProps<T>) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        {description && (
          <p className="text-sm text-white/80">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => onSelect(index, !(item as any).selected)}
            className={`
              relative p-4 border rounded-lg cursor-pointer transition-all
              ${(item as any).selected
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">{renderItem(item)}</div>
              {(item as any).selected && (
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-purple-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
