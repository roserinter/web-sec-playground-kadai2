"use client";

import React from "react";

interface Props {
  password?: string | null;
}

export const PasswordStrength: React.FC<Props> = ({ password }) => {
  const calc = (pw?: string | null) => {
    if (!pw) return { score: 0, label: "弱い" };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (pw.length >= 12) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    let label = "弱い";
    if (score >= 5) label = "強い";
    else if (score >= 3) label = "普通";
    return { score, label };
  };

  const { score, label } = calc(password);

  const bars = [0,1,2,3,4,5].map(i => (
    <div key={i} className={`h-2 flex-1 mx-0.5 rounded ${i < score ? (score>=5? 'bg-green-500' : score>=3? 'bg-yellow-400' : 'bg-red-500') : 'bg-gray-200'}`}></div>
  ));

  return (
    <div className="mt-2">
      <div className="flex gap-x-2 items-center">
        <div className="flex w-full">{bars}</div>
        <div className="w-24 text-right text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
};
