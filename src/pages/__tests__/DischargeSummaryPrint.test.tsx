import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DischargeSummaryPrint from '../DischargeSummaryPrint';

// Mock the DischargeSummary component
jest.mock('@/components/DischargeSummary', () => {
  return function MockDischargeSummary({ visitId, allPatientData }: any) {
    return (
      <div data-testid="discharge-summary">
        <p>Visit ID: {visitId}</p>
        <p>Patient Data: {allPatientData ? 'Loaded' : 'Not loaded'}</p>
      </div>
    );
  };
});

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              visit_id: 'TEST123',
              patients: {
                name: 'Test Patient',
                age: '30',
                gender: 'Male',
                patients_id: 'P123'
              },
              visit_diagnoses: [],
              visit_medications: [],
              visit_surgeries: [],
              visit_labs: [],
              visit_radiology: [],
              visit_esic_surgeons: [],
              visit_hope_surgeons: [],
              referees: []
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

const renderWithProviders = (component: React.ReactElement, visitId = 'TEST123') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ visitId: 'TEST123' }),
}));

describe('DischargeSummaryPrint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    renderWithProviders(<DischargeSummaryPrint />);
    expect(screen.getByText('Loading discharge summary...')).toBeInTheDocument();
  });

  test('renders print button', async () => {
    renderWithProviders(<DischargeSummaryPrint />);
    
    // Wait for loading to complete and check for print button
    await screen.findByText('Print Discharge Summary');
    expect(screen.getByText('Print Discharge Summary')).toBeInTheDocument();
  });

  test('renders back button', async () => {
    renderWithProviders(<DischargeSummaryPrint />);
    
    await screen.findByText('Back');
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  test('shows error message when visitId is missing', () => {
    // Mock useParams to return undefined visitId
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ visitId: undefined }),
    }));

    renderWithProviders(<DischargeSummaryPrint />);
    expect(screen.getByText('Visit ID is required to display discharge summary.')).toBeInTheDocument();
  });
});
