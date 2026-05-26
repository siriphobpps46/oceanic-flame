import React, { useState } from "react";
import { Budget, Category, Transaction } from "../page";
import { 
  ExportIcon, 
  ImportIcon, 
  TrashIcon, 
  CheckIcon, 
  AlertCircleIcon, 
  getCategoryIcon 
} from "./Icons";

interface BudgetViewProps {
  budget: Budget;
  onUpdateBudget: (newLimit: number) => void;
  categories: Category[];
  transactions: Transaction[];
  onImportData: (transactions: Transaction[], budget: Budget) => void;
  onClearAllData: () => void;
}

export default function BudgetView({
  budget,
  onUpdateBudget,
  categories,
  transactions,
  onImportData,
  onClearAllData,
}: BudgetViewProps) {
  const [budgetLimit, setBudgetLimit] = useState(budget.monthlyLimit.toString());
  const [isSaved, setIsSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // 1. Save Budget Limit
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetLimit);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBudget(parsed);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  // 2. Export JSON
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify({ transactions, budget }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `premium_wallet_backup_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert("ไม่สามารถสำรองข้อมูลรูปแบบ JSON ได้ในขณะนี้");
    }
  };

  // 3. Export CSV (Thai Excel Friendly)
  const handleExportCSV = () => {
    try {
      // CSV Headers with UTF-8 BOM to display Thai characters correctly in Excel
      const headers = ["วันที่ (Date)", "ประเภท (Type)", "จำนวนเงิน (Amount)", "หมวดหมู่ (Category)", "โน้ต/คำอธิบาย (Note)"];
      
      const rows = transactions.map((tx) => [
        tx.date,
        tx.type === "income" ? "รายรับ (Income)" : "รายจ่าย (Expense)",
        tx.amount.toString(),
        tx.categoryLabel || tx.category,
        tx.note.replace(/,/g, " ") // sanitise commas in description
      ]);
      
      // Merge headers and rows
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const exportFileDefaultName = `premium_wallet_report_${new Date().toISOString().slice(0, 10)}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert("ไม่สามารถสำรองข้อมูลรูปแบบ CSV ได้ในขณะนี้");
    }
  };

  // 4. Import JSON Data
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);

    const fileReader = new FileReader();
    const file = e.target.files?.[0];

    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        
        // Validation Checks
        if (!parsedData || typeof parsedData !== "object") {
          throw new Error("โครงสร้างไฟล์ไม่ถูกต้อง");
        }

        const txs = parsedData.transactions || [];
        const bd = parsedData.budget || { monthlyLimit: 0 };

        if (!Array.isArray(txs)) {
          throw new Error("ข้อมูลประวัติการเงินในไฟล์ต้องเป็นรายการอาร์เรย์ (Array)");
        }

        // Validate individual transaction objects structure
        const isValid = txs.every(
          (tx: any) =>
            typeof tx.id === "string" &&
            (tx.type === "income" || tx.type === "expense") &&
            typeof tx.amount === "number" &&
            typeof tx.category === "string" &&
            typeof tx.date === "string"
        );

        if (txs.length > 0 && !isValid) {
          throw new Error("ข้อมูลรายการประวัติการเงินบางรายการมีรูปแบบฟิลด์ไม่ถูกต้อง");
        }

        onImportData(txs, bd);
        setImportSuccess(true);
        setBudgetLimit(bd.monthlyLimit.toString());
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err: any) {
        setImportError(err.message || "เกิดข้อผิดพลาดในการวิเคราะห์ไฟล์ JSON");
      }
    };

    fileReader.readAsText(file);
    // Reset file input so same file can be imported again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Budget Config Card */}
        <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">💰 ตั้งงบประมาณรายเดือน (Budgeting)</h3>
            <p className="text-xs text-slate-400 dark:text-navy-400">ระบุเพดานรายจ่ายสุทธิสูงสุดที่คุณต้องการคุมในแต่ละเดือน</p>
          </div>

          <form onSubmit={handleSaveBudget} className="flex flex-col gap-3 mt-2">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-lg font-bold text-slate-400 dark:text-navy-400">฿</span>
              <input
                type="number"
                min="0"
                placeholder="ระบุจำนวนงบประมาณ (เช่น 15000)"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 text-sm font-bold text-slate-800 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              className="py-3 px-4 bg-navy-900 hover:bg-navy-800 dark:bg-coral-500 dark:hover:bg-coral-600 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              {isSaved ? (
                <>
                  <CheckIcon size={14} /> บันทึกงบประมาณสำเร็จ
                </>
              ) : (
                "บันทึกตั้งงบประจำเดือน"
              )}
            </button>
          </form>

          {budget.monthlyLimit > 0 && (
            <div className="mt-2 text-xs bg-slate-50 dark:bg-navy-950/40 p-4 rounded-2xl border border-slate-100 dark:border-navy-800 flex flex-col gap-1 text-slate-600 dark:text-navy-300">
              <span className="font-bold">สรุปนโยบายควบคุมเงิน:</span>
              <span>ระบบจะแจ้งเตือนเมื่อใช้จ่ายใกล้ถึง 80% และเปลี่ยนแถบเป็นสีแดงเมื่อยอดใช้จ่ายสะสมประจำเดือนปัจจุบันทะลุเพดานงบประมาณ</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Backup & Import/Export */}
        <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">💾 สำรองและกู้คืนข้อมูล (Backup & Portability)</h3>
            <p className="text-xs text-slate-400 dark:text-navy-400">นำข้อมูลทั้งหมดออกไปใช้งาน หรือนำข้อมูลสำรองกลับเข้ามา</p>
          </div>

          {/* Export Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
            <button
              onClick={handleExportJSON}
              className="py-3 px-3 border border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-navy-200 transition-colors flex items-center justify-center gap-1.5 w-full"
            >
              <ExportIcon size={14} />
              ส่งออก JSON (สำรอง)
            </button>
            <button
              onClick={handleExportCSV}
              className="py-3 px-3 border border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-navy-200 transition-colors flex items-center justify-center gap-1.5 w-full"
            >
              <ExportIcon size={14} />
              ส่งออก CSV (Excel)
            </button>
          </div>

          {/* Import Actions */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-navy-500">นำเข้าไฟล์กู้คืน (JSON)</label>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="w-full text-xs text-slate-500 dark:text-navy-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-coral-50 file:text-coral-600 dark:file:bg-coral-950/20 dark:file:text-coral-400 file:cursor-pointer border border-dashed border-slate-200 dark:border-navy-800 p-2.5 rounded-2xl"
              />
            </div>
            
            {/* Import Status Alert */}
            {importSuccess && (
              <div className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl border border-emerald-200/50 flex items-center gap-1.5 font-bold animate-fade-in">
                <CheckIcon size={14} /> นำเข้าข้อมูลประวัติและงบประมาณกู้คืนสำเร็จแล้ว!
              </div>
            )}
            {importError && (
              <div className="text-xs bg-coral-50 dark:bg-coral-950/20 text-coral-600 dark:text-coral-400 p-2.5 rounded-xl border border-coral-200/50 flex items-center gap-1.5 font-bold animate-fade-in">
                <AlertCircleIcon size={14} /> {importError}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* LOWER ROW: Category Reference Lists & Danger Reset Option */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Categories Reference List (Spans 2 columns) */}
        <div className="md:col-span-2 rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">🏷️ หมวดหมู่ระบบทั้งหมด ({categories.length})</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800/30"
              >
                <div
                  className="p-1.5 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {getCategoryIcon(cat.icon, { size: 14 })}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-slate-700 dark:text-navy-300 truncate">{cat.label}</span>
                  <span className="text-[8px] font-bold text-slate-400 dark:text-navy-500 uppercase leading-none mt-0.5">
                    {cat.type === "income" ? "รายรับ" : "รายจ่าย"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-3xl bg-white dark:bg-navy-900 p-6 shadow-sm border border-slate-100 dark:border-navy-800/50 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-bold text-coral-600">🚨 เขตอันตราย (Danger Zone)</h3>
            <p className="text-xs text-slate-400 dark:text-navy-400 mt-1">ลบข้อมูลทั้งหมดที่เคยบันทึกมาออกอย่างถาวร ไม่สามารถย้อนกลับได้</p>
          </div>

          <button
            onClick={() => {
              if (
                confirm(
                  "🚨 คำเตือนขั้นเด็ดขาด! การดำเนินการนี้จะลบรายการรายรับรายจ่ายทั้งหมด รวมถึงงบประมาณที่เคยตั้งค่าไว้ในเครื่องนี้อย่างถาวรและไม่สามารถเรียกคืนได้\n\nคุณแน่ใจว่าต้องการล้างข้อมูลทั้งหมดจริงหรือไม่?"
                )
              ) {
                onClearAllData();
                setBudgetLimit("0");
                alert("ล้างระบบและข้อมูลทั้งหมดบน localStorage ของเครื่องเรียบร้อยแล้ว");
              }
            }}
            className="py-3.5 px-4 bg-coral-50 dark:bg-coral-950/20 hover:bg-coral-500 hover:text-white border border-coral-200 dark:border-coral-900/50 text-coral-600 dark:text-coral-400 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <TrashIcon size={14} />
            ล้างข้อมูลในเครื่องทั้งหมด
          </button>
        </div>

      </div>

    </div>
  );
}
