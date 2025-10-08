"use client";

import React, { useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi, ICellRendererParams, ValueFormatterParams, ValueGetterParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register ag-grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom styles for enhanced appearance
const customGridStyles = `
  .custom-ag-grid {
    --ag-header-height: 60px;
    --ag-row-height: 60px;
    --ag-cell-height: 60px;
    --ag-row-line-height: 60px;
    --ag-header-foreground-color: #1f2937;
    --ag-header-background-color: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    --ag-header-cell-hover-background-color: rgba(255, 255, 255, 0.1);
    --ag-header-cell-moving-background-color: rgba(255, 255, 255, 0.2);
    --ag-odd-row-background-color: #f8fafc;
    --ag-row-hover-color: #e0f2fe;
    --ag-selected-row-background-color: #dbeafe;
    --ag-border-color: #e2e8f0;
    --ag-cell-horizontal-border: solid #e2e8f0;
    --ag-row-border-color: #f1f5f9;
    --ag-font-size: 14px;
    --ag-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --ag-border-radius: 12px;
    --ag-wrapper-border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    direction: rtl;
  }

  .custom-ag-grid .ag-header {
    background: white;
    color: #1f2937;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 12px;
    border-bottom: 2px solid #e2e8f0;
  }

  .custom-ag-grid .ag-header-cell {
    border-right: 1px solid #e2e8f0;
    padding: 16px 12px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 60px !important;
    height: 60px !important;
  }

  .custom-ag-grid .ag-center-header {
    text-align: center;
    justify-content: center;
  }

  .custom-ag-grid .ag-header-cell:hover {
    background: #f8fafc;
    transition: all 0.2s ease;
  }

  /* Force header row height */
  .custom-ag-grid .ag-header-row,
  .custom-ag-grid .ag-header-row-level-0 {
    min-height: 60px !important;
    height: 60px !important;
  }

  .custom-ag-grid .ag-row {
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.2s ease;
    min-height: 60px !important;
    height: 60px !important;
  }

  .custom-ag-grid .ag-row:hover {
    background: linear-gradient(90deg, #e0f2fe 0%, #f0f9ff 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .custom-ag-grid .ag-row-odd {
    background: #f8fafc;
  }

  .custom-ag-grid .ag-row-selected {
    background: linear-gradient(90deg, #dbeafe 0%, #e0f2fe 100%);
    border-left: 4px solid #3b82f6;
  }

  /* Force row height for all ag-grid elements */
  .custom-ag-grid .ag-row,
  .custom-ag-grid .ag-row-even,
  .custom-ag-grid .ag-row-odd,
  .custom-ag-grid .ag-row-level-0,
  .custom-ag-grid .ag-row-wrapper,
  .custom-ag-grid .ag-row-container,
  .custom-ag-grid .ag-center-cols-container .ag-row,
  .custom-ag-grid .ag-center-cols-container .ag-row-wrapper {
    min-height: 60px !important;
    height: 60px !important;
  }

  /* Force row container heights */
  .custom-ag-grid .ag-center-cols-container,
  .custom-ag-grid .ag-center-cols-viewport,
  .custom-ag-grid .ag-body-viewport {
    line-height: 60px !important;
  }

  /* Additional row height enforcement */
  .custom-ag-grid .ag-body-horizontal-scroll-viewport,
  .custom-ag-grid .ag-body-horizontal-scroll-container,
  .custom-ag-grid .ag-body-rows-viewport,
  .custom-ag-grid .ag-body-rows-container {
    line-height: 60px !important;
  }

  /* Ensure proper spacing between rows */
  .custom-ag-grid .ag-row + .ag-row {
    margin-top: 0 !important;
  }

  .custom-ag-grid .ag-cell {
    border-right: 1px solid #f1f5f9;
    padding: 16px 12px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
    min-height: 60px !important;
    height: 60px !important;
  }

  .custom-ag-grid .ag-cell:focus {
    border: 2px solid #3b82f6;
    outline: none;
  }

  .custom-ag-grid .ag-pinned-left-cols-container {
    background: white;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  }

  .custom-ag-grid .ag-pinned-right-cols-container {
    background: white;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  }


  .custom-ag-grid .ag-filter-toolpanel-header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    font-weight: 600;
  }

  .custom-ag-grid .ag-side-bar {
    background: #f8fafc;
    border-left: 1px solid #e2e8f0;
  }

  .custom-ag-grid .ag-status-bar {
    background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
    border-top: 1px solid #cbd5e1;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
  }

  .custom-ag-grid .ag-paging-panel {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 16px;
  }

  .custom-ag-grid .ag-paging-button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .custom-ag-grid .ag-paging-button:hover:not([disabled]) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .custom-ag-grid .ag-paging-button[disabled] {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .custom-ag-grid .ag-paging-row-summary-panel {
    color: #6b7280;
    font-weight: 500;
  }

  .custom-ag-grid .ag-loading {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
  }

  .custom-ag-grid .ag-overlay-loading-wrapper {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
  }

  .custom-ag-grid .ag-overlay-no-rows-wrapper {
    background: #f8fafc;
    color: #6b7280;
    font-size: 16px;
    font-weight: 500;
  }

  /* Custom scrollbar */
  .custom-ag-grid ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .custom-ag-grid ::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .custom-ag-grid ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 4px;
  }

  .custom-ag-grid ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  }

  /* Animation for row updates */
  .custom-ag-grid .ag-row-updating {
    animation: pulse 1s ease-in-out;
  }

  @keyframes pulse {
    0% { background-color: #fef3c7; }
    50% { background-color: #fde68a; }
    100% { background-color: transparent; }
  }

  /* Enhanced button styles */
  .custom-ag-grid .ag-button {
    background: transparent;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: none;
  }

  .custom-ag-grid .ag-button:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Column menu button specific styling */
  .custom-ag-grid .ag-header-cell-menu-button {
    background: transparent !important;
    border: none !important;
    color: #6b7280;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .custom-ag-grid .ag-header-cell-menu-button:hover {
    background: #f3f4f6 !important;
    color: #374151;
    transform: none;
    box-shadow: none;
  }

  .custom-ag-grid .ag-header-cell-menu-button .ag-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  /* Filter button specific styling */
  .custom-ag-grid .ag-floating-filter-button,
  .custom-ag-grid .ag-header-cell-filter-button {
    background: transparent !important;
    border: none !important;
    color: #6b7280;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .custom-ag-grid .ag-floating-filter-button:hover,
  .custom-ag-grid .ag-header-cell-filter-button:hover {
    background: #f3f4f6 !important;
    color: #374151;
    transform: none;
    box-shadow: none;
  }

  /* Center the filter icon span inside the button */
  .custom-ag-grid .ag-floating-filter-button span,
  .custom-ag-grid .ag-header-cell-filter-button span,
  .custom-ag-grid .ag-floating-filter-button .ag-icon,
  .custom-ag-grid .ag-header-cell-filter-button .ag-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  /* Context menu styling */
  .custom-ag-grid .ag-menu {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .custom-ag-grid .ag-menu-option {
    padding: 8px 16px;
    color: #374151;
    transition: all 0.2s ease;
  }

  .custom-ag-grid .ag-menu-option:hover {
    background: #f3f4f6;
    color: #1f2937;
  }

  /* Tooltip styling */
  .custom-ag-grid .ag-tooltip {
    background: #1f2937;
    color: white;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* Column dropdown styling */
  .column-dropdown-container .dropdown-content {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .column-dropdown-container .checkbox-custom {
    transition: all 0.2s ease;
  }

  .column-dropdown-container .checkbox-custom:hover {
    transform: scale(1.05);
  }
`;
import LoadingLink from '@/components/LoadingLink';
import { formatCurrency } from '@/utils/formatCurrency';
import { Eye, ExternalLink, Download, Filter, RefreshCw, Settings, Columns, Search, EyeOff, ToggleLeft, ChevronDown, Check } from 'lucide-react';

interface CarData {
  car_id: number;
  car: {
    province: string;
    city: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    odometer: number;
    condition: string;
    color: string;
    engine: string;
    auction_status: string;
  };
  broadcasts: Array<{
    stream_url: string;
  }>;
  bids: Array<{
    increment: number;
    bid_amount: number;
  }>;
  opening_price: number;
  minimum_bid: number;
  maximum_bid: number;
  current_bid: number;
  auction_type: string;
}

interface InstantAuctionGridProps {
  cars: CarData[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onDataUpdate?: (updatedCars: CarData[]) => void;
}

// Custom cell renderers
const StreamLinkRenderer = (params: ICellRendererParams) => {
  const broadcasts = params.data?.broadcasts || [];
  if (broadcasts.length > 0) {
    return (
      <LoadingLink
        target="_blank"
        href={broadcasts[0].stream_url}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        <ExternalLink className="h-3 w-3" />
        بث مباشر
      </LoadingLink>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm">
      غير متوفر
    </span>
  );
};

const DetailsButtonRenderer = (params: ICellRendererParams) => {
  return (
    <LoadingLink
      href={`/carDetails/${params.data.car_id}`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
    >
      <Eye className="h-4 w-4" />
      عرض
    </LoadingLink>
  );
};

const StatusRenderer = (params: ICellRendererParams) => {
  const status = params.value;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_auction':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_auction':
        return 'جاري المزايدة';
      case 'sold':
        return 'تم البيع';
      case 'expired':
        return 'انتهى';
      default:
        return 'غير محدد';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(status)}`}>
      <div className={`w-2 h-2 rounded-full ${status === 'in_auction' ? 'bg-green-500 animate-pulse' : status === 'sold' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
      {getStatusText(status)}
    </span>
  );
};

const CurrencyRenderer = (params: ValueFormatterParams) => {
  const value = params.value || 0;
  const formattedValue = formatCurrency(value);
  return (
    <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded-md text-sm">
      {formattedValue}
    </span>
  );
};

const BidCountRenderer = (params: ICellRendererParams) => {
  const bidCount = params.data?.bids?.length || 0;
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm shadow-sm">
      {bidCount}
    </span>
  );
};

const IncrementRenderer = (params: ICellRendererParams) => {
  const lastBid = params.data?.bids?.[params.data.bids.length - 1];
  if (lastBid) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 font-bold rounded-lg shadow-sm border border-green-300">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        {formatCurrency(lastBid.increment)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
      0
    </span>
  );
};

const PercentageRenderer = (params: ICellRendererParams) => {
  const lastBid = params.data?.bids?.[params.data.bids.length - 1];
  if (lastBid && lastBid.bid_amount > 0) {
    const percentage = ((lastBid.increment / lastBid.bid_amount) * 100).toFixed(2);
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 font-bold rounded-lg shadow-sm border border-emerald-300">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
        {percentage}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
      0%
    </span>
  );
};

export interface InstantAuctionGridRef {
  updateData: (newData: CarData[]) => void;
  refreshGrid: () => void;
  exportData: () => void;
}

const InstantAuctionGrid = forwardRef<InstantAuctionGridRef, InstantAuctionGridProps>(
  ({ cars, loading, onRefresh, onExport, onDataUpdate }, ref) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<{[key: string]: boolean}>({});

  // Column configuration for easy management
  const columnConfig = useMemo(() => [
    { key: 'broadcasts', label: 'رابط البث', defaultVisible: true },
    { key: 'car.province', label: 'المنطقة', defaultVisible: true },
    { key: 'car.city', label: 'المدينة', defaultVisible: true },
    { key: 'car.make', label: 'الماركة', defaultVisible: true },
    { key: 'car.model', label: 'الموديل', defaultVisible: true },
    { key: 'car.year', label: 'سنة الصنع', defaultVisible: true },
    { key: 'car.plate', label: 'رقم اللوحة', defaultVisible: true },
    { key: 'car.odometer', label: 'العداد', defaultVisible: true },
    { key: 'car.condition', label: 'حالة السيارة', defaultVisible: true },
    { key: 'car.color', label: 'لون السيارة', defaultVisible: true },
    { key: 'car.engine', label: 'نوع الوقود', defaultVisible: true },
    { key: 'bids', label: 'المزايدات المقدمة', defaultVisible: true },
    { key: 'opening_price', label: 'سعر الافتتاح', defaultVisible: true },
    { key: 'minimum_bid', label: 'أقل سعر', defaultVisible: true },
    { key: 'maximum_bid', label: 'أعلى سعر', defaultVisible: true },
    { key: 'current_bid', label: 'آخر سعر', defaultVisible: true },
    { key: 'increment', label: 'مبلغ الزيادة', defaultVisible: true },
    { key: 'percentage', label: 'نسبة التغير', defaultVisible: true },
    { key: 'car.auction_status', label: 'نتيجة المزايدة', defaultVisible: true },
    { key: 'car_id', label: 'تفاصيل', defaultVisible: true },
  ], []);

  // Initialize visible columns
  useEffect(() => {
    const initialVisibility: {[key: string]: boolean} = {};
    columnConfig.forEach(col => {
      initialVisibility[col.key] = col.defaultVisible;
    });
    setVisibleColumns(initialVisibility);
  }, [columnConfig]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnDropdown) {
        const target = event.target as Element;
        if (!target.closest('.column-dropdown-container')) {
          setShowColumnDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown]);

  // Column definitions with all possible features
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'رابط البث',
      field: 'broadcasts',
      cellRenderer: StreamLinkRenderer,
      width: 120,
      pinned: 'left',
      filter: false,
      sortable: false,
      resizable: true,
      headerTooltip: 'رابط البث المباشر للسيارة',
    },
    {
      headerName: 'المنطقة',
      field: 'car.province',
      width: 100,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      resizable: true,
      headerTooltip: 'المنطقة التي توجد فيها السيارة',
    },
    {
      headerName: 'المدينة',
      field: 'car.city',
      width: 100,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      resizable: true,
      headerTooltip: 'المدينة التي توجد فيها السيارة',
    },
    {
      headerName: 'الماركة',
      field: 'car.make',
      width: 120,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: Array.from(new Set(cars.map(car => car.car.make))),
      },
      resizable: true,
      headerTooltip: 'ماركة السيارة',
    },
    {
      headerName: 'الموديل',
      field: 'car.model',
      width: 120,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      resizable: true,
      headerTooltip: 'موديل السيارة',
    },
    {
      headerName: 'سنة الصنع',
      field: 'car.year',
      width: 100,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'سنة صنع السيارة',
    },
    {
      headerName: 'رقم اللوحة',
      field: 'car.plate',
      width: 120,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith'],
        defaultOption: 'contains',
      },
      resizable: true,
      headerTooltip: 'رقم لوحة السيارة',
    },
    {
      headerName: 'العداد',
      field: 'car.odometer',
      width: 100,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'عدد الكيلومترات المقطوعة',
    },
    {
      headerName: 'حالة السيارة',
      field: 'car.condition',
      width: 120,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: Array.from(new Set(cars.map(car => car.car.condition))),
      },
      resizable: true,
      headerTooltip: 'الحالة العامة للسيارة',
    },
    {
      headerName: 'لون السيارة',
      field: 'car.color',
      width: 100,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: Array.from(new Set(cars.map(car => car.car.color))),
      },
      resizable: true,
      headerTooltip: 'لون السيارة',
    },
    {
      headerName: 'نوع الوقود',
      field: 'car.engine',
      width: 100,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: Array.from(new Set(cars.map(car => car.car.engine))),
      },
      resizable: true,
      headerTooltip: 'نوع المحرك/الوقود',
    },
    {
      headerName: 'المزايدات المقدمة',
      field: 'bids',
      cellRenderer: BidCountRenderer,
      width: 130,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'عدد المزايدات المقدمة على السيارة',
    },
    {
      headerName: 'سعر الافتتاح',
      field: 'opening_price',
      cellRenderer: CurrencyRenderer,
      width: 120,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'السعر الافتتاحي للمزايدة',
    },
    {
      headerName: 'أقل سعر',
      field: 'minimum_bid',
      cellRenderer: CurrencyRenderer,
      width: 100,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'أقل سعر مقبول للمزايدة',
    },
    {
      headerName: 'أعلى سعر',
      field: 'maximum_bid',
      cellRenderer: CurrencyRenderer,
      width: 100,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'أعلى سعر مقبول للمزايدة',
    },
    {
      headerName: 'آخر سعر',
      field: 'current_bid',
      cellRenderer: CurrencyRenderer,
      width: 100,
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
        defaultOption: 'equals',
      },
      resizable: true,
      headerTooltip: 'آخر سعر مزايدة',
    },
    {
      headerName: 'مبلغ الزيادة',
      field: 'bids',
      cellRenderer: IncrementRenderer,
      width: 120,
      filter: false,
      sortable: false,
      resizable: true,
      headerTooltip: 'مبلغ آخر زيادة في المزايدة',
    },
    {
      headerName: 'نسبة التغير',
      field: 'bids',
      cellRenderer: PercentageRenderer,
      width: 100,
      filter: false,
      sortable: false,
      resizable: true,
      headerTooltip: 'نسبة التغير في آخر مزايدة',
    },
    {
      headerName: 'نتيجة المزايدة',
      field: 'car.auction_status',
      cellRenderer: StatusRenderer,
      width: 130,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['in_auction', 'sold', 'expired'],
      },
      resizable: true,
      headerTooltip: 'الحالة الحالية للمزايدة',
    },
    {
      headerName: 'تفاصيل',
      field: 'car_id',
      cellRenderer: DetailsButtonRenderer,
      width: 100,
      pinned: 'right',
      filter: false,
      sortable: false,
      resizable: true,
      headerTooltip: 'عرض تفاصيل السيارة',
    },
  ], [cars]);

  // Default column definitions
  const defaultColDef: ColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'],
    cellStyle: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center'
    },
    headerClass: 'ag-center-header',
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    // Enable all features
    enableRangeSelection: true,
    enableCharts: true,
    enableClipboard: true,
    enableCellTextSelection: true,
    suppressRowClickSelection: false,
    rowSelection: 'multiple' as const,
    animateRows: true,
    suppressRowTransform: false,
    enableRtl: true,
    rowHeight: 60,
    headerHeight: 60,
    
    // Pagination
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [25, 50, 100, 200],
    
    // Side bar
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'الأعمدة',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: true,
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressColumnFilter: false,
            suppressColumnSelectAll: false,
            suppressColumnExpandAll: false,
          },
        },
        {
          id: 'filters',
          labelDefault: 'الفلاتر',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        },
      ],
      defaultToolPanel: 'columns',
      hiddenByDefault: true,
    },
    
    // Status bar
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        { statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' },
      ],
    },
    
    // Context menu
    enableContextMenu: true,
    contextMenuItems: [
      'copy',
      'copyWithHeaders',
      'paste',
      'separator',
      'export',
      'separator',
      'autoSizeAll',
      'resetColumns',
      'separator',
      'chartRange',
    ],
    
    // Export
    defaultExportParams: {
      fileName: `instant-auction-${new Date().toISOString().split('T')[0]}`,
    },
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onSelectionChanged = useCallback(() => {
    const selectedRows = gridApi?.getSelectedRows();
    console.log('Selected rows:', selectedRows);
  }, [gridApi]);

  const onFilterChanged = useCallback(() => {
    const filteredRows = gridApi?.getDisplayedRowCount();
    console.log('Filtered rows:', filteredRows);
  }, [gridApi]);

  const exportToCsv = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: `instant-auction-${new Date().toISOString().split('T')[0]}.csv`,
    });
  }, [gridApi]);

  const exportToExcel = useCallback(() => {
    gridApi?.exportDataAsExcel({
      fileName: `instant-auction-${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  }, [gridApi]);

  const autoSizeAllColumns = useCallback(() => {
    gridApi?.sizeColumnsToFit();
  }, [gridApi]);

  const resetColumns = useCallback(() => {
    gridApi?.resetColumnState();
  }, [gridApi]);

  const clearFilters = useCallback(() => {
    if (gridApi) {
      gridApi.setFilterModel(null);
      gridApi.setGridOption('quickFilterText', '');
    }
    setQuickFilter('');
  }, [gridApi]);

  const toggleColumnPanel = useCallback(() => {
    setShowColumnPanel(prev => !prev);
    if (gridApi) {
      const currentPanel = gridApi.getOpenedToolPanel();
      if (currentPanel === 'columns') {
        gridApi.closeToolPanel();
      } else {
        gridApi.openToolPanel('columns');
      }
    }
  }, [gridApi]);

  const hideAllColumns = useCallback(() => {
    if (gridApi) {
      const allColumns = gridApi.getColumns();
      allColumns?.forEach(column => {
        gridApi.setColumnsVisible([column], false);
      });
    }
  }, [gridApi]);

  const showAllColumns = useCallback(() => {
    if (gridApi) {
      const allColumns = gridApi.getColumns();
      allColumns?.forEach(column => {
        gridApi.setColumnsVisible([column], true);
      });
      // Update state
      const newVisibility: {[key: string]: boolean} = {};
      columnConfig.forEach(col => {
        newVisibility[col.key] = true;
      });
      setVisibleColumns(newVisibility);
    }
  }, [gridApi, columnConfig]);

  const toggleColumnVisibility = useCallback((columnKey: string) => {
    if (gridApi) {
      const column = gridApi.getColumn(columnKey);
      if (column) {
        const newVisibility = !visibleColumns[columnKey];
        gridApi.setColumnsVisible([column], newVisibility);
        setVisibleColumns(prev => ({
          ...prev,
          [columnKey]: newVisibility
        }));
      }
    }
  }, [gridApi, visibleColumns]);

  const selectAllColumns = useCallback(() => {
    const newVisibility: {[key: string]: boolean} = {};
    columnConfig.forEach(col => {
      newVisibility[col.key] = true;
    });
    setVisibleColumns(newVisibility);
    if (gridApi) {
      const allColumns = gridApi.getColumns();
      allColumns?.forEach(column => {
        gridApi.setColumnsVisible([column], true);
      });
    }
  }, [gridApi, columnConfig]);

  const deselectAllColumns = useCallback(() => {
    const newVisibility: {[key: string]: boolean} = {};
    columnConfig.forEach(col => {
      newVisibility[col.key] = false;
    });
    setVisibleColumns(newVisibility);
    if (gridApi) {
      const allColumns = gridApi.getColumns();
      allColumns?.forEach(column => {
        gridApi.setColumnsVisible([column], false);
      });
    }
  }, [gridApi, columnConfig]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    updateData: (newData: CarData[]) => {
      if (gridApi) {
        gridApi.setGridOption('rowData', newData);
        if (onDataUpdate) {
          onDataUpdate(newData);
        }
      }
    },
    refreshGrid: () => {
      gridApi?.refreshCells();
    },
    exportData: () => {
      exportToCsv();
    },
  }), [gridApi, onDataUpdate, exportToCsv]);

  return (
    <div className="w-full">
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customGridStyles }} />
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              سيارات المزاد الفوري
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">
              {cars.length} سيارة
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="بحث سريع..."
              value={quickFilter}
              onChange={(e) => {
                setQuickFilter(e.target.value);
                if (gridApi) {
                  gridApi.setGridOption('quickFilterText', e.target.value);
                }
              }}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 w-64"
            />
          </div>
          
          {/* Action Buttons */}
          
          
          <button
            onClick={autoSizeAllColumns}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Columns className="h-4 w-4" />
            ضبط
          </button>
          
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Filter className="h-4 w-4" />
            مسح
          </button>
          
          {/* Column Selection Dropdown */}
          <div className="relative column-dropdown-container">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Columns className="h-4 w-4" />
              اختيار الأعمدة
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showColumnDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto dropdown-content">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">اختيار الأعمدة</h3>
                    <button
                      onClick={() => setShowColumnDropdown(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllColumns}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      تحديد الكل
                    </button>
                    <button
                      onClick={deselectAllColumns}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  {columnConfig.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key] || false}
                          onChange={() => toggleColumnVisibility(column.key)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all checkbox-custom ${
                          visibleColumns[column.key] 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          {visibleColumns[column.key] && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700 flex-1">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine w-full custom-ag-grid" style={{ height: '70vh', direction: 'rtl' }}>
        <AgGridReact
          ref={gridRef}
          rowData={cars}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onFilterChanged={onFilterChanged}
          loading={loading}
          localeText={{
            // Arabic locale text
            page: 'صفحة',
            more: 'المزيد',
            to: 'إلى',
            of: 'من',
            next: 'التالي',
            last: 'الأخير',
            first: 'الأول',
            previous: 'السابق',
            loadingOoo: 'جاري التحميل...',
            selectAll: 'تحديد الكل',
            searchOoo: 'البحث...',
            blanks: 'فارغ',
            filterOoo: 'فلتر...',
            applyFilter: 'تطبيق الفلتر',
            equals: 'يساوي',
            notEqual: 'لا يساوي',
            lessThan: 'أقل من',
            greaterThan: 'أكبر من',
            inRange: 'في النطاق',
            contains: 'يحتوي على',
            notContains: 'لا يحتوي على',
            startsWith: 'يبدأ بـ',
            endsWith: 'ينتهي بـ',
            andCondition: 'و',
            orCondition: 'أو',
            columns: 'الأعمدة',
            filters: 'الفلاتر',
            pivotMode: 'وضع المحور',
            groups: 'المجموعات',
            rowGroupColumns: 'أعمدة تجميع الصفوف',
            valueColumns: 'أعمدة القيم',
            pivotColumns: 'أعمدة المحور',
            toolPanel: 'لوحة الأدوات',
            noRowsToShow: 'لا توجد صفوف للعرض',
            pinColumn: 'تثبيت العمود',
            valueAggregation: 'تجميع القيم',
            autosizeThiscolumn: 'ضبط حجم هذا العمود',
            autosizeAllColumns: 'ضبط حجم جميع الأعمدة',
            groupBy: 'تجميع حسب',
            ungroupBy: 'إلغاء التجميع حسب',
            resetColumns: 'إعادة تعيين الأعمدة',
            expandAll: 'توسيع الكل',
            collapseAll: 'طي الكل',
            copy: 'نسخ',
            ctrlC: 'Ctrl+C',
            paste: 'لصق',
            ctrlV: 'Ctrl+V',
            export: 'تصدير',
            csvExport: 'تصدير CSV',
            excelExport: 'تصدير Excel',
            copyWithHeaders: 'نسخ مع العناوين',
            copyWithGroupHeaders: 'نسخ مع عناوين المجموعات',
            chartRange: 'نطاق الرسم البياني',
            pivotChart: 'رسم بياني محوري',
            chartSettings: 'إعدادات الرسم البياني',
            chartData: 'بيانات الرسم البياني',
            chartFormat: 'تنسيق الرسم البياني',
            chartType: 'نوع الرسم البياني',
            chartTitle: 'عنوان الرسم البياني',
            chartSubtitle: 'العنوان الفرعي للرسم البياني',
            chartXAxis: 'محور X',
            chartYAxis: 'محور Y',
            chartLegend: 'الأسطورة',
            chartTooltip: 'تلميح الرسم البياني',
            chartSeries: 'سلسلة الرسم البياني',
            chartDataLabels: 'تسميات البيانات',
            chartGridLines: 'خطوط الشبكة',
            chartAxes: 'المحاور',
            chartBackground: 'خلفية الرسم البياني',
            chartColors: 'ألوان الرسم البياني',
            chartBorders: 'حدود الرسم البياني',
            chartShadows: 'ظلال الرسم البياني',
            chartEffects: 'تأثيرات الرسم البياني',
            chartAnimation: 'رسوم متحركة للرسم البياني',
            chartInteractions: 'تفاعلات الرسم البياني',
            chartResponsive: 'رسم بياني متجاوب',
            chartAccessibility: 'إمكانية الوصول للرسم البياني',
            chartPrint: 'طباعة الرسم البياني',
            chartDownload: 'تحميل الرسم البياني',
            chartShare: 'مشاركة الرسم البياني',
            chartEmbed: 'تضمين الرسم البياني',
            chartFullscreen: 'ملء الشاشة',
            chartZoom: 'تكبير الرسم البياني',
            chartPan: 'تحريك الرسم البياني',
            chartReset: 'إعادة تعيين الرسم البياني',
            chartUpdate: 'تحديث الرسم البياني',
            chartRefresh: 'تحديث الرسم البياني',
            chartReload: 'إعادة تحميل الرسم البياني',
            chartSave: 'حفظ الرسم البياني',
            chartLoad: 'تحميل الرسم البياني',
            chartNew: 'رسم بياني جديد',
            chartOpen: 'فتح الرسم البياني',
            chartClose: 'إغلاق الرسم البياني',
            chartDelete: 'حذف الرسم البياني',
            chartRename: 'إعادة تسمية الرسم البياني',
            chartDuplicate: 'نسخ الرسم البياني',
            chartMove: 'نقل الرسم البياني',
            chartResize: 'تغيير حجم الرسم البياني',
            chartMinimize: 'تصغير الرسم البياني',
            chartMaximize: 'تكبير الرسم البياني',
            chartRestore: 'استعادة الرسم البياني',
            chartLock: 'قفل الرسم البياني',
            chartUnlock: 'فتح قفل الرسم البياني',
            chartProtect: 'حماية الرسم البياني',
            chartUnprotect: 'إلغاء حماية الرسم البياني',
            chartValidate: 'التحقق من صحة الرسم البياني',
            chartTest: 'اختبار الرسم البياني',
            chartDebug: 'تصحيح الرسم البياني',
            chartProfile: 'ملف تعريف الرسم البياني',
            chartPreferences: 'تفضيلات الرسم البياني',
            chartOptions: 'خيارات الرسم البياني',
            chartConfiguration: 'تكوين الرسم البياني',
            chartCustomization: 'تخصيص الرسم البياني',
            chartPersonalization: 'تخصيص الرسم البياني',
            chartThemes: 'مواضيع الرسم البياني',
            chartStyles: 'أنماط الرسم البياني',
            chartTemplates: 'قوالب الرسم البياني',
            chartPresets: 'إعدادات مسبقة للرسم البياني',
            chartDefaults: 'إعدادات افتراضية للرسم البياني',
            chartAdvanced: 'متقدم',
            chartBasic: 'أساسي',
            chartSimple: 'بسيط',
            chartComplex: 'معقد',
            chartDetailed: 'مفصل',
            chartSummary: 'ملخص',
            chartOverview: 'نظرة عامة',
            chartDetails: 'تفاصيل',
            chartHelp: 'مساعدة',
            chartSupport: 'دعم',
            chartDocumentation: 'وثائق',
            chartTutorial: 'دروس',
            chartGuide: 'دليل',
            chartManual: 'دليل المستخدم',
            chartFAQ: 'الأسئلة الشائعة',
            chartContact: 'اتصل بنا',
            chartFeedback: 'ملاحظات',
            chartReport: 'تقرير',
            chartIssue: 'مشكلة',
            chartBug: 'خطأ',
            chartFeature: 'ميزة',
            chartEnhancement: 'تحسين',
            chartSuggestion: 'اقتراح',
            chartRequest: 'طلب',
            chartVote: 'تصويت',
            chartLike: 'إعجاب',
            chartDislike: 'عدم إعجاب',
            chartRate: 'تقييم',
            chartReview: 'مراجعة',
            chartComment: 'تعليق',
            chartMessage: 'رسالة',
            chartNotification: 'إشعار',
            chartAlert: 'تنبيه',
            chartWarning: 'تحذير',
            chartError: 'خطأ',
            chartSuccess: 'نجح',
          }}
        />
      </div>
    </div>
  );
});

InstantAuctionGrid.displayName = 'InstantAuctionGrid';

export default InstantAuctionGrid;
