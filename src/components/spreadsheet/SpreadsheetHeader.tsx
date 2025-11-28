import React from 'react';
import { IconButton } from './IconButton';

export const SpreadsheetHeader: React.FC = () => {
  return (
    <header className="flex flex-col items-start self-stretch relative bg-[#F9FBFD]">
      <div className="flex justify-between items-center self-stretch relative px-5 py-3">
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 relative">
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg id=\"I40:22725;3:179\" width=\"28\" height=\"37\" viewBox=\"0 0 28 37\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sheets-icon-page\" style=\"width: 27px; height: 37px; flex-shrink: 0; fill: #20A464; position: absolute; left: 7px; top: 7px\"> <path d=\"M3.16663 0.166504C1.78591 0.166504 0.666626 1.28579 0.666626 2.6665V34.3332C0.666626 35.7139 1.78591 36.8332 3.16663 36.8332H24.8333C26.214 36.8332 27.3333 35.7139 27.3333 34.3332V10.1665L17.3333 0.166504H3.16663Z\" fill=\"#20A464\"></path> </svg>",
                }}
              />
            </div>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg id=\"I40:22725;3:180\" width=\"28\" height=\"4\" viewBox=\"0 0 28 4\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sheets-icon-shadow\" style=\"width: 27px; height: 3px; flex-shrink: 0; fill: #149456; position: absolute; left: 7px; top: 41px\"> <path d=\"M3.16663 3.83317C1.78591 3.83317 0.666626 2.71388 0.666626 1.33317V0.916504C0.666626 2.29721 1.78591 3.4165 3.16663 3.4165H24.8333C26.214 3.4165 27.3333 2.29721 27.3333 0.916504V1.33317C27.3333 2.71388 26.214 3.83317 24.8333 3.83317H3.16663Z\" fill=\"#149456\"></path> </svg>",
                }}
              />
            </div>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg id=\"I40:22725;3:181\" width=\"18\" height=\"4\" viewBox=\"0 0 18 4\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sheets-icon-highlight\" style=\"width: 17px; height: 3px; flex-shrink: 0; fill: #38AE74; position: absolute; left: 7px; top: 7px\"> <path d=\"M3.16663 0.166504C1.78591 0.166504 0.666626 1.28579 0.666626 2.6665V3.08317C0.666626 1.70246 1.78591 0.583171 3.16663 0.583171H17.75L17.3333 0.166504H3.16663Z\" fill=\"#38AE74\"></path> </svg>",
                }}
              />
            </div>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg id=\"I40:22725;3:182\" width=\"10\" height=\"11\" viewBox=\"0 0 10 11\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sheets-icon-fold-shadow\" style=\"width: 9px; height: 10px; flex-shrink: 0; fill: linear-gradient(0deg, #20A464 0%, #207E55 102.08%); position: absolute; left: 24px; top: 16px\"> <path d=\"M9.33331 10.7085V2.16683L7.87498 0.708496H0.842194C0.285379 0.708496 0.00652602 1.38171 0.400254 1.77544L9.33331 10.7085Z\" fill=\"url(#paint0_linear_604_74)\"></path> <defs> <linearGradient id=\"paint0_linear_604_74\" x1=\"4.77463\" y1=\"10.7085\" x2=\"4.77463\" y2=\"0.500163\" gradientUnits=\"userSpaceOnUse\"> <stop stop-color=\"#20A464\"></stop> <stop offset=\"1\" stop-color=\"#207E55\"></stop> </linearGradient> </defs> </svg>",
                }}
              />
            </div>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg id=\"I40:22725;3:183\" width=\"11\" height=\"11\" viewBox=\"0 0 11 11\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sheets-icon-fold\" style=\"width: 10px; height: 10px; flex-shrink: 0; fill: #8ED1B1; position: absolute; left: 23px; top: 7px\"> <path d=\"M0.333374 0.166504L10.3334 10.1665H2.83337C1.45266 10.1665 0.333374 9.04722 0.333374 7.6665V0.166504Z\" fill=\"#8ED1B1\"></path> </svg>",
                }}
              />
            </div>
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg id=\"I40:22725;3:184\" width=\"14\" height=\"13\" viewBox=\"0 0 14 13\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sheets-icon-icon\" style=\"width: 13px; height: 12px; flex-shrink: 0; fill: #FFF; position: absolute; left: 13px; top: 25px\"> <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M13.6667 0.0834961V12.1668H0.333374V0.0834961H13.6667ZM6.16671 1.75016H2.00004V3.8335H6.16671V1.75016ZM7.83337 3.8335V1.75016H12V3.8335H7.83337ZM6.16671 5.0835H2.00004V7.16683H6.16671V5.0835ZM7.83337 7.16683V5.0835H12V7.16683H7.83337ZM6.16671 8.41683H2.00004V10.5002H6.16671V8.41683ZM7.83337 10.5002V8.41683H12V10.5002H7.83337Z\" fill=\"white\"></path> </svg>",
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 relative">
            <div className="flex items-start gap-4 relative max-md:gap-3 max-sm:gap-2">
              <h1 className="text-black text-xl font-normal relative max-md:text-lg max-sm:text-base">
                Untitled Google Sheet
              </h1>
              <div className="flex items-start gap-4 relative max-md:gap-3 max-sm:gap-2">
                <IconButton title="Star">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22730)\"> <path d=\"M22 9.24L14.81 8.62L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.55 13.97L22 9.24ZM12 15.4L8.24 17.67L9.24 13.39L5.92 10.51L10.3 10.13L12 6.1L13.71 10.14L18.09 10.52L14.77 13.4L15.77 17.68L12 15.4Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22730\"> <rect width=\"24\" height=\"24\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
                    }}
                  />
                </IconButton>
                <IconButton title="Move to folder">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22733)\"> <path d=\"M9.17 6L11.17 8H20V18H4V6H9.17ZM10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22733\"> <rect width=\"24\" height=\"24\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
                    }}
                  />
                </IconButton>
                <IconButton title="All changes saved">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22736)\"> <path d=\"M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.62 6 16.88 7.86 17.39 10.43L17.69 11.93L19.22 12.04C20.78 12.14 22 13.45 22 15C22 16.65 20.65 18 19 18ZM10 14.18L7.91 12.09L6.5 13.5L10 17L16.01 10.99L14.6 9.58L10 14.18Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22736\"> <rect width=\"24\" height=\"24\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
                    }}
                  />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 relative max-sm:gap-3">
          <div className="flex items-start gap-8 relative max-sm:gap-4">
            <IconButton title="See version history">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg width=\"29\" height=\"29\" viewBox=\"0 0 29 29\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22751)\"> <path d=\"M15.7083 3.625C9.70292 3.625 4.83334 8.49458 4.83334 14.5H1.20834L5.90875 19.2004L5.99334 19.3696L10.875 14.5H7.25C7.25 9.82375 11.0321 6.04167 15.7083 6.04167C20.3846 6.04167 24.1667 9.82375 24.1667 14.5C24.1667 19.1763 20.3846 22.9583 15.7083 22.9583C13.3763 22.9583 11.2617 22.0038 9.73917 20.4692L8.02334 22.185C9.99292 24.1546 12.6996 25.375 15.7083 25.375C21.7138 25.375 26.5833 20.5054 26.5833 14.5C26.5833 8.49458 21.7138 3.625 15.7083 3.625ZM14.5 9.66667V15.7083L19.6354 18.7533L20.5658 17.2067L16.3125 14.6812V9.66667H14.5Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22751\"> <rect width=\"29\" height=\"29\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
                }}
              />
            </IconButton>
            <IconButton title="Open comment history">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg width=\"29\" height=\"29\" viewBox=\"0 0 29 29\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22754)\"> <path d=\"M26.5713 4.83317C26.5713 3.504 25.4958 2.4165 24.1667 2.4165H4.83334C3.50417 2.4165 2.41667 3.504 2.41667 4.83317V19.3332C2.41667 20.6623 3.50417 21.7498 4.83334 21.7498H21.75L26.5833 26.5832L26.5713 4.83317ZM24.1667 4.83317V20.7469L22.7529 19.3332H4.83334V4.83317H24.1667ZM7.25 14.4998H21.75V16.9165H7.25V14.4998ZM7.25 10.8748H21.75V13.2915H7.25V10.8748ZM7.25 7.24984H21.75V9.6665H7.25V7.24984Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22754\"> <rect width=\"29\" height=\"29\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
                }}
              />
            </IconButton>
          </div>
          <button className="flex h-10 items-center gap-2 relative bg-[#C2E7FF] px-5 py-0 rounded-[40px] hover:bg-[#B0DCFF] transition-colors">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  "<svg width=\"18\" height=\"19\" viewBox=\"0 0 18 19\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <g clip-path=\"url(#clip0_40_22758)\"> <path d=\"M13.5 6.5H12.75V5C12.75 2.93 11.07 1.25 9 1.25C6.93 1.25 5.25 2.93 5.25 5V6.5H4.5C3.675 6.5 3 7.175 3 8V15.5C3 16.325 3.675 17 4.5 17H13.5C14.325 17 15 16.325 15 15.5V8C15 7.175 14.325 6.5 13.5 6.5ZM6.75 5C6.75 3.755 7.755 2.75 9 2.75C10.245 2.75 11.25 3.755 11.25 5V6.5H6.75V5ZM13.5 15.5H4.5V8H13.5V15.5ZM9 13.25C9.825 13.25 10.5 12.575 10.5 11.75C10.5 10.925 9.825 10.25 9 10.25C8.175 10.25 7.5 10.925 7.5 11.75C7.5 12.575 8.175 13.25 9 13.25Z\" fill=\"black\"></path> </g> <defs> <clipPath id=\"clip0_40_22758\"> <rect width=\"18\" height=\"18\" fill=\"white\" transform=\"translate(0 0.5)\"></rect> </clipPath> </defs> </svg>",
              }}
            />
            <span className="text-black text-base font-normal relative max-md:text-sm max-sm:text-sm">
              Share
            </span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">U</span>
          </div>
        </div>
      </div>
    </header>
  );
};
