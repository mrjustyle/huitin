'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './BankSearchSelect.module.css';

interface BankItem {
  bin: string;
  shortName: string;
  name: string;
}

interface BankSearchSelectProps {
  banks: readonly BankItem[];
  value: string;
  onChange: (bin: string, shortName: string) => void;
  placeholder?: string;
}

export default function BankSearchSelect({ banks, value, onChange, placeholder = '🔍 Tìm ngân hàng...' }: BankSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = banks.find(b => b.bin === value);

  const filtered = banks.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.shortName.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.bin.includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => {
          setOpen(!open);
          setSearch('');
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {selected ? (
          <span className={styles.selectedText}>
            <strong>{selected.shortName}</strong>
            <span className={styles.selectedSub}>{selected.name}</span>
          </span>
        ) : (
          <span className={styles.placeholder}>— Chọn ngân hàng —</span>
        )}
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>Không tìm thấy ngân hàng nào</div>
            ) : (
              filtered.map(bank => (
                <button
                  key={bank.bin}
                  type="button"
                  className={`${styles.item} ${value === bank.bin ? styles.itemActive : ''}`}
                  onClick={() => {
                    onChange(bank.bin, bank.shortName);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <span className={styles.itemShort}>{bank.shortName}</span>
                  <span className={styles.itemName}>{bank.name}</span>
                  {value === bank.bin && <span className={styles.check}>✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
