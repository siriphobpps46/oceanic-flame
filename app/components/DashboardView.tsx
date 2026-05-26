import React, { useState, useMemo } from "react";
import { Transaction, Category, Budget } from "../page";
import { getCategoryIcon, SalaryIcon, WalletIcon } from "./Icons";

interface DashboardViewProps {
  transactions: Transaction[];
  categories: Category[];
  budget: Budget;
  onAddTransactionClick: () => void;
}

export default function DashboardView({
  transactions,
  categories,
  budget,
  onAddTransactionClick,
}: DashboardViewProps) {
  const [selectedDonutIndex, setSelectedDonutIndex] = useState<number | null>(null);

  // 1. Calculations
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netBalance };
  }, [transactions]);

  // 2. Category Breakdown for Donut Chart (Expenses only)
  const categoryStats = useMemo(() => {
    const expenseTx = transactions.filter((tx) => tx.type === "expense");
    const totals: { [key: string]: number } = {};

    expenseTx.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });

    const items = Object.entries(totals).map(([catId, amount]) => {
      const category = categories.find((c) => c.id === catId) || {
        id: catId,
        label: catId === "others" ? "อื่นๆ" : catId,
        color: "#64748b",
        icon: "others",
      };
      return {
        id: catId,
        label: category.label,
        amount,
        color: category.color || "#64748b",
        icon: category.icon || "others",
      };
    });

    // Sort by amount descending
    return items.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const totalExpenseForChart = useMemo(() => {
    return categoryStats.reduce((sum, item) => sum + item.amount, 0);
  }, [categoryStats]);

  // Donut slices coordinates calculation
  const donutSlices = useMemo(() => {
    if (totalExpenseForChart === 0) return [];
    
    let accumulatedPercent = 0;
    return categoryStats.map((item) => {
      const percentage = (item.amount / totalExpenseForChart) * 100;
      const startPercent = accumulatedPercent;
      accumulatedPercent += percentage;
      return {
        ...item,
        percentage,
        startPercent,
      };
    });
  }, [categoryStats, totalExpenseForChart]);

  // 3. 7-Day Chart Data (Income vs Expense)
  const chart7Days = useMemo(() => {
    const data: { dateLabel: string; income: number; expense: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Label in Thai e.g. "26 พ.ค."
      const day = date.getDate();
      const monthTh = date.toLocaleDateString("th-TH", { month: "short" });
      const label = `${day} ${monthTh}`;

      let dailyIncome = 0;
      let dailyExpense = 0;

      transactions.forEach((tx) => {
        if (tx.date === dateStr) {
          if (tx.type === "income") {
            dailyIncome += tx.amount;
          } else {
            dailyExpense += tx.amount;
          }
        }
      });

      data.push({
        dateLabel: label,
        income: dailyIncome,
        expense: dailyExpense,
      });
    }

    return data;
  }, [transactions]);

  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(
      ...chart7Days.map((d) => Math.max(d.income, d.expense)),
      1000 // default minimum height
    );
    return Math.ceil(maxVal / 500) * 500; // round up to nearest 500
  }, [chart7Days]);

  // 4. Budget calculations
  const budgetUsagePercent = useMemo(() => {
    if (budget.monthlyLimit <= 0) {
      return { amount: 0, percent: 0, rawPercent: 0 };
    }
    const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthExpenses = transactions
      .filter((tx) => tx.type === "expense" && tx.date.startsWith(currentMonthStr))
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      amount: currentMonthExpenses,
      percent: Math.min((currentMonthExpenses / budget.monthlyLimit) * 100, 100),
      rawPercent: (currentMonthExpenses / budget.monthlyLimit) * 100,
    };
  }, [transactions, budget]);

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      
      {/* SECTION 1: Summary Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Balance Card: Navy Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-white shadow-xl shadow-navy-900/10 border border-navy-800">
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-coral-500 opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute left-[-20px] top-[-20px] w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-navy-300 font-medium text-sm">ยอดเงินคงเหลือรวม (Net Balance)</span>
            <span className="p-2 bg-navy-800/80 rounded-xl border border-navy-700/50">
              <WalletIcon size={20} className="text-coral-400" />
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            ฿{stats.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-navy-400 mt-2">คำนวณจากทุกรายการที่บันทึกไว้ในเครื่อง</p>
        </div>

        {/* Income Card: Emerald Accent */}
        <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-navy-300 font-medium text-sm">รายรับทั้งหมด (Total Income)</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            ฿{stats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-400 dark:text-navy-400 mt-2">ยอดรับเข้าทั้งหมดที่มีการจดบันทึก</p>
        </div>

        {/* Expense Card: Orange-Red Accent */}
        <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-navy-300 font-medium text-sm">รายจ่ายทั้งหมด (Total Expense)</span>
            <span className="p-2 bg-coral-50 dark:bg-coral-950/20 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-coral-500">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-coral-500">
            ฿{stats.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-400 dark:text-navy-400 mt-2">ยอดการจ่ายออกทั้งหมดที่จดบันทึก</p>
        </div>

      </div>

      {/* SECTION 2: Budget Progress bar (if monthly budget configured) */}
      {budget.monthlyLimit > 0 && (
        <div className="rounded-3xl bg-white dark:bg-navy-900 p-5 shadow-sm border border-slate-100 dark:border-navy-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-coral-500 animate-pulse"></span>
                ความคืบหน้างบประมาณรายเดือน (Budget tracker)
              </h3>
              <p className="text-xs text-slate-400 dark:text-navy-400 mt-0.5">
                งบประมาณเดือนนี้: ฿{budget.monthlyLimit.toLocaleString()}
              </p>
            </div>
            <div className="text-right sm:text-right">
              <span className={`text-sm font-bold ${
                budgetUsagePercent.rawPercent >= 100 
                  ? "text-coral-600 dark:text-coral-400" 
                  : budgetUsagePercent.rawPercent >= 80 
                  ? "text-amber-500" 
                  : "text-navy-600 dark:text-navy-300"
              }`}>
                ฿{budgetUsagePercent.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 dark:text-navy-400">
                {" "} / ฿{budget.monthlyLimit.toLocaleString()} ({budgetUsagePercent.rawPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          {/* Progress Bar Container */}
          <div className="w-full h-3 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                budgetUsagePercent.rawPercent >= 100
                  ? "bg-gradient-to-r from-coral-500 to-coral-600"
                  : budgetUsagePercent.rawPercent >= 80
                  ? "bg-gradient-to-r from-amber-400 to-coral-400"
                  : "bg-gradient-to-r from-navy-500 to-navy-700 dark:from-navy-600 dark:to-navy-400"
              }`}
              style={{ width: `${budgetUsagePercent.percent}%` }}
            />
          </div>
          
          {/* Warn notice if limit reached */}
          {budgetUsagePercent.rawPercent >= 100 ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-coral-600 dark:text-coral-400 bg-coral-50 dark:bg-coral-950/20 p-2.5 rounded-xl border border-coral-200/50">
              <span className="font-bold">⚠️ เกินงบแล้ว!</span> คุณใช้จ่ายเกินงบประมาณที่ตั้งไว้ประจำเดือนนี้ไป ฿{(budgetUsagePercent.amount - budget.monthlyLimit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          ) : budgetUsagePercent.rawPercent >= 80 ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/30">
              <span className="font-bold">⚠️ เตือนภัยงบประมาณ:</span> คุณใช้เงินไปมากกว่า 80% ของงบประมาณรวมแล้ว กรุณาเริ่มประหยัด
            </div>
          ) : null}
        </div>
      )}

      {/* SECTION 3: Charts Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Chart Card: 7-Day Trend (Spans 3 cols) */}
        <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">แนวโน้มการเงินใน 7 วันล่าสุด</h3>
            <p className="text-xs text-slate-400 dark:text-navy-400">เปรียบเทียบ รายรับ (สีน้ำเงิน) และ รายจ่าย (สีแดงส้ม)</p>
          </div>

          {/* Interactive Chart Container */}
          <div className="h-64 mt-6 relative flex flex-col justify-end w-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-slate-300 dark:text-navy-700">
              <div className="w-full border-b border-dashed border-slate-100 dark:border-navy-800/50 flex justify-between">
                <span>฿{maxChartValue.toLocaleString()}</span>
              </div>
              <div className="w-full border-b border-dashed border-slate-100 dark:border-navy-800/50 flex justify-between">
                <span>฿{(maxChartValue * 0.75).toLocaleString()}</span>
              </div>
              <div className="w-full border-b border-dashed border-slate-100 dark:border-navy-800/50 flex justify-between">
                <span>฿{(maxChartValue * 0.5).toLocaleString()}</span>
              </div>
              <div className="w-full border-b border-dashed border-slate-100 dark:border-navy-800/50 flex justify-between">
                <span>฿{(maxChartValue * 0.25).toLocaleString()}</span>
              </div>
              <div className="w-full flex justify-between">
                <span>0</span>
              </div>
            </div>

            {/* Bars */}
            <div className="relative z-10 flex justify-between items-end h-full px-2 pb-8 pt-4 gap-2">
              {chart7Days.map((day, idx) => {
                const incomeHeight = (day.income / maxChartValue) * 100;
                const expenseHeight = (day.expense / maxChartValue) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-all origin-bottom bg-navy-950/95 text-white dark:bg-white dark:text-navy-950 text-[10px] p-2 rounded-xl shadow-lg border border-navy-800 dark:border-slate-150 z-20 w-24 text-center pointer-events-none flex flex-col gap-0.5">
                      <p className="font-bold text-slate-400 dark:text-navy-500 mb-0.5">{day.dateLabel}</p>
                      <p className="text-emerald-400 font-medium">รับ: ฿{day.income.toLocaleString()}</p>
                      <p className="text-coral-400 font-medium">จ่าย: ฿{day.expense.toLocaleString()}</p>
                    </div>

                    <div className="flex items-end gap-1.5 w-full justify-center max-w-[48px]">
                      {/* Income Bar (Navy) */}
                      <div 
                        className="w-2 md:w-3.5 bg-navy-600 dark:bg-navy-400 rounded-t-sm md:rounded-t-md transition-all duration-500 ease-out hover:opacity-85" 
                        style={{ height: `${Math.max(incomeHeight, 2)}%` }}
                      />
                      {/* Expense Bar (Coral) */}
                      <div 
                        className="w-2 md:w-3.5 bg-coral-500 rounded-t-sm md:rounded-t-md transition-all duration-500 ease-out hover:opacity-85" 
                        style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between items-center w-full text-[10px] md:text-xs text-slate-400 dark:text-navy-400 px-2 pt-2 border-t border-slate-100 dark:border-navy-800">
              {chart7Days.map((day, idx) => (
                <span key={idx} className="flex-1 text-center font-medium truncate">{day.dateLabel}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart Card: Category Breakdown Donut (Spans 2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">หมวดหมู่รายจ่ายยอดนิยม</h3>
            <p className="text-xs text-slate-400 dark:text-navy-400">สัดส่วนค่าใช้จ่ายทั้งหมดรวมกัน</p>
          </div>

          {totalExpenseForChart === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-navy-400">
              <div className="p-4 bg-slate-50 dark:bg-navy-800/50 rounded-full mb-3 text-slate-300 dark:text-navy-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <p className="text-sm font-semibold">ยังไม่มีข้อมูลรายจ่าย</p>
              <p className="text-xs mt-1">จดบันทึกรายจ่ายรายการแรกเพื่อดูสัดส่วนของคุณ</p>
              <button 
                onClick={onAddTransactionClick}
                className="mt-4 px-4 py-2 bg-navy-900 hover:bg-navy-800 dark:bg-coral-500 dark:hover:bg-coral-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                บันทึกรายจ่าย
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row lg:flex-col justify-center items-center gap-6 mt-5">
              
              {/* Circular SVG Donut Chart */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.2" className="dark:stroke-navy-800" />
                  {donutSlices.map((slice, index) => {
                    const strokeDasharray = `${slice.percentage} ${100 - slice.percentage}`;
                    const strokeDashoffset = 100 - slice.startPercent + 25; // standard offset logic
                    return (
                      <circle
                        key={slice.id}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={selectedDonutIndex === index ? "5.5" : "4.2"}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setSelectedDonutIndex(index)}
                        onMouseLeave={() => setSelectedDonutIndex(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Details */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2 pointer-events-none">
                  {selectedDonutIndex !== null ? (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-navy-400 font-bold uppercase truncate max-w-[100px]">
                        {donutSlices[selectedDonutIndex].label}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                        ฿{donutSlices[selectedDonutIndex].amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-coral-500 font-bold">
                        {donutSlices[selectedDonutIndex].percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 dark:text-navy-400 font-bold">
                        ยอดรวมจ่าย
                      </span>
                      <span className="text-base font-extrabold text-slate-800 dark:text-white leading-tight">
                        ฿{totalExpenseForChart.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-navy-500 font-semibold mt-0.5">
                        {categoryStats.length} หมวดหมู่
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 w-full max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-2">
                {donutSlices.map((slice, index) => (
                  <div 
                    key={slice.id} 
                    className={`flex items-center justify-between p-1.5 rounded-xl border border-transparent transition-all cursor-pointer ${
                      selectedDonutIndex === index 
                        ? "bg-slate-50 dark:bg-navy-800 border-slate-100 dark:border-navy-700/50 shadow-sm" 
                        : "hover:bg-slate-50/50 dark:hover:bg-navy-800/30"
                    }`}
                    onMouseEnter={() => setSelectedDonutIndex(index)}
                    onMouseLeave={() => setSelectedDonutIndex(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="p-1 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-navy-300">
                        {getCategoryIcon(slice.icon, { size: 12 })}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-navy-300 truncate max-w-[80px]">
                        {slice.label}
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        ฿{slice.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-navy-500">
                        {slice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* SECTION 4: Recents List Widget */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">ประวัติรายการจดล่าสุด</h3>
            <p className="text-xs text-slate-400 dark:text-navy-400">แสดงผล 3 รายการล่าสุดเพื่อความรวดเร็ว</p>
          </div>
          <button 
            onClick={() => {
              // Trigger view navigation to 'history' in page.tsx by dispatching custom event
              window.dispatchEvent(new CustomEvent("change-tab", { detail: "history" }));
            }}
            className="text-xs font-bold text-navy-600 dark:text-coral-400 hover:underline flex items-center gap-1 group"
          >
            ดูประวัติทั้งหมด
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-navy-400 text-sm font-medium">
            ยังไม่มีบันทึกข้อมูลการเงินใดๆ ในฐานข้อมูลเครื่องของคุณ
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-navy-800">
            {transactions.slice(0, 3).map((tx) => {
              const categoryObj = categories.find((c) => c.id === tx.category) || {
                label: tx.categoryLabel || tx.category,
                icon: "others",
                color: "#64748b",
              };
              const isIncome = tx.type === "income";
              
              // format date
              const d = new Date(tx.date);
              const formattedDate = d.toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "2-digit",
              });

              return (
                <div key={tx.id} className="flex items-center justify-between py-3 hover:bg-slate-50/50 dark:hover:bg-navy-800/20 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2.5 rounded-2xl flex items-center justify-center text-white"
                      style={{ backgroundColor: categoryObj.color }}
                    >
                      {getCategoryIcon(categoryObj.icon, { size: 18 })}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                        {tx.note || categoryObj.label}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-navy-500 font-semibold mt-0.5">
                        {categoryObj.label} • {formattedDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-coral-500 dark:text-coral-400"}`}>
                      {isIncome ? "+" : "-"}฿{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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
