import React from 'react';
import { useParams } from 'react-router-dom';

export default function PVIFormPrint() {
  const { visitId } = useParams<{ visitId: string }>();

  const handlePrint = () => {
    window.print();
  };

  if (!visitId) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Visit ID is required to display PVI form.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Print Button - Hidden in print */}
      <div className="no-print mb-4 text-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Print PVI Form
        </button>
      </div>

      {/* PVI Form Content */}
      <div className="max-w-4xl mx-auto border-2 border-black p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">ADAMRIT HOSPITAL</h1>
          <p className="text-gray-600">Hospital Management Information System</p>
          <div className="mt-4 p-4 border-2 border-black">
            <h2 className="text-2xl font-bold">PATIENT VOICE & SATISFACTION FORM (PVI)</h2>
            <p className="text-lg">Visit ID: {visitId}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            PATIENT INFORMATION
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Patient Name:</strong> ___________________</p>
              <p><strong>Patient ID:</strong> ___________________</p>
              <p><strong>Visit ID:</strong> {visitId}</p>
            </div>
            <div>
              <p><strong>Discharge Date:</strong> ___________________</p>
              <p><strong>Department:</strong> ___________________</p>
              <p><strong>Length of Stay:</strong> ___________________</p>
            </div>
          </div>
        </div>

        {/* Satisfaction Survey */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            SATISFACTION SURVEY
          </h3>
          <p className="text-sm mb-4">Please rate your experience (1 = Poor, 5 = Excellent):</p>
          
          <div className="space-y-4">
            {[
              'Overall hospital experience',
              'Quality of medical care',
              'Nursing care and attention',
              'Doctor communication',
              'Hospital cleanliness',
              'Food quality',
              'Billing and discharge process',
              'Staff courtesy and helpfulness'
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="flex-1">{item}:</span>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <label key={rating} className="flex items-center">
                      <input type="radio" name={`rating-${index}`} value={rating} className="mr-1" />
                      {rating}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            COMMENTS & SUGGESTIONS
          </h3>
          <div className="space-y-4">
            <div>
              <p><strong>What did you like most about your stay?</strong></p>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-dotted border-black h-6 w-full"></div>
                ))}
              </div>
            </div>
            <div>
              <p><strong>What could we improve?</strong></p>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-dotted border-black h-6 w-full"></div>
                ))}
              </div>
            </div>
            <div>
              <p><strong>Would you recommend our hospital to others?</strong></p>
              <div className="flex gap-8 mt-2">
                <label className="flex items-center">
                  <input type="radio" name="recommend" value="yes" className="mr-2" />
                  Yes, definitely
                </label>
                <label className="flex items-center">
                  <input type="radio" name="recommend" value="maybe" className="mr-2" />
                  Maybe
                </label>
                <label className="flex items-center">
                  <input type="radio" name="recommend" value="no" className="mr-2" />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            CONTACT INFORMATION (Optional)
          </h3>
          <div className="space-y-2">
            <p><strong>Phone Number:</strong> ___________________</p>
            <p><strong>Email:</strong> ___________________</p>
            <div className="mt-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                I would like to be contacted regarding my feedback
              </label>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-12">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-b-2 border-black h-16 mb-2"></div>
              <p className="font-semibold">PATIENT/GUARDIAN SIGNATURE</p>
              <p className="text-sm text-gray-600">Date: ___________</p>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-black h-16 mb-2"></div>
              <p className="font-semibold">HOSPITAL STAFF SIGNATURE</p>
              <p className="text-sm text-gray-600">Date: ___________</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Thank you for choosing Adamrit Hospital. Your feedback is valuable to us!</p>
          <p>Generated on: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}