'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, FilterX } from 'lucide-react';

export interface ActiveFilter {
  type: 'search' | 'category' | 'sort';
  label: string;
  value: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onClearAll: () => void;
}

export default function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-medium text-muted-foreground">
        Filtros activos:
      </span>

      {filters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${index}`}
          variant="secondary"
          className="gap-1.5 pl-3 pr-2 py-1 text-[13px]"
        >
          <span className="font-bold text-white">
            {filter.type === 'search' && 'Búsqueda:'}
            {filter.type === 'category' && 'Categoría:'}
            {filter.type === 'sort' && 'Orden:'}
          </span>
          <span className="text-white">{filter.label}</span>
          <button
            onClick={filter.onRemove}
            className="ml-1 rounded-sm hover:bg-white/20 transition-colors"
          >
            <X className="h-3 w-3 text-white" />
            <span className="sr-only">Eliminar filtro {filter.label}</span>
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 gap-1.5 text-[13px] ml-auto"
      >
        <FilterX className="h-3 w-3" />
        Limpiar todos
      </Button>
    </div>
  );
}
