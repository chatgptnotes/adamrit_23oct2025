import React, { useState } from 'react';
import { IconButton } from './IconButton';

export const FormulaBar: React.FC = () => {
  const [cellReference, setCellReference] = useState('E5');
  const [formula, setFormula] = useState('');

  return (
    <section className="flex items-start gap-2 self-stretch relative px-5 py-2 max-sm:p-1">
      <div className="flex items-center gap-10 relative max-sm:gap-5">
        <input
          type="text"
          value={cellReference}
          onChange={(e) => setCellReference(e.target.value)}
          className="text-black text-base font-normal bg-transparent border-none outline-none max-md:text-sm max-sm:text-sm"
          style={{ width: '40px' }}
        />
        <IconButton title="Select range">
          <div
            dangerouslySetInnerHTML={{
              __html:
                "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22855)\"> <path d=\"M7 10L12 15L17 10H7Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22855\"> <rect width=\"24\" height=\"24\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
            }}
          />
        </IconButton>
      </div>
      <div className="w-px h-6 relative bg-[#C7C7C7] max-sm:h-5" />
      <IconButton title="Functions" disabled>
        <div
          dangerouslySetInnerHTML={{
            __html:
              "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22859)\"> <path d=\"M18 4H6V6L12.5 12L6 18V20H18V17H11L16 12L11 7H18V4Z\" fill=\"#B1B1B1\"></path> </g> <defs> <clipPath id=\"clip0_40_22859\"> <rect width=\"24\" height=\"24\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
          }}
        />
      </IconButton>
      <input
        type="text"
        value={formula}
        onChange={(e) => setFormula(e.target.value)}
        placeholder="Enter formula..."
        className="flex-1 text-black text-base font-normal bg-transparent border-none outline-none max-md:text-sm max-sm:text-sm"
      />
    </section>
  );
};
