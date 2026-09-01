'use client';

import React, { useState } from 'react';
import { MoreHorizontal, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  pageSize?: number;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  rowKey?: (item: T) => string;
  isLoading?: boolean;
  expandableContent?: (item: T) => React.ReactNode;
}

export default function DataTable<T>({ columns, data, onRowClick, actions, pageSize = 10, selectable = false, selectedKeys = new Set(), onSelectionChange, rowKey, isLoading = false, expandableContent }: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const dropdownRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownRow !== null) {
        const currentDropdown = dropdownRefs.current[openDropdownRow];
        if (currentDropdown && !currentDropdown.contains(e.target as Node)) {
          setOpenDropdownRow(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownRow]);
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Logic for 3 page numbers
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);
  if (endPage - startPage < 2 && totalPages >= 3) {
    startPage = Math.max(1, endPage - 2);
  }
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const showNavButtons = totalPages > 3;

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <div>
        <table className="admin-table">
          <thead>
            <tr>
              {expandableContent && <th style={{ width: '40px' }}></th>}
              {selectable && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      className="admin-checkbox"
                      checked={paginatedData.length > 0 && paginatedData.every(item => rowKey && selectedKeys.has(rowKey(item)))}
                      onChange={(e) => {
                        if (!onSelectionChange || !rowKey) return;
                        if (e.target.checked) {
                          const newKeys = new Set(selectedKeys);
                          paginatedData.forEach(item => newKeys.add(rowKey(item)));
                          onSelectionChange(newKeys);
                        } else {
                          const newKeys = new Set(selectedKeys);
                          paginatedData.forEach(item => newKeys.delete(rowKey(item)));
                          onSelectionChange(newKeys);
                        }
                      }}
                    />
                  </label>
                </th>
              )}
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
              {actions && (
                <th style={{ width: '60px' }}></th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0) + (expandableContent ? 1 : 0)} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0) + (expandableContent ? 1 : 0)} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rIdx) => (
                <React.Fragment key={rIdx}>
                  <tr 
                    style={{ cursor: onRowClick ? 'pointer' : 'default', background: expandedRows.has(rIdx) ? 'var(--bg-secondary)' : 'transparent' }}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {expandableContent && (
                      <td style={{ textAlign: 'center', cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        const newSet = new Set(expandedRows);
                        if (newSet.has(rIdx)) newSet.delete(rIdx);
                        else newSet.add(rIdx);
                        setExpandedRows(newSet);
                      }}>
                        {expandedRows.has(rIdx) ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRightIcon size={18} color="var(--text-muted)" />}
                      </td>
                    )}
                  {selectable && rowKey && (
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          className="admin-checkbox"
                          checked={selectedKeys.has(rowKey(item))}
                          onChange={(e) => {
                            if (!onSelectionChange) return;
                            const newKeys = new Set(selectedKeys);
                            if (e.target.checked) newKeys.add(rowKey(item));
                            else newKeys.delete(rowKey(item));
                            onSelectionChange(newKeys);
                          }}
                        />
                      </label>
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: col.width === '1%' ? 'nowrap' : 'normal', textAlign: col.align || 'left' }}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div ref={(el) => { dropdownRefs.current[rIdx] = el; }} style={{ position: 'relative', display: 'inline-block' }}>
                        <button 
                          onClick={() => setOpenDropdownRow(openDropdownRow === rIdx ? null : rIdx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openDropdownRow === rIdx && (
                          <div 
                            onClick={() => setOpenDropdownRow(null)}
                            style={{ 
                              position: 'absolute', 
                              right: 0, 
                              zIndex: 50,
                              ...(paginatedData.length > 3 && rIdx >= paginatedData.length - 2 ? { bottom: '100%', marginBottom: '2px' } : { top: '100%', marginTop: '2px' })
                            }}
                          >
                             {actions(item)}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandableContent && expandedRows.has(rIdx) && (
                  <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0) + (expandableContent ? 1 : 0)} style={{ padding: 0, borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                        {expandableContent(item)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalItems > 0 && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Hiển thị {Math.min(currentPage * pageSize, totalItems)}/{totalItems}
          </span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {showNavButtons && (
              <>
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }}
                >
                  <ChevronLeft size={16} />
                </button>
              </>
            )}

            {pages.map(p => (
              <button 
                key={p}
                onClick={() => setCurrentPage(p)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', height: '32px', border: p === currentPage ? '1px solid var(--accent)' : '1px solid var(--border-color)', background: p === currentPage ? 'var(--accent)' : 'white', borderRadius: '6px', cursor: 'pointer', color: p === currentPage ? 'white' : 'var(--text-primary)', fontSize: '13px', fontWeight: p === currentPage ? 600 : 400, padding: '0 8px' }}
              >
                {p}
              </button>
            ))}

            {showNavButtons && (
              <>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)' }}
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--border-color)', background: 'white', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)' }}
                >
                  <ChevronsRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
