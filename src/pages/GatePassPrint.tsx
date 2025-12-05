import React from 'react';
import { useParams } from 'react-router-dom';
import { GatePassPrint } from '@/components/discharge/GatePassPrint';

export default function GatePassPrintPage() {
  const { visitId } = useParams<{ visitId: string }>();

  if (!visitId) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Visit ID is required to display gate pass.</p>
      </div>
    );
  }

  return <GatePassPrint visitId={visitId} />;
}