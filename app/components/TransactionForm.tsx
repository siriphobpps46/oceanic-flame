import React, { useState, useEffect } from "react";
import { Transaction, Category } from "../page";
import { getCategoryIcon, CloseIcon } from "./Icons";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, "id"> & { id?: string }) => void;
  categories: Category[];
  editTransaction?: Transaction | null;
}

export default function TransactionForm({
  isOpen,
  onClose,
  onSave,
  categories,
  editTransaction,
}: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [errors, setErrors] = useState<{ amount?: string; category?: string; date?: string }>({});

  // Reset or populate fields when modal opens/changes or editTransaction is provided
  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmount(editTransaction.amount.toString());
        setCategory(editTransaction.category);
        setDate(editTransaction.date);
        setNote(editTransaction.note);
      } else {
        setType("expense");
        setAmount("");
        setCategory("");
        // Set today's date in YYYY-MM-DD local format
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        setDate(`${yyyy}-${mm}-${dd}`);
        setNote("");
      }
      setErrors({});
    }
  }, [isOpen, editTransaction]);

  // Filter categories according to active transaction type
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Auto select first category in list when type changes and current selection is invalid
  useEffect(() => {
    if (isOpen && filteredCategories.length > 0) {
      const isCurrentCatValid = filteredCategories.some((c) => c.id === category);
      if (!isCurrentCatValid) {
        setCategory(filteredCategories[0].id);
      }
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = "กรุณากรอกจำนวนเงินมากกว่า 0";
    }

    if (!category) {
      newErrors.category = "กรุณาเลือกหมวดหมู่";
    }

    if (!date) {
      newErrors.date = "กรุณาระบุวันที่";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedCat = categories.find((c) => c.id === category);

    onSave({
      id: editTransaction?.id,
      type,
      amount: numericAmount,
      category,
      categoryLabel: selectedCat?.label || category,
      date,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-navy-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl border-t sm:border border-slate-100 dark:border-navy-800/80 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto flex flex-col z-10 animate-slide-up">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-navy-800 sticky top-0 bg-white dark:bg-navy-900 z-10 rounded-t-[32px]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {editTransaction ? "📝 แก้ไขรายการประวัติ" : "✨ บันทึกรายการใหม่"}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-full text-slate-400 dark:text-navy-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 flex-1">
          
          {/* 1. Switch Toggle Type */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-navy-950 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                type === "expense"
                  ? "bg-coral-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-navy-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              💸 รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                type === "income"
                  ? "bg-navy-900 text-white dark:bg-navy-500 shadow-sm"
                  : "text-slate-500 dark:text-navy-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              💰 รายรับ (Income)
            </button>
          </div>

          {/* 2. Amount Input (Premium large text) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-400 dark:text-navy-400">
              จำนวนเงิน (THB)
            </label>
            <div className="relative flex items-center">
              <span className={`absolute left-4 text-2xl font-extrabold transition-colors ${
                type === "expense" ? "text-coral-500" : "text-emerald-500"
              }`}>
                ฿
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-4 text-3xl font-extrabold bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                  type === "expense"
                    ? "focus:ring-coral-500/20 focus:border-coral-500"
                    : "focus:ring-navy-900/20 focus:border-navy-900 dark:focus:border-navy-500"
                }`}
                autoFocus
              />
            </div>
            {errors.amount && (
              <span className="text-xs font-bold text-coral-500 px-1">⚠️ {errors.amount}</span>
            )}
          </div>

          {/* 3. Category Grid Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-400 dark:text-navy-400">
              เลือกหมวดหมู่รายการ
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-[190px] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-navy-950 scale-95 shadow-sm border-transparent"
                        : "bg-slate-50 border-slate-100 dark:bg-navy-950 dark:border-navy-800 hover:bg-slate-100/50 text-slate-600 dark:text-navy-300"
                    }`}
                  >
                    <div 
                      className={`p-2.5 rounded-xl flex items-center justify-center mb-1 text-white`}
                      style={{ 
                        backgroundColor: isSelected ? undefined : cat.color,
                        color: isSelected ? cat.color : undefined
                      }}
                    >
                      {getCategoryIcon(cat.icon, { size: 18 })}
                    </div>
                    <span className="text-[10px] font-bold truncate w-full text-center">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <span className="text-xs font-bold text-coral-500 px-1">⚠️ {errors.category}</span>
            )}
          </div>

          {/* 4. Date Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-400 dark:text-navy-400">
              วันที่บันทึกรายการ
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 dark:focus:ring-navy-500/20 text-slate-800 dark:text-white"
            />
            {errors.date && (
              <span className="text-xs font-bold text-coral-500 px-1">⚠️ {errors.date}</span>
            )}
          </div>

          {/* 5. Note / Memo Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-400 dark:text-navy-400">
              คำอธิบายโน้ตเพิ่มเติม (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ข้าวเช้า, ค่าวินมอเตอร์ไซค์, โบนัส..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-navy-950 border border-slate-150 dark:border-navy-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 dark:focus:ring-navy-500/20 text-slate-800 dark:text-white"
              maxLength={60}
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-700 dark:text-navy-200 font-bold rounded-2xl transition-colors text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`flex-1 py-4 px-4 text-white font-bold rounded-2xl transition-all shadow-md text-sm hover:shadow-lg ${
                type === "expense"
                  ? "bg-coral-500 hover:bg-coral-600 shadow-coral-500/10"
                  : "bg-navy-900 hover:bg-navy-800 dark:bg-coral-500 dark:hover:bg-coral-600"
              }`}
            >
              {editTransaction ? "ยืนยันการแก้ไข" : "บันทึกรายการ"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
