/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}> = ({ onClick, disabled = false, label = 'Sign in with Google', compact = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`gsi-material-button inline-flex items-center justify-center whitespace-nowrap shrink-0 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium border border-slate-300 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
      compact ? 'gap-1.5 px-2.5 py-1.5 text-xs' : 'gap-3 px-4 py-2.5 text-sm'
    }`}
  >
    <span className={`gsi-material-button-icon shrink-0 block ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className={`block ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
    </span>
    <span className="gsi-material-button-contents font-semibold">{label}</span>
  </button>
);
