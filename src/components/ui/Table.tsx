import React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';

// ==========================================
// 1. TABLE STRUCTURE COMPONENT
// ==========================================
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ children, className = '', wrapperClassName = '', ...props }, ref) => {
    return (
      <div className={`w-full overflow-x-auto rounded-2xl border border-heritage-brown/10 dark:border-white/10 ${wrapperClassName}`}>
        <table
          ref={ref}
          className={`w-full border-collapse text-left text-xs sm:text-sm text-heritage-ink/80 ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';

// Table Header Row Container
export const TableHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`bg-heritage-brown/[0.03] dark:bg-white/[0.03] border-b border-heritage-brown/10 dark:border-white/10 ${className}`} {...props}>
    {children}
  </thead>
);
TableHeader.displayName = 'TableHeader';

// Table Body Container
export const TableBody = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`divide-y divide-heritage-brown/5 dark:divide-white/5 ${className}`} {...props}>
    {children}
  </tbody>
);
TableBody.displayName = 'TableBody';

// Table Row Component
export const TableRow = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`hover:bg-heritage-brown/[0.01] dark:hover:bg-white/[0.01] transition-colors duration-200 ${className}`} {...props}>
    {children}
  </tr>
);
TableRow.displayName = 'TableRow';

// Table Header Cell
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHead: React.FC<TableHeadProps> = ({
  className = '',
  children,
  sortable = false,
  sortDirection = null,
  onSort,
  ...props
}) => {
  return (
    <th
      className={`p-4 font-black uppercase tracking-wider text-[10px] font-mono text-heritage-brown/50 dark:text-white/40 select-none ${
        sortable ? 'cursor-pointer hover:text-heritage-terracotta' : ''
      } ${className}`}
      onClick={sortable && onSort ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        {sortable && sortDirection === 'asc' && <ArrowUp className="w-3.5 h-3.5 text-heritage-terracotta shrink-0" />}
        {sortable && sortDirection === 'desc' && <ArrowDown className="w-3.5 h-3.5 text-heritage-terracotta shrink-0" />}
      </div>
    </th>
  );
};
TableHead.displayName = 'TableHead';

// Table Standard Data Cell
export const TableCell = ({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`p-4 align-middle font-medium text-heritage-ink dark:text-heritage-cream ${className}`} {...props}>
    {children}
  </td>
);
TableCell.displayName = 'TableCell';

// ==========================================
// 2. TABLE PAGINATION COMPONENT
// ==========================================
export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  className?: string;
  id?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  className = '',
  id,
}) => {
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const paginationId = id || `pagination-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      id={paginationId}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 border-t border-heritage-brown/5 dark:border-white/5 ${className}`}
    >
      <p className="text-xs text-heritage-brown/40 dark:text-white/40 font-mono font-black uppercase tracking-widest">
        Showing <span className="font-sans font-extrabold text-heritage-brown dark:text-heritage-cream">{startItem}-{endItem}</span> of{' '}
        <span className="font-sans font-extrabold text-heritage-brown dark:text-heritage-cream">{totalItems}</span> Records
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 border border-heritage-brown/10 dark:border-white/10 rounded-xl hover:border-heritage-terracotta hover:text-heritage-terracotta disabled:opacity-30 disabled:hover:border-heritage-brown/10 disabled:hover:text-inherit cursor-pointer transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            // Only show neighboring page numbers to avoid long runs
            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
          })
          .map((page, index, array) => {
            const showEllipsis = index > 0 && page - array[index - 1] > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <span className="px-2 text-xs font-bold text-heritage-brown/30">...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-heritage-terracotta border-transparent text-white shadow-xs'
                      : 'border-heritage-brown/10 dark:border-white/10 hover:border-heritage-terracotta hover:text-heritage-terracotta'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 border border-heritage-brown/10 dark:border-white/10 rounded-xl hover:border-heritage-terracotta hover:text-heritage-terracotta disabled:opacity-30 disabled:hover:border-heritage-brown/10 disabled:hover:text-inherit cursor-pointer transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
TablePagination.displayName = 'TablePagination';
