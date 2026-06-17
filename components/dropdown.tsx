'use client';

import {useState, useRef, useEffect, ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import styles from './dropdown.module.css';

export type DropdownOption<T = string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  color?: string;
};

interface DropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  label?: string;
  variant?: 'default' | 'color' | 'compact';
  icon?: ReactNode;
  showChevron?: boolean;
  renderTrigger?: (selected: DropdownOption<T> | undefined) => ReactNode;
}

export function Dropdown<T = string>({
  value,
  onChange,
  options,
  label,
  variant = 'default',
  icon,
  showChevron = true,
  renderTrigger
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrap} ref={dropdownRef}>
      {label && <span className="srOnly">{label}</span>}
      <button
        className={`${styles.button} ${styles[`button_${variant}`]}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={label || 'dropdown'}
      >
        {renderTrigger ? (
          renderTrigger(selectedOption)
        ) : icon ? (
          <>
            {icon}
            {showChevron && <ChevronDown size={16} />}
          </>
        ) : variant === 'color' ? (
          <>
            <span
              className={styles.preview}
              style={{backgroundColor: selectedOption?.color || '#ccc'}}
            />
            {showChevron && <ChevronDown size={16} />}
          </>
        ) : (
          <>
            <span>{selectedOption?.label}</span>
            {(variant === 'compact' || !variant) && showChevron && <ChevronDown size={16} />}
          </>
        )}
      </button>

      {isOpen && (
        <div className={`${styles.panel} ${styles[`panel_${variant}`]}`}>
          {options.map((option) => (
            <button
              key={String(option.value)}
              className={`${styles.item} ${option.value === value ? styles.active : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              title={option.label}
              aria-label={option.label}
            >
              {variant === 'color' ? (
                <span
                  className={styles.swatch}
                  style={{backgroundColor: option.color}}
                />
              ) : (
                <>
                  {option.icon && <span className={styles.icon}>{option.icon}</span>}
                  <span className={styles.optionLabel}>{option.label}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
