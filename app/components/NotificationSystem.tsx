import React from "react";
import { CheckIcon, AlertCircleIcon, TrashIcon, CloseIcon } from "./Icons";

// Toast Interface
export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

// Confirm Configuration Interface
export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 md:right-8 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-none">
      {toasts.map((toast) => {
        let bgStyle = "bg-white/95 dark:bg-navy-900/95 border-emerald-500/30";
        let iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30";
        let textStyle = "text-slate-800 dark:text-slate-100";
        let icon = <CheckIcon size={18} />;

        if (toast.type === "error") {
          bgStyle = "bg-white/95 dark:bg-navy-900/95 border-coral-500/30";
          iconColor = "text-coral-500 bg-coral-50 dark:bg-coral-950/30 border-coral-100 dark:border-coral-900/30";
          icon = <AlertCircleIcon size={18} />;
        } else if (toast.type === "warning") {
          bgStyle = "bg-white/95 dark:bg-navy-900/95 border-amber-500/30";
          iconColor = "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30";
          icon = <AlertCircleIcon size={18} />;
        } else if (toast.type === "info") {
          bgStyle = "bg-white/95 dark:bg-navy-900/95 border-blue-500/30";
          iconColor = "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30";
          icon = <AlertCircleIcon size={18} />;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-md shadow-lg pointer-events-auto transition-all animate-slide-in-right ${bgStyle}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border flex items-center justify-center ${iconColor}`}>
                {icon}
              </div>
              <p className={`text-sm font-bold ${textStyle} leading-normal`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="p-1 text-slate-400 dark:text-navy-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-4 flex-shrink-0 cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface ConfirmModalProps {
  config: ConfirmConfig | null;
  onClose: () => void;
}

export function ConfirmModal({ config, onClose }: ConfirmModalProps) {
  if (!config) return null;

  const {
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "ยืนยัน",
    cancelText = "ยกเลิก",
    isDanger = false,
  } = config;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={handleCancel} />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-navy-900 rounded-[28px] p-6 shadow-2xl border border-slate-100 dark:border-navy-800/80 animate-scale-up z-10 flex flex-col items-center text-center gap-4">
        
        {/* Warning Icon Banner */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-sm ${
          isDanger 
            ? "bg-coral-50 border-coral-100 text-coral-500 dark:bg-coral-950/30 dark:border-coral-900/30" 
            : "bg-blue-50 border-blue-100 text-blue-500 dark:bg-blue-950/30 dark:border-blue-900/30"
        }`}>
          {isDanger ? <TrashIcon size={24} /> : <AlertCircleIcon size={24} />}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 w-full">
          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">
            {title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-navy-300 font-semibold leading-relaxed px-2 whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-700 dark:text-navy-200 font-extrabold rounded-2xl transition-colors text-sm cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3.5 px-4 text-white font-extrabold rounded-2xl transition-all shadow-sm text-sm cursor-pointer ${
              isDanger 
                ? "bg-coral-500 hover:bg-coral-600 shadow-coral-500/10" 
                : "bg-navy-900 hover:bg-navy-800 dark:bg-coral-500 dark:hover:bg-coral-600 shadow-navy-950/10"
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
