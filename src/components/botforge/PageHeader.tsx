"use client";
export default function PageHeader({ title, subtitle }:{ title:string; subtitle?:string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-black dark:text-white">{title}</h1>
      {subtitle ? <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{subtitle}</p> : null}
    </div>
  );
}