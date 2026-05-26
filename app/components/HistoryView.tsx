import React, { useState, useMemo } from "react";
import { Transaction, Category } from "../page";
import { 
  getCategoryIcon, 
  SearchIcon, 
  FilterIcon, 
  TrashIcon, 
  EditIcon, 
  DuplicateIcon, 
  CalendarIcon 
} from "./Icons";

interface HistoryViewProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (tx: Transaction) => void;
}

type DateFilterType = "all" | "today" | "week" | "month" | "custom";

export default function HistoryView({
  transactions,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
}: HistoryViewProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // 1. Process Filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Keyword search
      const matchesSearch = 
        tx.note.toLowerCase().includes(search.toLowerCase()) ||
        (tx.categoryLabel || "").toLowerCase().includes(search.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;

      // Date filter
      let matchesDate = true;
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        matchesDate = tx.date === new Date().toISOString().split("T")[0];
      } else if (dateFilter === "week") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = txDate >= sevenDaysAgo && txDate <= today;
      } else if (dateFilter === "month") {
        const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
        matchesDate = tx.date.startsWith(currentMonthStr);
      } else if (dateFilter === "custom") {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && txDate >= start;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && txDate <= end;
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [transactions, search, typeFilter, categoryFilter, dateFilter, customStartDate, customEndDate]);

  // 2. Group Transactions by Date
  const groupedTransactions = useMemo(() => {
    // Sort transactions by date descending, then by creation (or ID) descending
    const sorted = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
    
    const groups: { [key: string]: { txs: Transaction[]; incomeTotal: number; expenseTotal: number } } = {};
    
    sorted.forEach((tx) => {
      if (!groups[tx.date]) {
        groups[tx.date] = { txs: [], incomeTotal: 0, expenseTotal: 0 };
      }
      groups[tx.date].txs.push(tx);
      if (tx.type === "income") {
        groups[tx.date].incomeTotal += tx.amount;
      } else {
        groups[tx.date].expenseTotal += tx.amount;
      }
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-slide-up">
      
      {/* FILTER CONTROL BAR */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 p-5 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col gap-4">
        
        {/* Row 1: Search and Filter Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-navy-500" size={18} />
            <input
              type="text"
              placeholder="ค้นหารายการด้วยชื่อโน้ตหรือหมวดหมู่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 text-sm text-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-2xl flex items-center gap-1.5 text-sm font-bold border transition-all ${
              showFilters || typeFilter !== "all" || categoryFilter !== "all" || dateFilter !== "all"
                ? "bg-coral-500 text-white border-transparent"
                : "bg-slate-50 border-slate-100 dark:bg-navy-950 dark:border-navy-800 text-slate-600 dark:text-navy-300 hover:bg-slate-100/50"
            }`}
          >
            <FilterIcon size={16} />
            <span>กรอง</span>
          </button>
        </div>

        {/* Expandable Advanced Filters */}
        {(showFilters || typeFilter !== "all" || categoryFilter !== "all" || dateFilter !== "all") && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-navy-800/50 animate-slide-up">
            
            {/* Filter Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-navy-500">ประเภท</label>
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-xl focus:outline-none text-xs font-semibold text-slate-700 dark:text-navy-300"
              >
                <option value="all">ทั้งหมด (All)</option>
                <option value="income">💰 รายรับ (Income)</option>
                <option value="expense">💸 รายจ่าย (Expense)</option>
              </select>
            </div>

            {/* Filter Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-navy-500">หมวดหมู่</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-xl focus:outline-none text-xs font-semibold text-slate-700 dark:text-navy-300"
              >
                <option value="all">ทุกหมวดหมู่ (All)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.type === "income" ? "🟢" : "🔴"} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-navy-500">ช่วงเวลา</label>
              <select
                value={dateFilter}
                onChange={(e: any) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-xl focus:outline-none text-xs font-semibold text-slate-700 dark:text-navy-300"
              >
                <option value="all">ทั้งหมดทุกช่วงเวลา</option>
                <option value="today">วันนี้ (Today)</option>
                <option value="week">7 วันที่ผ่านมา</option>
                <option value="month">เดือนนี้ (This Month)</option>
                <option value="custom">กำหนดเอง (Custom)</option>
              </select>
            </div>

            {/* Custom Date Inputs (Conditional) */}
            {dateFilter === "custom" && (
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-navy-950/50 rounded-2xl border border-slate-100 dark:border-navy-800/30 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-navy-500">เริ่มต้นวันที่</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-150 dark:border-navy-800 rounded-xl text-xs text-slate-700 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-navy-500">สิ้นสุดวันที่</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-150 dark:border-navy-800 rounded-xl text-xs text-slate-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Clear Filter button */}
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-coral-500 hover:text-coral-600 px-3 py-1.5 hover:bg-coral-50 dark:hover:bg-coral-950/20 rounded-lg transition-colors"
              >
                🧹 ล้างตัวกรองทั้งหมด
              </button>
            </div>

          </div>
        )}
      </div>

      {/* TRANSACTION GROUPS LIST */}
      <div className="flex flex-col gap-5">
        {groupedTransactions.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-navy-900 p-12 text-center border border-slate-100 dark:border-navy-800/50 shadow-sm">
            <div className="text-slate-300 dark:text-navy-700 mb-3 flex justify-center">
              <CalendarIcon size={48} />
            </div>
            <p className="text-slate-500 dark:text-navy-300 font-bold">ไม่พบรายการประวัติที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-slate-400 dark:text-navy-500 mt-1">ลองล้างตัวกรองหรือใช้คำค้นหาอื่นดูครับ</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-700 dark:text-navy-200 rounded-xl text-xs font-bold transition-colors"
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>
        ) : (
          groupedTransactions.map(([dateStr, group]) => {
            // Beautify date header e.g. "วันนี้", "เมื่อวานนี้" or localized Thai date
            const todayStr = new Date().toISOString().split("T")[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            let dateHeader = "";
            if (dateStr === todayStr) {
              dateHeader = "วันนี้ (Today)";
            } else if (dateStr === yesterdayStr) {
              dateHeader = "เมื่อวานนี้ (Yesterday)";
            } else {
              const d = new Date(dateStr);
              dateHeader = d.toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            }

            return (
              <div 
                key={dateStr} 
                className="rounded-3xl bg-white dark:bg-navy-900 shadow-sm border border-slate-100 dark:border-navy-800/50 overflow-hidden"
              >
                {/* Daily Group Header */}
                <div className="bg-slate-50/80 dark:bg-navy-950/40 px-5 py-3.5 border-b border-slate-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {dateHeader}
                  </span>
                  
                  {/* Daily Sum details */}
                  <div className="flex gap-3 text-[10px] font-bold text-slate-400 dark:text-navy-400">
                    {group.incomeTotal > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        รับ: +฿{group.incomeTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {group.expenseTotal > 0 && (
                      <span className="text-coral-500">
                        จ่าย: -฿{group.expenseTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className={`border-l border-slate-200 dark:border-navy-800 pl-2 ${
                      (group.incomeTotal - group.expenseTotal) >= 0 
                        ? "text-navy-600 dark:text-navy-300" 
                        : "text-coral-600"
                    }`}>
                      สุทธิ: ฿{(group.incomeTotal - group.expenseTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Daily Rows */}
                <div className="divide-y divide-slate-100 dark:divide-navy-800/50">
                  {group.txs.map((tx) => {
                    const categoryObj = categories.find((c) => c.id === tx.category) || {
                      label: tx.categoryLabel || tx.category,
                      icon: "others",
                      color: "#64748b",
                    };
                    const isIncome = tx.type === "income";

                    return (
                      <div 
                        key={tx.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50/50 dark:hover:bg-navy-800/20 transition-all group"
                      >
                        {/* Transaction Icon & Text */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2.5 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: categoryObj.color }}
                          >
                            {getCategoryIcon(categoryObj.icon, { size: 18 })}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                              {tx.note || categoryObj.label}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-navy-500 font-semibold mt-0.5">
                              {categoryObj.label}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Actions Panel */}
                        <div className="flex sm:flex-row items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-dashed border-slate-100 dark:border-navy-800 pt-2 sm:pt-0">
                          {/* Amount */}
                          <div className="text-left sm:text-right">
                            <span className={`text-sm font-extrabold ${
                              isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-coral-500 dark:text-coral-400"
                            }`}>
                              {isIncome ? "+" : "-"}฿{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Quick Edit/Delete/Duplicate Actions (Sleek layout) */}
                          <div className="flex gap-2">
                            {/* Duplicate */}
                            <button
                              onClick={() => onDuplicate(tx)}
                              title="คัดลอกรายการ"
                              className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm border border-blue-100/50 dark:border-blue-900/30 flex items-center justify-center cursor-pointer"
                            >
                              <DuplicateIcon size={16} />
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => onEdit(tx)}
                              title="แก้ไขรายการ"
                              className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-600 dark:text-navy-200 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm border border-slate-100 dark:border-navy-700/30 flex items-center justify-center cursor-pointer"
                            >
                              <EditIcon size={16} />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้?")) {
                                  onDelete(tx.id);
                                }
                              }}
                              title="ลบรายการ"
                              className="p-2.5 bg-coral-50 hover:bg-coral-100 dark:bg-coral-950/30 dark:hover:bg-coral-900/40 text-coral-500 dark:text-coral-400 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm border border-coral-100 dark:border-coral-900/30 flex items-center justify-center cursor-pointer"
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
