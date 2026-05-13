import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BillWorkflowCard } from './BillWorkflowCard';
import type { ColumnDef, BillStatus } from './types';

const colStyle: Record<string, { bg: string; badge: string; icon: string; border: string }> = {
  pending_submission: {
    bg: 'bg-rose-50',
    badge: 'bg-rose-200/80 text-rose-700',
    icon: 'text-rose-500',
    border: 'border-rose-200',
  },
  submitted: {
    bg: 'bg-sky-50',
    badge: 'bg-sky-200/80 text-sky-700',
    icon: 'text-sky-500',
    border: 'border-sky-200',
  },
  payment_expected: {
    bg: 'bg-violet-50',
    badge: 'bg-violet-200/80 text-violet-700',
    icon: 'text-violet-500',
    border: 'border-violet-200',
  },
  payment_received: {
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-200/80 text-emerald-700',
    icon: 'text-emerald-500',
    border: 'border-emerald-200',
  },
  deduction_dispute: {
    bg: 'bg-amber-50',
    badge: 'bg-amber-200/80 text-amber-700',
    icon: 'text-amber-500',
    border: 'border-amber-200',
  },
};

interface BillWorkflowColumnProps {
  column: ColumnDef;
  submissions: any[];
  onEdit: (submission: any) => void;
  onQuickAdd: (status: BillStatus) => void;
}

function matchesSearch(submission: any, term: string): boolean {
  if (!term.trim()) return true;
  const t = term.toLowerCase();
  return (
    (submission.patient_name || '').toLowerCase().includes(t) ||
    (submission.bill_no || '').toLowerCase().includes(t) ||
    (submission.visit_id || '').toLowerCase().includes(t)
  );
}

export function BillWorkflowColumn({ column, submissions, onEdit, onQuickAdd }: BillWorkflowColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const style = colStyle[column.status];

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm('');
  };

  const filtered = searchTerm.trim()
    ? submissions.filter((s) => matchesSearch(s, searchTerm))
    : submissions;

  return (
    <div className="flex-1 min-w-[240px] max-w-[400px] flex flex-col">
      {/* Column header — always visible */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <column.icon className={`h-4 w-4 flex-shrink-0 ${style.icon}`} />
          <h3 className="text-sm font-semibold text-gray-700 truncate">{column.title}</h3>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-1 rounded-md text-gray-400 hover:text-gray-600 ${searchOpen ? 'bg-white/70 text-gray-600' : ''}`}
            title="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onQuickAdd(column.status)}
            className="p-1 rounded-md hover:bg-white/70 text-gray-400 hover:text-gray-600"
            title="Add bill"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className={`text-[11px] font-bold min-w-[20px] text-center px-1.5 py-0.5 rounded-full ${style.badge}`}>
            {submissions.length}
          </span>
        </div>
      </div>

      {/* Search bar — below header, only when active */}
      {searchOpen && (
        <div className="flex items-center gap-1 mb-2 px-0.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter..."
              className="h-7 text-xs pl-7 pr-6 rounded-lg border-gray-200 bg-white"
            />
            {searchTerm && (
              <button
                onClick={closeSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-2xl p-2.5 space-y-2 min-h-[200px] overflow-y-auto
          overscroll-contain scroll-smooth
          ${style.bg} border ${style.border}
          ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg scale-[1.02]' : ''}
          transition-all duration-200
        `}
      >
        <SortableContext items={filtered.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {filtered.map((submission) => (
            <BillWorkflowCard
              key={submission.id}
              submission={submission}
              onEdit={onEdit}
            />
          ))}
        </SortableContext>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
              <column.icon className={`h-5 w-5 ${style.icon}`} />
            </div>
            <span className="text-xs font-medium text-gray-400">
              {searchTerm ? 'No matches' : 'Drop here'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
