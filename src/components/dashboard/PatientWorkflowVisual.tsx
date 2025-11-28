
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, FileText, Receipt, ArrowRight } from 'lucide-react';

export const PatientWorkflowVisual: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Patient Management Workflow
        </h3>
        
        <div className="flex items-center justify-center space-x-4 md:space-x-8">
          {/* Step 1: Patient Registration */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-blue-700 text-sm">Patient Registration</h4>
            <p className="text-xs text-gray-600 mt-1">Unique Patient ID<br />Generated</p>
            <div className="mt-2 px-2 py-1 bg-blue-100 rounded text-xs font-mono text-blue-800">
              PAT-XXXXXXXX
            </div>
          </div>

          {/* Arrow 1 */}
          <ArrowRight className="h-6 w-6 text-gray-400 hidden md:block" />

          {/* Step 2: Visit Registration */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-lg animate-pulse">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-green-700 text-sm">Visit Registration</h4>
            <p className="text-xs text-gray-600 mt-1">Visit ID Created<br />for Each Visit</p>
            <div className="mt-2 px-2 py-1 bg-green-100 rounded text-xs font-mono text-green-800">
              VIS-XXXXXXXX
            </div>
          </div>

          {/* Arrow 2 */}
          <ArrowRight className="h-6 w-6 text-gray-400 hidden md:block" />

          {/* Step 3: Treatment Complete */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-green-700 text-sm">Treatment Complete</h4>
            <p className="text-xs text-gray-600 mt-1">Patient Care<br />Process Completed</p>
            <div className="mt-2 px-2 py-1 bg-green-100 rounded text-xs font-mono text-green-800">
              COMPLETE
            </div>
          </div>
        </div>

        {/* Process Description */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Each patient gets a <span className="font-semibold text-blue-600">unique Patient ID</span> upon registration. 
            Every visit creates a new <span className="font-semibold text-green-600">Visit ID</span>, 
            and billing details are added after visit completion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
