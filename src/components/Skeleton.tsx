import React from "react";

export const TableSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header */}
      <div className="h-12 bg-gray-200 rounded"></div>
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="animate-pulse p-6 border rounded-lg space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      ))}
      <div className="h-10 bg-gray-300 rounded"></div>
    </div>
  );
};

export const ListSkeleton = () => {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple inline skeleton for smaller components
export const InlineSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

export default TableSkeleton;
