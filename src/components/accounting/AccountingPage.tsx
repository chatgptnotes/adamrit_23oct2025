import React, { useState } from 'react';
import TallyHeader from './TallyHeader';
import RightSidebar from './RightSidebar';
import MasterCreation from './MasterCreation';
import MasterAlteration from './MasterAlteration';
import ChartOfAccounts from './ChartOfAccounts';
import VoucherCreation from './VoucherCreationSimple';
import DayBook from './DayBook';
import Banking from './Banking';
import BalanceSheet from './BalanceSheet';
import ProfitLoss from './ProfitLoss';
import StockSummary from './StockSummary';
import RatioAnalysis from './RatioAnalysis';
import Dashboard from './Dashboard';
import DisplayMoreReports from './DisplayMoreReports';
import TrialBalance from './TrialBalance';
import DayBookReport from './DayBookReport';
import CashFlow from './CashFlow';
import FundsFlow from './FundsFlow';
import AccountBooks from './AccountBooks';

const AccountingPage: React.FC = () => {
  const [showMasterCreation, setShowMasterCreation] = useState(false);
  const [showMasterAlteration, setShowMasterAlteration] = useState(false);
  const [showChartOfAccounts, setShowChartOfAccounts] = useState(false);
  const [showVoucherCreation, setShowVoucherCreation] = useState(false);
  const [showDayBook, setShowDayBook] = useState(false);
  const [showBanking, setShowBanking] = useState(false);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  const [showProfitLoss, setShowProfitLoss] = useState(false);
  const [showStockSummary, setShowStockSummary] = useState(false);
  const [showRatioAnalysis, setShowRatioAnalysis] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDisplayMoreReports, setShowDisplayMoreReports] = useState(false);
  const [showTrialBalance, setShowTrialBalance] = useState(false);
  const [showDayBookReport, setShowDayBookReport] = useState(false);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [showFundsFlow, setShowFundsFlow] = useState(false);
  const [showAccountBooks, setShowAccountBooks] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TallyPrime Header */}
      <TallyHeader />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">

        {/* Tally Prime Style Dashboard */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '600px' }}>

            <div className="flex">
              {/* Left Panel - Company Info */}
              <div className="w-2/5 p-6 border-r">
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">CURRENT PERIOD</div>
                  <div className="font-medium">1-Apr-24 to 31-Mar-25</div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-2">CURRENT DATE</div>
                  <div className="font-medium">Monday, 31-Mar-2025</div>
                </div>

                <div className="border rounded p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">NAME OF COMPANY</div>
                    <div className="text-sm text-gray-600">DATE OF LAST ENTRY</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-blue-600">AARTI PVT LMT</div>
                    <div className="font-medium">31-Mar-25</div>
                  </div>
                </div>
              </div>

              {/* Center Panel - Gateway of Tally */}
              <div className="w-2/5 p-6">
                <div className="bg-blue-600 text-white text-center py-3 rounded-t">
                  <h2 className="font-bold">Gateway of Tally</h2>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-b">
                  {/* Masters Section */}
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-2">MASTERS</div>
                    <div className="bg-yellow-400 text-center py-2 mb-2 rounded">
                      <div
                        className="font-medium cursor-pointer hover:text-gray-700"
                        onClick={() => setShowMasterCreation(true)}
                      >
                        Create
                      </div>
                      <div
                        className="text-sm cursor-pointer hover:text-gray-700"
                        onClick={() => setShowMasterAlteration(true)}
                      >
                        Alter
                      </div>
                      <div
                        className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowChartOfAccounts(true)}
                      >
                        Chart of Accounts
                      </div>
                    </div>
                  </div>

                  {/* Transactions Section */}
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-600 mb-2">TRANSACTIONS</div>
                    <div className="space-y-1">
                      <div
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowVoucherCreation(true)}
                      >
                        Vouchers
                      </div>
                      <div
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowDayBook(true)}
                      >
                        Day Book
                      </div>
                    </div>
                  </div>

                  {/* Utilities Section */}
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-600 mb-2">UTILITIES</div>
                    <div
                      className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      onClick={() => setShowBanking(true)}
                    >
                      Banking
                    </div>
                  </div>

                  {/* Reports Section */}
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-600 mb-2">REPORTS</div>
                    <div className="space-y-1">
                      <div
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowBalanceSheet(true)}
                      >
                        Balance Sheet
                      </div>
                      <div
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowProfitLoss(true)}
                      >
                        Profit & Loss A/c
                      </div>
                      <div
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowStockSummary(true)}
                      >
                        Stock Summary
                      </div>
                      <div
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setShowRatioAnalysis(true)}
                      >
                        Ratio Analysis
                      </div>
                      <div
                        className="text-blue-600 underline cursor-pointer mt-2 hover:text-blue-800"
                        onClick={() => setShowDisplayMoreReports(true)}
                      >
                        Display More Reports
                      </div>
                      <div
                        className="text-blue-600 underline cursor-pointer font-medium hover:text-blue-800"
                        onClick={() => setShowDashboard(true)}
                      >
                        Dashboard
                      </div>
                    </div>
                  </div>

                  {/* Quit */}
                  <div className="px-4 pb-4">
                    <div className="text-blue-600 underline cursor-pointer">Quit</div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Function Keys Sidebar */}
              <div className="w-1/5">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Master Creation Modal */}
      {showMasterCreation && (
        <MasterCreation onClose={() => setShowMasterCreation(false)} />
      )}

      {/* Master Alteration Modal */}
      {showMasterAlteration && (
        <MasterAlteration onClose={() => setShowMasterAlteration(false)} />
      )}

      {/* Chart of Accounts Modal */}
      {showChartOfAccounts && (
        <ChartOfAccounts onClose={() => setShowChartOfAccounts(false)} />
      )}

      {/* Voucher Creation Modal */}
      {showVoucherCreation && (
        <VoucherCreation onClose={() => setShowVoucherCreation(false)} />
      )}

      {/* Day Book Modal */}
      {showDayBook && (
        <DayBook onClose={() => setShowDayBook(false)} />
      )}

      {/* Banking Modal */}
      {showBanking && (
        <Banking onClose={() => setShowBanking(false)} />
      )}

      {/* Balance Sheet Modal */}
      {showBalanceSheet && (
        <BalanceSheet onClose={() => setShowBalanceSheet(false)} />
      )}

      {/* Profit & Loss Modal */}
      {showProfitLoss && (
        <ProfitLoss onClose={() => setShowProfitLoss(false)} />
      )}

      {/* Stock Summary Modal */}
      {showStockSummary && (
        <StockSummary onClose={() => setShowStockSummary(false)} />
      )}

      {/* Ratio Analysis Modal */}
      {showRatioAnalysis && (
        <RatioAnalysis onClose={() => setShowRatioAnalysis(false)} />
      )}

      {/* Dashboard Modal */}
      {showDashboard && (
        <Dashboard onClose={() => setShowDashboard(false)} />
      )}

      {/* Display More Reports Modal */}
      {showDisplayMoreReports && (
        <DisplayMoreReports
          onClose={() => setShowDisplayMoreReports(false)}
          onTrialBalanceClick={() => {
            setShowDisplayMoreReports(false);
            setShowTrialBalance(true);
          }}
          onDayBookClick={() => {
            setShowDisplayMoreReports(false);
            setShowDayBookReport(true);
          }}
          onCashFlowClick={() => {
            setShowDisplayMoreReports(false);
            setShowCashFlow(true);
          }}
          onFundsFlowClick={() => {
            setShowDisplayMoreReports(false);
            setShowFundsFlow(true);
          }}
          onAccountBooksClick={() => {
            setShowDisplayMoreReports(false);
            setShowAccountBooks(true);
          }}
        />
      )}

      {/* Trial Balance Modal */}
      {showTrialBalance && (
        <TrialBalance onClose={() => setShowTrialBalance(false)} />
      )}

      {/* Day Book Report Modal */}
      {showDayBookReport && (
        <DayBookReport onClose={() => setShowDayBookReport(false)} />
      )}

      {/* Cash Flow Modal */}
      {showCashFlow && (
        <CashFlow onClose={() => setShowCashFlow(false)} />
      )}

      {/* Funds Flow Modal */}
      {showFundsFlow && (
        <FundsFlow onClose={() => setShowFundsFlow(false)} />
      )}

      {/* Account Books Modal */}
      {showAccountBooks && (
        <AccountBooks onClose={() => setShowAccountBooks(false)} />
      )}
    </div>
  );
};

export default AccountingPage;
