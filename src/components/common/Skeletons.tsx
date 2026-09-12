import React from "react";

export function AppLayoutSkeleton() {
  return (
    <div className="w-full flex-1 p-6 sm:p-12 mx-auto max-w-4xl animate-pulse">
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-3xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-sm p-6">
            <div className="flex gap-4">
               <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
               <div className="flex-1 space-y-2 py-1">
                 <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                 <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
               </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 animate-pulse">
      <div>
        <div className="h-6 w-24 bg-brand-50 dark:bg-brand-950/50 rounded-full mb-3"></div>
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-md"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-10 w-32 bg-brand-100 dark:bg-brand-900/30 rounded-2xl"></div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col justify-between h-56 rounded-3xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-sm p-6">
          <div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-4/5"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between">
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
             <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
             <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
          </div>
          <div className="mt-4 h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="mt-4 flex items-center justify-between">
             <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
             <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
      <div className="w-full">
        <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1 mr-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1 mr-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1 mr-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1 mr-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded flex-1 mr-4"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded flex-1 mr-4"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded flex-1 mr-4"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded flex-1 mr-4"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 animate-pulse flex flex-col justify-between">
       <div className="flex justify-between">
          <div>
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
            <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="h-6 w-24 bg-brand-50 dark:bg-brand-900/20 rounded-full"></div>
       </div>
       <div className="h-48 w-full bg-slate-50 dark:bg-slate-800/30 rounded-xl mt-6"></div>
    </div>
  );
}
