'use client';

import React, { useState } from 'react';
import { MoreHorizontal, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, CheckSquare, Square } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string | number;
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
}

export default function DataTable<T>({ columns, data, onRowClick, actions, pageSize = 10, selectable = false, selectedKeys = new Set(), onSelectionChange, rowKey }: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
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
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              {selectable && (
                <th style={{ padding: '16px', width: '40px', textAlign: 'center' }}>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!onSelectionChange || !rowKey) return;
                      const allSelected = paginatedData.length > 0 && paginatedData.every(item => selectedKeys.has(rowKey(item)));
                      if (!allSelected) {
                        const newKeys = new Set(selectedKeys);
                        paginatedData.forEach(item => newKeys.add(rowKey(item)));
                        onSelectionChange(newKeys);
                      } else {
                        const newKeys = new Set(selectedKeys);
                        paginatedData.forEach(item => newKeys.delete(rowKey(item)));
                        onSelectionChange(newKeys);
                      }
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: (paginatedData.length > 0 && paginatedData.every(item => rowKey && selectedKeys.has(rowKey(item)))) ? 'var(--accent)' : 'var(--text-muted)'
                    }}
                  >
                    {(paginatedData.length > 0 && paginatedData.every(item => rowKey && selectedKeys.has(rowKey(item)))) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                </th>
              )}
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', width: col.width }}>
                  {col.header}
                </th>
              ))}
              {actions && (
                <th style={{ padding: '16px', width: '60px' }}></th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rIdx) => (
                <tr 
                  key={rIdx} 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {selectable && rowKey && (
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!onSelectionChange) return;
                          const newKeys = new Set(selectedKeys);
                          const isChecked = selectedKeys.has(rowKey(item));
                          if (!isChecked) newKeys.add(rowKey(item));
                          else newKeys.delete(rowKey(item));
                          onSelectionChange(newKeys);
                        }}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: selectedKeys.has(rowKey(item)) ? 'var(--accent)' : 'var(--text-muted)'
                        }}
                      >
                        {selectedKeys.has(rowKey(item)) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: '16px', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: col.width === '1%' ? 'nowrap' : 'normal' }}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ padding: '16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                          <MoreHorizontal size={18} />
                        </button>
                        <div style={{ display: 'none' }}>
                           {actions(item)}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
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
