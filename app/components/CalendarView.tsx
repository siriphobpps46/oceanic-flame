import React, { useState, useMemo } from "react";
import { Transaction, Category } from "../page";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  DuplicateIcon, 
  EditIcon, 
  TrashIcon, 
  getCategoryIcon, 
  CalendarIcon 
} from "./Icons";

interface CalendarViewProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (tx: Transaction) => void;
  onAddTransactionClick: (customDate?: string) => void;
}

export default function CalendarView({
  transactions,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  onAddTransactionClick,
}: CalendarViewProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date());
  
  // Format today's date local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // 1. Calendar Grid Math
  const gridCells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    const cells: { dateStr: string | null; dayNum: number | null }[] = [];

    // Empty cells at the beginning
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }

    // Days of active month
    for (let day = 1; day <= daysInMonth; day++) {
      const dd = String(day).padStart(2, "0");
      const mm = String(month + 1).padStart(2, "0");
      const cellDateStr = `${year}-${mm}-${dd}`;
      cells.push({ dateStr: cellDateStr, dayNum: day });
    }

    return cells;
  }, [year, month]);

  // 2. Map Transactions to dates for quick checks
  const dailyFinanceMap = useMemo(() => {
    const map: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach((tx) => {
      if (!map[tx.date]) {
        map[tx.date] = { income: 0, expense: 0 };
      }
      if (tx.type === "income") {
        map[tx.date].income += tx.amount;
      } else {
        map[tx.date].expense += tx.amount;
      }
    });

    return map;
  }, [transactions]);

  // 3. Transactions for selected date
  const selectedDayTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.date === selectedDateStr)
      .sort((a, b) => b.id.localeCompare(a.id)); // show newest first
  }, [transactions, selectedDateStr]);

  const selectedDayTotals = useMemo(() => {
    const dayData = dailyFinanceMap[selectedDateStr] || { income: 0, expense: 0 };
    return {
      income: dayData.income,
      expense: dayData.expense,
      net: dayData.income - dayData.expense,
    };
  }, [dailyFinanceMap, selectedDateStr]);

  // 4. Navigation controls
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setViewDate(new Date());
    setSelectedDateStr(todayStr);
  };

  const monthLabelTh = viewDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const weekdayLabels = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      
      {/* SECTION 1: Calendar Grid Header & Controls */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 p-5 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col gap-5">
        
        {/* Navigation Toolbar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="p-2 bg-navy-50 dark:bg-navy-800 rounded-xl text-coral-500">
              <CalendarIcon size={18} />
            </span>
            <h3 className="font-bold text-slate-800 dark:text-white text-base truncate max-w-[150px] sm:max-w-none">
              {monthLabelTh}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-800 dark:hover:bg-navy-750 border border-slate-100 dark:border-navy-700/30 rounded-xl text-xs font-bold text-slate-700 dark:text-navy-200 transition-colors"
            >
              วันนี้
            </button>
            <div className="flex bg-slate-50 dark:bg-navy-950 p-1 rounded-xl gap-0.5 border border-slate-100 dark:border-navy-800/30">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white dark:hover:bg-navy-800 rounded-lg text-slate-500 dark:text-navy-400 transition-colors"
              >
                <ChevronLeftIcon size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white dark:hover:bg-navy-800 rounded-lg text-slate-500 dark:text-navy-400 transition-colors"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 7-column weekday headers */}
        <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-navy-850 pb-2">
          {weekdayLabels.map((dayLabel, idx) => (
            <span 
              key={idx} 
              className={`text-xs font-bold uppercase tracking-wider ${
                idx === 0 
                  ? "text-coral-500" 
                  : idx === 6 
                  ? "text-blue-500 dark:text-navy-400" 
                  : "text-slate-400 dark:text-navy-500"
              }`}
            >
              {dayLabel}
            </span>
          ))}
        </div>

        {/* 7-column day grids */}
        <div className="grid grid-cols-7 gap-y-2.5 gap-x-1.5">
          {gridCells.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === todayStr;
            
            const hasData = cell.dateStr ? dailyFinanceMap[cell.dateStr] : null;
            const dayOfWeekIndex = idx % 7;

            return (
              <div
                key={idx}
                onClick={() => cell.dateStr && setSelectedDateStr(cell.dateStr)}
                className={`min-h-[56px] sm:min-h-[68px] rounded-2xl flex flex-col justify-between p-1.5 relative transition-all border ${
                  !cell.dayNum
                    ? "border-transparent pointer-events-none opacity-0"
                    : isSelected
                    ? "bg-navy-900 text-white border-transparent dark:bg-white dark:text-navy-950 scale-95 shadow-md shadow-navy-900/10"
                    : isToday
                    ? "bg-slate-50 dark:bg-navy-950 border-coral-500 text-slate-800 dark:text-white"
                    : "bg-slate-50/40 hover:bg-slate-50 dark:bg-navy-950/20 dark:hover:bg-navy-800/30 border-transparent text-slate-800 dark:text-navy-200 cursor-pointer"
                }`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold leading-none ${
                    !isSelected && dayOfWeekIndex === 0 
                      ? "text-coral-500" 
                      : !isSelected && dayOfWeekIndex === 6 
                      ? "text-blue-500 dark:text-navy-400" 
                      : ""
                  }`}>
                    {cell.dayNum}
                  </span>
                  
                  {/* Today tiny indicator text */}
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-coral-500" />
                  )}
                </div>

                {/* Financial Summary Badges inside day cells */}
                {cell.dayNum && hasData && (
                  <div className="flex flex-col w-full text-[8px] leading-tight select-none">
                    
                    {/* Desktop Amounts */}
                    {hasData.income > 0 && (
                      <span className={`hidden md:inline-block font-extrabold text-emerald-600 dark:text-emerald-400 truncate ${
                        isSelected ? "dark:text-emerald-600 text-emerald-400" : ""
                      }`}>
                        +{hasData.income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    {hasData.expense > 0 && (
                      <span className={`hidden md:inline-block font-extrabold text-coral-500 truncate ${
                        isSelected ? "dark:text-coral-600 text-coral-300" : ""
                      }`}>
                        -{hasData.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    )}

                    {/* Mobile Tiny Color Dots (Prevents text squishing/overflow on phone) */}
                    <div className="flex gap-0.5 justify-center md:hidden w-full mt-1.5 pb-0.5">
                      {hasData.income > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500 ${
                          isSelected ? "dark:bg-emerald-600 bg-emerald-300" : ""
                        }`} />
                      )}
                      {hasData.expense > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-coral-500 ${
                          isSelected ? "dark:bg-coral-600 bg-coral-300" : ""
                        }`} />
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* SECTION 2: Daily Transaction List Panel (Details below calendar) */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col gap-4">
        
        {/* Selected Date Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-850">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">
              📝 รายการประจำวันที่ {new Date(selectedDateStr).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h4>
            
            {/* Daily sums */}
            <div className="flex gap-3 text-[10px] font-bold text-slate-400 dark:text-navy-400 mt-1">
              {selectedDayTotals.income > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  รับ: +฿{selectedDayTotals.income.toLocaleString()}
                </span>
              )}
              {selectedDayTotals.expense > 0 && (
                <span className="text-coral-500">
                  จ่าย: -฿{selectedDayTotals.expense.toLocaleString()}
                </span>
              )}
              <span className={`border-l border-slate-200 dark:border-navy-800 pl-2 ${
                selectedDayTotals.net >= 0 ? "text-navy-600 dark:text-navy-300" : "text-coral-500"
              }`}>
                สุทธิ: ฿{selectedDayTotals.net.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick ADD shortcut button */}
          <button
            onClick={() => onAddTransactionClick(selectedDateStr)}
            className="self-start sm:self-center py-2 px-3.5 bg-coral-50 dark:bg-coral-950/20 hover:bg-coral-500 dark:hover:bg-coral-500 hover:text-white text-coral-600 dark:text-coral-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border border-coral-200 dark:border-coral-900/50"
          >
            <PlusIcon size={12} />
            <span>บันทึกของวันที่เลือก</span>
          </button>
        </div>

        {/* Transactions List */}
        {selectedDayTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-navy-400 text-xs font-medium flex flex-col items-center gap-2">
            <span>ไม่มีข้อมูลการเงินของวันนี้</span>
            <button
              onClick={() => onAddTransactionClick(selectedDateStr)}
              className="text-[10px] font-bold text-navy-600 dark:text-coral-400 hover:underline"
            >
              ➕ บันทึกรายการแรกของวันนี้ย้อนหลัง
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800/50 flex flex-col">
            {selectedDayTransactions.map((tx) => {
              const categoryObj = categories.find((c) => c.id === tx.category) || {
                label: tx.categoryLabel || tx.category,
                icon: "others",
                color: "#64748b",
              };
              const isIncome = tx.type === "income";

              return (
                <div 
                  key={tx.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2.5 hover:bg-slate-50/50 dark:hover:bg-navy-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: categoryObj.color }}
                    >
                      {getCategoryIcon(categoryObj.icon, { size: 16 })}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                        {tx.note || categoryObj.label}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-navy-500 font-semibold mt-0.5">
                        {categoryObj.label}
                      </p>
                    </div>
                  </div>

                  {/* Actions & sums */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-1 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-100 dark:border-navy-800/40">
                    <span className={`text-xs font-extrabold ${
                      isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-coral-500 dark:text-coral-400"
                    }`}>
                      {isIncome ? "+" : "-"}฿{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => onDuplicate(tx)}
                        title="คัดลอกรายการ"
                        className="p-1.5 text-slate-400 dark:text-navy-500 hover:text-navy-600 dark:hover:text-navy-300 hover:bg-slate-50 dark:hover:bg-navy-850 rounded-lg transition-colors"
                      >
                        <DuplicateIcon size={13} />
                      </button>
                      <button
                        onClick={() => onEdit(tx)}
                        title="แก้ไขรายการ"
                        className="p-1.5 text-slate-400 dark:text-navy-500 hover:text-navy-600 dark:hover:text-navy-300 hover:bg-slate-50 dark:hover:bg-navy-850 rounded-lg transition-colors"
                      >
                        <EditIcon size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้?")) {
                            onDelete(tx.id);
                          }
                        }}
                        title="ลบรายการ"
                        className="p-1.5 text-slate-400 dark:text-navy-500 hover:text-coral-500 hover:bg-slate-50 dark:hover:bg-navy-850 rounded-lg transition-colors"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
