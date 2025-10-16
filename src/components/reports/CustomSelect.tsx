import React, { useEffect, useRef, useState } from 'react';

export interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  value: T | '' | null;
  placeholder?: string;
  options: Array<Option<T>>;
  onChange: (value: T | null) => void;
  className?: string;
}

function CustomSelect<T extends string | number>({ value, placeholder = 'Seleccionar...', options, onChange, className }: Props<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className={`custom-select ${className ?? ''}`}>
      <button
        type="button"
        className="cs-control"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className="cs-value">{selected ? selected.label : placeholder}</span>
        <span className="cs-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="cs-menu" role="listbox">
          <li
            className={`cs-option ${value === '' || value === null ? 'selected' : ''}`}
            role="option"
            aria-selected={value === '' || value === null}
            onClick={() => { onChange(null); setOpen(false); }}
          >
            Todas
          </li>
          {options.map(opt => (
            <li
              key={String(opt.value)}
              className={`cs-option ${opt.value === value ? 'selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              title={opt.label}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomSelect;


