"use client";

import React, { useState, useEffect } from "react";
import DashboardView from "./components/DashboardView";
import TransactionForm from "./components/TransactionForm";
import HistoryView from "./components/HistoryView";
import CalendarView from "./components/CalendarView";
import BudgetView from "./components/BudgetView";
import { 
  DashboardIcon, 
  HistoryIcon, 
  CalendarIcon,
  BudgetIcon, 
  PlusIcon, 
  LightThemeIcon, 
  DarkThemeIcon,
  WalletIcon,
  OceanicFlameLogo
} from "./components/Icons";
import { ToastContainer, ConfirmModal, Toast, ConfirmConfig } from "./components/NotificationSystem";

// Types definition
export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  categoryLabel: string;
  date: string;
  note: string;
}

export interface Budget {
  monthlyLimit: number;
}

export interface Category {
  id: string;
  type: "income" | "expense";
  icon: string;
  label: string;
  color: string;
}

// Initial System Categories Configuration
const INITIAL_CATEGORIES: Category[] = [
  // Expense Categories (รายจ่าย)
  { id: "food", type: "expense", icon: "food", label: "อาหาร", color: "#F97316" }, // orange-500
  { id: "transport", type: "expense", icon: "transport", label: "เดินทาง", color: "#3B82F6" }, // blue-500
  { id: "shopping", type: "expense", icon: "shopping", label: "ช้อปปิ้ง", color: "#EC4899" }, // pink-500
  { id: "entertainment", type: "expense", icon: "entertainment", label: "บันเทิง", color: "#8B5CF6" }, // violet-500
  { id: "home", type: "expense", icon: "home", label: "ที่อยู่อาศัย", color: "#1E293B" }, // slate-800 (navy)
  { id: "health", type: "expense", icon: "health", label: "สุขภาพ/หมอ", color: "#EF4444" }, // red-500
  { id: "education", type: "expense", icon: "education", label: "การศึกษา", color: "#0D9488" }, // teal-600
  { id: "others_expense", type: "expense", icon: "others", label: "อื่นๆ", color: "#64748B" }, // slate-500

  // Income Categories (รายรับ)
  { id: "salary", type: "income", icon: "salary", label: "เงินเดือน", color: "#10B981" }, // emerald-500
  { id: "business", type: "income", icon: "business", label: "ธุรกิจ/ขายของ", color: "#D97706" }, // amber-600
  { id: "investment", type: "income", icon: "investment", label: "การลงทุน", color: "#0891B2" }, // cyan-600
  { id: "others_income", type: "income", icon: "others", label: "อื่นๆ", color: "#6366F1" }, // indigo-500
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "calendar" | "budget">("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthlyLimit: 0 });
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Custom Premium Toast & Confirm Modal States
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  // Beautiful Emulated Loading Splash Screen States
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9) + Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const showConfirm = (config: ConfirmConfig) => {
    setConfirmConfig(config);
  };

  // 1. Initial mounting checks (Prevents Hydration Errors)
  useEffect(() => {
    setIsMounted(true);
    
    // Load local storage items
    const storedTxs = localStorage.getItem("premium_wallet_txs");
    const storedBudget = localStorage.getItem("premium_wallet_budget");
    const storedTheme = localStorage.getItem("premium_wallet_theme");

    if (storedTxs) {
      try {
        setTransactions(JSON.parse(storedTxs));
      } catch (e) {
        console.error("Error parsing transactions from localStorage", e);
      }
    } else {
      // Seed some demo records so the dashboard looks beautiful right away
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const demoRecords: Transaction[] = [
        {
          id: "demo-1",
          type: "income",
          amount: 28500,
          category: "salary",
          categoryLabel: "เงินเดือน",
          date: yesterdayStr,
          note: "เงินเดือนประจำเดือนนี้",
        },
        {
          id: "demo-2",
          type: "expense",
          amount: 350,
          category: "food",
          categoryLabel: "อาหาร",
          date: today,
          note: "บุฟเฟต์ปิ้งย่างกับเพื่อนๆ",
        },
        {
          id: "demo-3",
          type: "expense",
          amount: 1500,
          category: "shopping",
          categoryLabel: "ช้อปปิ้ง",
          date: today,
          note: "ซื้อรองเท้าวิ่งใหม่",
        },
        {
          id: "demo-4",
          type: "expense",
          amount: 80,
          category: "transport",
          categoryLabel: "เดินทาง",
          date: today,
          note: "บีทีเอสไปทำงาน",
        }
      ];
      setTransactions(demoRecords);
      localStorage.setItem("premium_wallet_txs", JSON.stringify(demoRecords));
    }

    if (storedBudget) {
      try {
        setBudget(JSON.parse(storedBudget));
      } catch (e) {
        console.error("Error parsing budget from localStorage", e);
      }
    } else {
      // Default initial budget limit to 10000
      const defaultBudget = { monthlyLimit: 12000 };
      setBudget(defaultBudget);
      localStorage.setItem("premium_wallet_budget", JSON.stringify(defaultBudget));
    }

    // Set Theme
    const isDarkOS = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = (storedTheme as "light" | "dark") || (isDarkOS ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Setup Custom event listener for inter-view links
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener("change-tab", handleTabChange);

    // Premium startup loading progress emulation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setLoadingProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
        }, 300); // short delay for visual completion smoothness
      }
    }, 80); // 80ms * 20 = 1600ms total boot time!

    return () => {
      clearInterval(interval);
      window.removeEventListener("change-tab", handleTabChange);
    };
  }, []);

  // 2. State saving effects
  const saveTransactions = (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    localStorage.setItem("premium_wallet_txs", JSON.stringify(newTxs));
  };

  const saveBudget = (newBudget: Budget) => {
    setBudget(newBudget);
    localStorage.setItem("premium_wallet_budget", JSON.stringify(newBudget));
  };

  // 3. Theme toggle function
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("premium_wallet_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 4. Action Handlers
  const handleSaveTransaction = (txData: Omit<Transaction, "id"> & { id?: string }) => {
    if (txData.id) {
      // EDIT TRANSACTION Mode
      const updated = transactions.map((t) =>
        t.id === txData.id ? (txData as Transaction) : t
      );
      saveTransactions(updated);
      showToast("แก้ไขรายการประวัติเงินเรียบร้อยแล้ว ✨", "success");
    } else {
      // ADD TRANSACTION Mode
      const newTx: Transaction = {
        ...txData,
        id: "tx-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      };
      saveTransactions([newTx, ...transactions]);
      showToast("บันทึกรายการรายรับ/รายจ่ายสำเร็จ 🎉", "success");
    }
    setEditTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    showConfirm({
      title: "ยืนยันการลบรายการ 🗑️",
      message: "คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้?\nข้อมูลนี้จะถูกลบออกถาวรและไม่สามารถเรียกคืนกลับมาได้",
      confirmText: "ลบรายการ",
      cancelText: "ยกเลิก",
      isDanger: true,
      onConfirm: () => {
        const filtered = transactions.filter((t) => t.id !== id);
        saveTransactions(filtered);
        showToast("ลบรายการประวัติการเงินเรียบร้อยแล้ว", "success");
      }
    });
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicatedTx: Transaction = {
      ...tx,
      id: "tx-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      note: tx.note ? `${tx.note} (คัดลอก)` : `${tx.categoryLabel} (คัดลอก)`,
      date: new Date().toISOString().split("T")[0], // duplicate resets to today
    };
    saveTransactions([duplicatedTx, ...transactions]);
    showToast(`คัดลอกรายการ "${tx.note || tx.categoryLabel}" ไปยังวันนี้เรียบร้อยแล้ว! 📋`, "success");
  };

  const handleImportData = (importedTxs: Transaction[], importedBudget: Budget) => {
    saveTransactions(importedTxs);
    saveBudget(importedBudget);
  };

  const handleClearAllData = () => {
    saveTransactions([]);
    saveBudget({ monthlyLimit: 0 });
  };

  const handleTriggerEdit = (tx: Transaction) => {
    setEditTransaction(tx);
    setIsFormOpen(true);
  };

  const loadingStatusText = () => {
    if (loadingProgress < 25) return "กำลังปรับตั้งระบบความปลอดภัย...";
    if (loadingProgress < 50) return "ซิงโครไนซ์ประวัติการเงิน...";
    if (loadingProgress < 75) return "วิเคราะห์แนวโน้มรายรับรายจ่าย...";
    if (loadingProgress < 95) return "เตรียมพื้นที่หน้าต่างส่วนตัว...";
    return "กำลังเปิดระบบ... ยินดีต้อนรับ!";
  };

  if (!isMounted || isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-navy-950 font-sans transition-all duration-500 select-none">
        
        {/* Brand Background Glow */}
        <div className="absolute w-[300px] h-[300px] bg-coral-500/10 dark:bg-coral-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Startup Card Box */}
        <div className="flex flex-col items-center gap-6 max-w-xs w-full text-center z-10 px-4">
          
          {/* Logo container with elastic pulse/scale spin */}
          <div className="w-20 h-20 flex items-center justify-center relative animate-pulse duration-[2000ms]">
            <img 
              src="/logo.png" 
              alt="Oceanic Flame Brand Logo" 
              className="w-full h-full object-contain rounded-3xl shadow-xl shadow-coral-500/10 dark:shadow-coral-500/5 border border-slate-100/50 dark:border-navy-800 animate-scale-up animate-pulse" 
            />
            {/* Pulsing ring around logo */}
            <span className="absolute -inset-2 rounded-3xl border border-coral-500/20 animate-ping opacity-30 pointer-events-none" />
          </div>

          {/* Titles */}
          <div className="flex flex-col gap-1 mt-2">
            <h2 className="text-xl font-black text-navy-950 dark:text-white tracking-tight">
              Oceanic Flame
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-navy-400 font-extrabold tracking-widest uppercase">
              บันทึกรายรับรายจ่ายส่วนตัว
            </p>
          </div>

          {/* Loader bar container */}
          <div className="w-full mt-4 flex flex-col items-center gap-2">
            
            {/* Outer Progress bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-navy-900 rounded-full overflow-hidden border border-slate-100 dark:border-navy-800/40">
              {/* Inner progress bar */}
              <div 
                className="h-full bg-gradient-to-r from-coral-500 to-coral-400 rounded-full transition-all duration-[80ms] ease-linear shadow-sm shadow-coral-500/20"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            {/* Dynamic Status Indicator */}
            <div className="flex justify-between items-center w-full text-[10px] font-bold text-slate-400 dark:text-navy-400 px-1 mt-1">
              <span className="animate-pulse">{loadingStatusText()}</span>
              <span className="text-coral-500 dark:text-coral-400">{loadingProgress}%</span>
            </div>

          </div>

        </div>

        {/* Small version copyright footer */}
        <div className="absolute bottom-8 text-[9px] text-slate-400 dark:text-navy-500 font-bold uppercase tracking-widest pointer-events-none">
          PREMIUM FINANCE APP • BY DEEPMIND
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-800 dark:bg-navy-950 dark:text-slate-100 font-sans">
      
      {/* 1. Header (Sticky Top Bar) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-slate-100 dark:border-navy-850 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Oceanic Flame Logo" className="w-full h-full object-contain rounded-xl shadow-md" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-navy-950 dark:text-white leading-tight">
              Oceanic Flame
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-navy-400 font-extrabold tracking-wide uppercase">
              บันทึกรายรับรายจ่ายส่วนตัว
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Quick Stats on Desktop Header */}
          <div className="hidden md:flex items-center gap-3 text-xs bg-slate-50 dark:bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-navy-800">
            <span className="text-slate-500 dark:text-navy-400 font-medium">รายการจด:</span>
            <span className="font-bold text-coral-500">{transactions.length} รายการ</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-600 dark:text-navy-300 rounded-xl transition-colors border border-slate-100 dark:border-navy-800"
            title={theme === "light" ? "สลับไปธีมมืด" : "สลับไปธีมสว่าง"}
          >
            {theme === "light" ? <DarkThemeIcon size={18} /> : <LightThemeIcon size={18} />}
          </button>
          
        </div>
      </header>

      {/* 2. Main content container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 py-6 pb-28 md:pb-8 flex flex-col items-center">
        
        {/* Active tab content router */}
        {activeTab === "dashboard" && (
          <DashboardView
            transactions={transactions}
            categories={categories}
            budget={budget}
            onAddTransactionClick={() => {
              setFormDefaultDate(undefined);
              setIsFormOpen(true);
            }}
          />
        )}

        {activeTab === "history" && (
          <HistoryView
            transactions={transactions}
            categories={categories}
            onEdit={handleTriggerEdit}
            onDelete={handleDeleteTransaction}
            onDuplicate={handleDuplicateTransaction}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarView
            transactions={transactions}
            categories={categories}
            onEdit={handleTriggerEdit}
            onDelete={handleDeleteTransaction}
            onDuplicate={handleDuplicateTransaction}
            onAddTransactionClick={(customDate) => {
              setFormDefaultDate(customDate);
              setEditTransaction(null);
              setIsFormOpen(true);
            }}
          />
        )}

        {activeTab === "budget" && (
          <BudgetView
            budget={budget}
            onUpdateBudget={(lim) => {
              saveBudget({ monthlyLimit: lim });
              showToast("ตั้งค่าเป้าหมายงบประมาณรายเดือนสำเร็จ! 🎯", "success");
            }}
            categories={categories}
            transactions={transactions}
            onImportData={(txs, bd) => {
              handleImportData(txs, bd);
              showToast("นำเข้าและกู้คืนฐานข้อมูลประวัติรายรับ/จ่ายสำเร็จ! 📂", "success");
            }}
            onClearAllData={handleClearAllData}
            showToast={showToast}
            showConfirm={showConfirm}
          />
        )}

      </main>

      {/* 3. Floating Action Plus Button (Floating in the bottom-right on both mobile and desktop) */}
      <div className="fixed bottom-24 right-6 md:right-8 z-40">
        <button
          onClick={() => {
            setEditTransaction(null);
            setFormDefaultDate(undefined);
            setIsFormOpen(true);
          }}
          className="p-4 bg-coral-500 hover:bg-coral-600 text-white rounded-full shadow-lg shadow-coral-500/25 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          title="จดบันทึกรายการเงินใหม่"
        >
          <PlusIcon size={28} className="transform group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* 4. Bottom Tab Bar Navigation (Symmetrical 4-tab menu for all screen sizes) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-100 dark:border-navy-850 px-4 py-2.5 flex items-center justify-around shadow-2xl">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === "dashboard"
              ? "text-coral-500 font-bold"
              : "text-slate-400 dark:text-navy-400 hover:text-slate-600 dark:hover:text-navy-300"
          }`}
        >
          <DashboardIcon size={20} className={activeTab === "dashboard" ? "stroke-[2.5]" : ""} />
          <span className="text-[10px]">ภาพรวม</span>
        </button>

        {/* Tab 2: History */}
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === "history"
              ? "text-coral-500 font-bold"
              : "text-slate-400 dark:text-navy-400 hover:text-slate-600 dark:hover:text-navy-300"
          }`}
        >
          <HistoryIcon size={20} className={activeTab === "history" ? "stroke-[2.5]" : ""} />
          <span className="text-[10px]">ประวัติ</span>
        </button>

        {/* Tab 3: Calendar */}
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === "calendar"
              ? "text-coral-500 font-bold"
              : "text-slate-400 dark:text-navy-400 hover:text-slate-600 dark:hover:text-navy-300"
          }`}
        >
          <CalendarIcon size={20} className={activeTab === "calendar" ? "stroke-[2.5]" : ""} />
          <span className="text-[10px]">ปฏิทิน</span>
        </button>

        {/* Tab 4: Budget & Settings */}
        <button
          onClick={() => setActiveTab("budget")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
            activeTab === "budget"
              ? "text-coral-500 font-bold"
              : "text-slate-400 dark:text-navy-400 hover:text-slate-600 dark:hover:text-navy-300"
          }`}
        >
          <BudgetIcon size={20} className={activeTab === "budget" ? "stroke-[2.5]" : ""} />
          <span className="text-[10px]">งบประมาณ</span>
        </button>

      </nav>

      {/* 5. Transaction form modal slider */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditTransaction(null);
          setFormDefaultDate(undefined);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        editTransaction={editTransaction}
        defaultDate={formDefaultDate}
      />

      {/* 6. Custom Premium Toast Notification System */}
      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* 7. Custom Premium Frosted Confirm Dialog Modal */}
      <ConfirmModal
        config={confirmConfig}
        onClose={() => setConfirmConfig(null)}
      />

    </div>
  );
}
