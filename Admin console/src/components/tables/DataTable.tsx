import React, { useState } from 'react';
import Card, { CardHeader, CardContent, CardFooter } from '../ui/Card';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: {
    key: string;
    header: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  searchable?: boolean;
  filterable?: boolean;
  actions?: React.ReactNode;
  rowActions?: (row: T) => React.ReactNode;
  pagination?: {
    itemsPerPage?: number;
    totalItems?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
  };
}

function DataTable<T extends Record<string, any>>({
  title,
  subtitle,
  data,
  columns,
  searchable = true,
  filterable = true,
  actions,
  rowActions,
  pagination = {
    itemsPerPage: 10,
    totalItems: 0,
    currentPage: 1,
    onPageChange: () => {},
  },
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Filtering logic
  const filteredData = searchTerm
    ? data.filter(item => 
        Object.values(item).some(
          value => 
            value && 
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;
    
  // Sorting logic
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      })
    : filteredData;
    
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Pagination
  const totalPages = Math.ceil((pagination.totalItems || sortedData.length) / (pagination.itemsPerPage || 10));
  const currentPageData = pagination.totalItems
    ? sortedData
    : sortedData.slice(
        ((pagination.currentPage || 1) - 1) * (pagination.itemsPerPage || 10),
        (pagination.currentPage || 1) * (pagination.itemsPerPage || 10)
      );
      
  const handlePageChange = (page: number) => {
    if (pagination.onPageChange) {
      pagination.onPageChange(page);
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={actions}
      />
      
      {(searchable || filterable) && (
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          {searchable && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          )}
          
          {filterable && (
            <button className="flex items-center text-sm text-gray-700 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              <Filter size={16} className="mr-2" />
              Filter
            </button>
          )}
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {sortConfig && sortConfig.key === column.key && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageData.length > 0 ? (
                currentPageData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td key={`${rowIndex}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {Math.min((pagination.currentPage || 1) * (pagination.itemsPerPage || 10) - (pagination.itemsPerPage || 10) + 1, pagination.totalItems || sortedData.length)} to {Math.min((pagination.currentPage || 1) * (pagination.itemsPerPage || 10), pagination.totalItems || sortedData.length)} of {pagination.totalItems || sortedData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}
              disabled={(pagination.currentPage || 1) === 1}
              className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const currentPage = pagination.currentPage || 1;
                let pageNumber: number;
                
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else {
                  if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                      pageNumber === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}
              disabled={(pagination.currentPage || 1) === totalPages}
              className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default DataTable;