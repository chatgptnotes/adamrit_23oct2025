import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Search, Calendar, DollarSign, Trash2, FolderOpen, FolderX, CheckCircle, XCircle, Clock, MinusCircle, RotateCcw, Printer, Filter, MessageSquare, ClipboardList, ArrowUpDown, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { EditPatientDialog } from '@/components/EditPatientDialog';
import { usePatients } from '@/hooks/usePatients';
import { CascadingBillingStatusDropdown } from '@/components/shared/CascadingBillingStatusDropdown';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnPickerModal } from '@/components/print/ColumnPickerModal';
import { PrintPreview } from '@/components/print/PrintPreview';
import { usePrintColumns } from '@/hooks/usePrintColumns';
import { IPD_PRINT_COLUMNS, IPD_PRINT_PRESETS, generateIPDFilterSummary } from '@/config/ipdPrintColumns';
import { printSticker } from '@/utils/stickerPrinter';
import '@/styles/print.css';

const TodaysIpdDashboard = () => {
  const { isAdmin, hospitalConfig, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [selectedPatientForView, setSelectedPatientForView] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [srNo, setSrNo] = useState('');
  const [billingExecutiveInputs, setBillingExecutiveInputs] = useState({});
  const [billingExecutiveFilter, setBillingExecutiveFilter] = useState('');
  const [billingStatusInputs, setBillingStatusInputs] = useState({});
  const [billingStatusFilter, setBillingStatusFilter] = useState('');
  const [bunchNumberInputs, setBunchNumberInputs] = useState({});
  const [bunchFilter, setBunchFilter] = useState('');
  const [corporateFilter, setCorporateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [referralLetterStatus, setReferralLetterStatus] = useState<Record<string, boolean>>({});
  const [commentDialogs, setCommentDialogs] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [originalComments, setOriginalComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  const [savedComments, setSavedComments] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'sr_no' | 'sr_no_desc' | 'latest' | 'oldest' | 'name_asc' | 'name_desc' | 'visit_id_asc' | 'visit_id_desc'>('latest');
  const navigate = useNavigate();

  const { diagnoses, updatePatient } = usePatients();

  // Column filter states (top-level)
  const [fileStatusFilter, setFileStatusFilter] = useState<string[]>([]);
  const [condonationSubmissionFilter, setCondonationSubmissionFilter] = useState<string[]>([]);
  const [condonationIntimationFilter, setCondonationIntimationFilter] = useState<string[]>([]);
  const [extensionOfStayFilter, setExtensionOfStayFilter] = useState<string[]>([]);
  const [additionalApprovalsFilter, setAdditionalApprovalsFilter] = useState<string[]>([]);

  // Advance payment status tracking
  const [advancePayments, setAdvancePayments] = useState<Record<string, number>>({});
  const [billTotals, setBillTotals] = useState<Record<string, number>>({});

  // Print functionality
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const {
    selectedIds: printSelectedIds,
    setSelectedIds: setPrintSelectedIds,
    settings: printSettings,
    setSettings: setPrintSettings,
    isPickerOpen: isPrintPickerOpen,
    setIsPickerOpen: setIsPrintPickerOpen,
    openPicker: openPrintPicker
  } = usePrintColumns('ipd-dashboard', IPD_PRINT_COLUMNS);

  // Reusable multi-select column filter using DropdownMenu
  const ColumnFilter = ({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) => {
    const toggleValue = (value: string) => {
      onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
    };
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 px-2">
            <Filter className="h-3 w-3 mr-1" />
            {selected.length ? `${selected.length} selected` : 'All'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => onChange([])}>Clear</DropdownMenuItem>
          <DropdownMenuSeparator />
          {options.map((opt) => (
            <DropdownMenuCheckboxItem key={opt} checked={selected.includes(opt)} onCheckedChange={() => toggleValue(opt)}>
              {opt}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Custom component for billing executive dropdown with options
  const BillingExecutiveInput = ({ visit, isAdmin }) => {
    const [selectedValue, setSelectedValue] = useState(visit.billing_executive || '');
    const [debouncedValue] = useDebounce(selectedValue, 2000); // 2 seconds delay

    const billingExecutiveOptions = [
      'Dr.B.K.Murali',
      'Ruby',
      'Shrikant',
      'Gaurav',
      'Dr. Swapnil',
      'Dr.Sachin',
      'Dr.Shiraj',
      'Dr. Sharad',
      'Shashank',
      'Shweta',
      'Suraj',
      'Nitin',
      'Sonali',
      'Ruchika',
      'Pragati',
      'Rachana',
      'Kashish',
      'Aman',
      'Dolly',
      'Ruchi',
      'Gayatri',
      'Noor',
      'Nisha',
      'Diksha',
      'Ayush',
      'Kiran',
      'Pratik',
      'Azhar',
      'Tejas',
      'Abhishek',
      'Chandrprakash'
    ];




    useEffect(() => {
      if (!isAdmin) return; // do not submit changes when not admin
      if (debouncedValue !== (visit.billing_executive || '')) {
        handleBillingExecutiveSubmit(visit.visit_id, debouncedValue);
      }
    }, [isAdmin, debouncedValue, visit.billing_executive, visit.visit_id]);

    return (
      <select
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        disabled={!isAdmin}
        className="w-32 h-8 text-sm border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Executive</option>
        {billingExecutiveOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  // Custom component for billing status dropdown - now using shared cascading dropdown
  const BillingStatusDropdown = ({ visit, disabled = false }) => {
    if (disabled) {
      return (
        <div className="text-xs">
          <div>{visit.billing_status || '-'}</div>
          {visit.billing_sub_status ? (
            <div className="text-muted-foreground">{visit.billing_sub_status}</div>
          ) : null}
        </div>
      );
    }
    return (
      <CascadingBillingStatusDropdown
        visit={visit}
        queryKey={['todays-ipd-visits']}
        onUpdate={() => refetch()}
      />
    );
  };

  // Custom component for bunch number input with debouncing
  const BunchNumberInput = ({ visit, isAdmin }) => {
    const [selectedValue, setSelectedValue] = useState(visit.bunch_no || '');
    const [debouncedValue] = useDebounce(selectedValue, 2000); // 2 seconds delay

    useEffect(() => {
      if (debouncedValue !== (visit.bunch_no || '')) {
        handleBunchNumberSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.bunch_no, visit.visit_id]);

    if (!isAdmin) return <span className="text-sm">{visit.bunch_no || '-'}</span>;
    return (
      <Input
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        placeholder="Enter Bunch No"
        className="w-24 h-8 text-sm"
      />
    );
  };

  // Custom component for Claim ID input with debouncing
  const ClaimIdInput = ({ visit }) => {
    const [value, setValue] = useState(visit.claim_id || '');
    const [debouncedValue] = useDebounce(value, 7000);

    useEffect(() => {
      if (debouncedValue !== (visit.claim_id || '')) {
        handleClaimIdSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.claim_id, visit.visit_id]);

    // Sync with server updates
    useEffect(() => {
      setValue(visit.claim_id || '');
    }, [visit.claim_id]);

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleClaimIdSubmit(visit.visit_id, value)}
        placeholder="Enter Claim ID"
        className="w-36 h-8 text-sm"
      />
    );
  };

  // Custom component for ESIC UHID input with debouncing
  const EsicUhidInput = ({ visit }) => {
    const [value, setValue] = useState(visit.esic_uh_id || '');
    const [debouncedValue] = useDebounce(value, 7000);

    useEffect(() => {
      if (debouncedValue !== (visit.esic_uh_id || '')) {
        handleEsicUhidSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.esic_uh_id, visit.visit_id]);

    // Sync with server updates
    useEffect(() => {
      setValue(visit.esic_uh_id || '');
    }, [visit.esic_uh_id]);

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleEsicUhidSubmit(visit.visit_id, value)}
        placeholder="Enter ESIC UHID"
        className="w-40 h-8 text-sm"
      />
    );
  };

  // File Status Toggle Component
  const FileStatusToggle = ({ visit }) => {
    const [fileStatus, setFileStatus] = useState(visit.file_status || 'available');

    const handleToggleFileStatus = async () => {
      const newStatus = fileStatus === 'available' ? 'missing' : 'available';
      setFileStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ file_status: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating file status:', error);
          // Revert the state on error
          setFileStatus(fileStatus);
          return;
        }

        console.log('File status updated successfully for visit:', visit.visit_id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Error updating file status:', error);
        setFileStatus(fileStatus);
      }
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${
          fileStatus === 'available'
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
        onClick={handleToggleFileStatus}
        title={fileStatus === 'available' ? 'File Available - Click to mark as Missing' : 'File Missing - Click to mark as Available'}
      >
        {fileStatus === 'available' ? (
          <>
            <FolderOpen className="h-3 w-3 mr-1" />
            Available
          </>
        ) : (
          <>
            <FolderX className="h-3 w-3 mr-1" />
            Missing
          </>
        )}
      </Button>
    );
  };

  // Condonation Delay Claim Toggle Component
  const CondonationDelayToggle = ({ visit }) => {
    const [condonationStatus, setCondonationStatus] = useState(visit.condonation_delay_claim || 'not_present');

    const handleToggleCondonation = async () => {
      const newStatus = condonationStatus === 'present' ? 'not_present' : 'present';
      setCondonationStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ condonation_delay_claim: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating condonation delay claim:', error);
          // Revert the state on error
          setCondonationStatus(condonationStatus);
          return;
        }

        console.log('Condonation delay claim updated successfully for visit:', visit.visit_id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Error updating condonation delay claim:', error);
        setCondonationStatus(condonationStatus);
      }
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${
          condonationStatus === 'present'
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
        onClick={handleToggleCondonation}
        title={condonationStatus === 'present' ? 'Condonation Present - Click to mark as Not Present' : 'Condonation Not Present - Click to mark as Present'}
      >
        {condonationStatus === 'present' ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Not Present
          </>
        )}
      </Button>
    );
  };

  // Condonation Delay Intimation Toggle Component
  const CondonationDelayIntimationToggle = ({ visit }) => {
    const [intimationStatus, setIntimationStatus] = useState(visit.condonation_delay_intimation || 'not_present');

    const handleToggleIntimation = async () => {
      const newStatus = intimationStatus === 'present' ? 'not_present' : 'present';
      setIntimationStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ condonation_delay_intimation: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating condonation delay intimation:', error);
          // Revert the state on error
          setIntimationStatus(intimationStatus);
          return;
        }

        console.log('Condonation delay intimation updated successfully for visit:', visit.visit_id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Error updating condonation delay intimation:', error);
        setIntimationStatus(intimationStatus);
      }
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${
          intimationStatus === 'present'
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
        onClick={handleToggleIntimation}
        title={intimationStatus === 'present' ? 'Intimation Present - Click to mark as Not Present' : 'Intimation Not Present - Click to mark as Present'}
      >
        {intimationStatus === 'present' ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Not Present
          </>
        )}
      </Button>
    );
  };

  // Extension of Stay 3-State Toggle Component
  const ExtensionOfStayToggle = ({ visit }) => {
    const [extensionStatus, setExtensionStatus] = useState(visit.extension_of_stay || 'not_required');

    const handleToggleExtension = async () => {
      let newStatus: 'not_required' | 'taken' | 'not_taken';
      if (extensionStatus === 'not_required') {
        newStatus = 'taken';
      } else if (extensionStatus === 'taken') {
        newStatus = 'not_taken';
      } else {
        newStatus = 'not_required';
      }

      setExtensionStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ extension_of_stay: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating extension of stay:', error);
          setExtensionStatus(extensionStatus);
          return;
        }

        console.log('Extension of stay updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating extension of stay:', error);
        setExtensionStatus(extensionStatus);
      }
    };

    const getStatusConfig = () => {
      switch (extensionStatus) {
        case 'taken':
          return {
            className: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
            icon: <CheckCircle className="h-3 w-3 mr-1" />,
            text: 'Taken'
          };
        case 'not_taken':
          return {
            className: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
            icon: <XCircle className="h-3 w-3 mr-1" />,
            text: 'Not Taken'
          };
        default:
          return {
            className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
            icon: <MinusCircle className="h-3 w-3 mr-1" />,
            text: 'Not Required'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${config.className}`}
        onClick={handleToggleExtension}
        title={`Extension of Stay: ${config.text} - Click to cycle through states`}
      >
        {config.icon}
        {config.text}
      </Button>
    );
  };

  // Additional Approvals 3-State Toggle Component
  const AdditionalApprovalsToggle = ({ visit }) => {
    const [approvalsStatus, setApprovalsStatus] = useState(visit.additional_approvals || 'not_required');

    const handleToggleApprovals = async () => {
      let newStatus: 'not_required' | 'taken' | 'not_taken';
      if (approvalsStatus === 'not_required') {
        newStatus = 'taken';
      } else if (approvalsStatus === 'taken') {
        newStatus = 'not_taken';
      } else {
        newStatus = 'not_required';
      }

      setApprovalsStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ additional_approvals: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating additional approvals:', error);
          setApprovalsStatus(approvalsStatus);
          return;
        }

        console.log('Additional approvals updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating additional approvals:', error);
        setApprovalsStatus(approvalsStatus);
      }
    };

    const getStatusConfig = () => {
      switch (approvalsStatus) {
        case 'taken':
          return {
            className: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
            icon: <CheckCircle className="h-3 w-3 mr-1" />,
            text: 'Taken'
          };
        case 'not_taken':
          return {
            className: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
            icon: <XCircle className="h-3 w-3 mr-1" />,
            text: 'Not Taken'
          };
        default:
          return {
            className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
            icon: <MinusCircle className="h-3 w-3 mr-1" />,
            text: 'Not Required'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${config.className}`}
        onClick={handleToggleApprovals}
        title={`Additional Approvals: ${config.text} - Click to cycle through states`}
      >
        {config.icon}
        {config.text}
      </Button>
    );
  };

  // Photos Dropdown Component
  const PhotosDropdown = ({ visit }) => {
    const photosOptions = ['P2-Form', 'P6-Form', 'Patient Photo Geotag'];

    const [selectedPhotos, setSelectedPhotos] = useState(() => {
      const photosDoc = visit.photos_documents;
      if (photosDoc && typeof photosDoc === 'object' && Array.isArray(photosDoc.selected)) {
        return photosDoc.selected;
      }
      return [];
    });

    const handlePhotoToggle = async (option) => {
      const newSelected = selectedPhotos.includes(option)
        ? selectedPhotos.filter(item => item !== option)
        : [...selectedPhotos, option];

      setSelectedPhotos(newSelected);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            photos_documents: {
              selected: newSelected,
              updated_at: new Date().toISOString()
            }
          })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating photos:', error);
          setSelectedPhotos(selectedPhotos);
          return;
        }

        console.log('Photos updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating photos:', error);
        setSelectedPhotos(selectedPhotos);
      }
    };

    const getButtonStyle = () => {
      if (selectedPhotos.length === photosOptions.length) {
        return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
      } else if (selectedPhotos.length > 0) {
        return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200';
      }
      return 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200';
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 ${getButtonStyle()}`}
            title={`Photos: ${selectedPhotos.length}/${photosOptions.length} selected`}
          >
            {selectedPhotos.length}/${photosOptions.length}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {photosOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selectedPhotos.includes(option)}
              onCheckedChange={() => handlePhotoToggle(option)}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Sign Dropdown Component
  const SignDropdown = ({ visit }) => {
    const signOptions = ['Referral', 'Entitlement', 'IP-Details', 'P2-Form', 'P6-Form', 'Final-Bill', 'E-pehchan Card', 'Doctor Sign'];

    const [selectedSigns, setSelectedSigns] = useState(() => {
      const signDoc = visit.sign_documents;
      if (signDoc && typeof signDoc === 'object' && Array.isArray(signDoc.selected)) {
        return signDoc.selected;
      }
      return [];
    });

    const handleSignToggle = async (option) => {
      const newSelected = selectedSigns.includes(option)
        ? selectedSigns.filter(item => item !== option)
        : [...selectedSigns, option];

      setSelectedSigns(newSelected);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            sign_documents: {
              selected: newSelected,
              updated_at: new Date().toISOString()
            }
          })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating signs:', error);
          setSelectedSigns(selectedSigns);
          return;
        }

        console.log('Signs updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating signs:', error);
        setSelectedSigns(selectedSigns);
      }
    };

    const getButtonStyle = () => {
      if (selectedSigns.length === signOptions.length) {
        return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
      } else if (selectedSigns.length > 0) {
        return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200';
      }
      return 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200';
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 ${getButtonStyle()}`}
            title={`Signs: ${selectedSigns.length}/${signOptions.length} selected`}
          >
            {selectedSigns.length}/${signOptions.length}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {signOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selectedSigns.includes(option)}
              onCheckedChange={() => handleSignToggle(option)}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Hospital Stamp Dropdown Component
  const HospitalStampDropdown = ({ visit }) => {
    const hospitalStampOptions = ['Final Bill', 'Discharge Summary', 'P2-Form with Sign', 'P6-Form', 'OT-Notes'];

    const [selectedHospitalStamps, setSelectedHospitalStamps] = useState(() => {
      const stampDoc = visit.hospital_stamp_documents;
      if (stampDoc && typeof stampDoc === 'object' && Array.isArray(stampDoc.selected)) {
        return stampDoc.selected;
      }
      return [];
    });

    const handleHospitalStampToggle = async (option) => {
      const newSelected = selectedHospitalStamps.includes(option)
        ? selectedHospitalStamps.filter(item => item !== option)
        : [...selectedHospitalStamps, option];

      setSelectedHospitalStamps(newSelected);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            hospital_stamp_documents: {
              selected: newSelected,
              updated_at: new Date().toISOString()
            }
          })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating hospital stamps:', error);
          setSelectedHospitalStamps(selectedHospitalStamps);
          return;
        }

        console.log('Hospital stamps updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating hospital stamps:', error);
        setSelectedHospitalStamps(selectedHospitalStamps);
      }
    };

    const getButtonStyle = () => {
      if (selectedHospitalStamps.length === hospitalStampOptions.length) {
        return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
      } else if (selectedHospitalStamps.length > 0) {
        return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200';
      }
      return 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200';
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 ${getButtonStyle()}`}
            title={`Hospital Stamps: ${selectedHospitalStamps.length}/${hospitalStampOptions.length} selected`}
          >
            {selectedHospitalStamps.length}/${hospitalStampOptions.length}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {hospitalStampOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selectedHospitalStamps.includes(option)}
              onCheckedChange={() => handleHospitalStampToggle(option)}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Dr Surgeon Stamp Dropdown Component
  const DrSurgeonStampDropdown = ({ visit }) => {
    const drSurgeonStampOptions = ['Discharge Summary', 'OT Notes'];

    const [selectedDrSurgeonStamps, setSelectedDrSurgeonStamps] = useState(() => {
      const stampDoc = visit.dr_surgeon_stamp_documents;
      if (stampDoc && typeof stampDoc === 'object' && Array.isArray(stampDoc.selected)) {
        return stampDoc.selected;
      }
      return [];
    });

    const handleDrSurgeonStampToggle = async (option) => {
      const newSelected = selectedDrSurgeonStamps.includes(option)
        ? selectedDrSurgeonStamps.filter(item => item !== option)
        : [...selectedDrSurgeonStamps, option];

      setSelectedDrSurgeonStamps(newSelected);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            dr_surgeon_stamp_documents: {
              selected: newSelected,
              updated_at: new Date().toISOString()
            }
          })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating dr surgeon stamps:', error);
          setSelectedDrSurgeonStamps(selectedDrSurgeonStamps);
          return;
        }

        console.log('Dr surgeon stamps updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating dr surgeon stamps:', error);
        setSelectedDrSurgeonStamps(selectedDrSurgeonStamps);
      }
    };

    const getButtonStyle = () => {
      if (selectedDrSurgeonStamps.length === drSurgeonStampOptions.length) {
        return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
      } else if (selectedDrSurgeonStamps.length > 0) {
        return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200';
      }
      return 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200';
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 ${getButtonStyle()}`}
            title={`Dr/Surgeon Stamps: ${selectedDrSurgeonStamps.length}/${drSurgeonStampOptions.length} selected`}
          >
            {selectedDrSurgeonStamps.length}/${drSurgeonStampOptions.length}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {drSurgeonStampOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selectedDrSurgeonStamps.includes(option)}
              onCheckedChange={() => handleDrSurgeonStampToggle(option)}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Photos Count Button Component
  const PhotosCountButton = ({ visit }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const photosOptions = ['P2-Form', 'P6-Form', 'Patient Photo Geotag'];

    const selectedCount = visit.photos_documents?.selected?.length || 0;
    const totalCount = photosOptions.length;

    const getButtonStyle = () => {
      return 'bg-white text-black hover:bg-gray-50 border border-gray-300';
    };

    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 cursor-pointer ${getButtonStyle()}`}
          onClick={() => setIsModalOpen(true)}
          title={`Photos: ${selectedCount}/${totalCount} selected - Click to manage`}
        >
          {selectedCount}/{totalCount}
        </Button>
        <DocumentModal
          visit={visit}
          docType="photos"
          options={photosOptions}
          title="Photos Documents"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  };

  // Sign Count Button Component
  const SignCountButton = ({ visit }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const signOptions = ['Referral', 'Entitlement', 'IP-Details', 'P2-Form', 'P6-Form', 'Final-Bill', 'E-pehchan Card', 'Doctor Sign'];

    const selectedCount = visit.sign_documents?.selected?.length || 0;
    const totalCount = signOptions.length;

    const getButtonStyle = () => {
      return 'bg-white text-black hover:bg-gray-50 border border-gray-300';
    };

    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 cursor-pointer ${getButtonStyle()}`}
          onClick={() => setIsModalOpen(true)}
          title={`Sign: ${selectedCount}/${totalCount} selected - Click to manage`}
        >
          {selectedCount}/{totalCount}
        </Button>
        <DocumentModal
          visit={visit}
          docType="sign"
          options={signOptions}
          title="Sign Documents"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  };

  // Hospital Stamp Count Button Component
  const HospitalStampCountButton = ({ visit }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const hospitalStampOptions = ['Final Bill', 'Discharge Summary', 'P2-Form with Sign', 'P6-Form', 'OT-Notes'];

    const selectedCount = visit.hospital_stamp_documents?.selected?.length || 0;
    const totalCount = hospitalStampOptions.length;

    const getButtonStyle = () => {
      return 'bg-white text-black hover:bg-gray-50 border border-gray-300';
    };

    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 cursor-pointer ${getButtonStyle()}`}
          onClick={() => setIsModalOpen(true)}
          title={`Hospital Stamp: ${selectedCount}/${totalCount} selected - Click to manage`}
        >
          {selectedCount}/{totalCount}
        </Button>
        <DocumentModal
          visit={visit}
          docType="hospital_stamp"
          options={hospitalStampOptions}
          title="Hospital Stamp Documents"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  };

  // Dr Surgeon Stamp Count Button Component
  const DrSurgeonStampCountButton = ({ visit }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const drSurgeonStampOptions = ['Discharge Summary', 'OT Notes'];

    const selectedCount = visit.dr_surgeon_stamp_documents?.selected?.length || 0;
    const totalCount = drSurgeonStampOptions.length;

    const getButtonStyle = () => {
      return 'bg-white text-black hover:bg-gray-50 border border-gray-300';
    };

    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-12 p-1 text-xs font-medium transition-all duration-200 cursor-pointer ${getButtonStyle()}`}
          onClick={() => setIsModalOpen(true)}
          title={`Dr/Surgeon Stamp: ${selectedCount}/${totalCount} selected - Click to manage`}
        >
          {selectedCount}/{totalCount}
        </Button>
        <DocumentModal
          visit={visit}
          docType="dr_surgeon_stamp"
          options={drSurgeonStampOptions}
          title="Dr/Surgeon Stamp Documents"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  };

  // Document Modal Component
  const DocumentModal = ({ visit, docType, options, title, isOpen, onClose }) => {
    const [selectedItems, setSelectedItems] = useState(() => {
      const doc = visit[`${docType}_documents`];
      if (doc && typeof doc === 'object' && Array.isArray(doc.selected)) {
        return doc.selected;
      }
      return [];
    });

    const handleToggleItem = async (option) => {
      const newSelected = selectedItems.includes(option)
        ? selectedItems.filter(item => item !== option)
        : [...selectedItems, option];

      setSelectedItems(newSelected);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            [`${docType}_documents`]: {
              selected: newSelected,
              updated_at: new Date().toISOString()
            }
          })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error(`Error updating ${docType}:`, error);
          setSelectedItems(selectedItems);
          return;
        }

        console.log(`${docType} updated successfully for visit:`, visit.visit_id);
        refetch();
      } catch (error) {
        console.error(`Error updating ${docType}:`, error);
        setSelectedItems(selectedItems);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {title} ({selectedItems.length}/{options.length} selected)
            </DialogTitle>
            <DialogDescription>
              Select the documents that are available for this patient visit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedItems.includes(option)}
                  onCheckedChange={() => handleToggleItem(option)}
                />
                <label
                  htmlFor={option}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };


  // Fetch corporates from corporate table
  const { data: corporates = [] } = useQuery({
    queryKey: ['corporates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching corporates:', error);
        return [];
      }

      return data || [];
    }
  });

  const { data: todaysVisits = [], isLoading, refetch } = useQuery({
    queryKey: ['todays-visits', hospitalConfig?.name],
    queryFn: async () => {
      console.log('🏥 TodaysIpdDashboard: Fetching visits for hospital:', hospitalConfig?.name);

      let query = supabase
        .from('visits')
        .select(`
          *,
          discharge_date,
          patients!inner(
            id,
            name,
            patients_id,
            insurance_person_no,
            hospital_name,
            corporate,
            age,
            gender,
            phone,
            emergency_contact_name,
            emergency_contact_mobile
          )
        `)
        .eq('patient_type', 'IPD')
        .order('sr_no', { ascending: true, nullsFirst: false })
        .order('visit_date', { ascending: true });

      // Apply hospital filter if hospitalConfig exists
      if (hospitalConfig?.name) {
        query = query.eq('patients.hospital_name', hospitalConfig.name);
        console.log('🏥 TodaysIpdDashboard: Applied hospital filter for:', hospitalConfig.name);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching today\'s visits:', error);
        throw error;
      }

      console.log(`✅ TodaysIpdDashboard: Found ${data?.length || 0} visits for ${hospitalConfig?.name}`);

      // Debug: Check comments and discharge_date in fetched data
      console.log('📊 Sample visit data (first visit):', data?.[0]);
      console.log('💬 Comments in first visit:', data?.[0]?.comments);
      console.log('📅 Discharge date in first visit:', data?.[0]?.discharge_date);

      // Log all visits with discharge dates
      const visitsWithDischargeDate = data?.filter(v => v.discharge_date) || [];
      console.log(`📅 Found ${visitsWithDischargeDate.length} visits with discharge_date out of ${data?.length || 0} total visits`);

      // Log all visits with comments
      const visitsWithComments = data?.filter(v => v.comments) || [];
      console.log(`📝 Found ${visitsWithComments.length} visits with comments out of ${data?.length || 0} total visits`);
      if (visitsWithComments.length > 0) {
        console.log('💭 Visits with comments:', visitsWithComments.map(v => ({
          id: v.id,
          visit_id: v.visit_id,
          patient_name: v.patients?.name,
          comments: v.comments
        })));
      }

      // Fetch final_payments for these visits
      const visitIds = data?.map(v => v.visit_id) || [];
      const { data: finalPayments } = await supabase
        .from('final_payments')
        .select('visit_id, id')
        .in('visit_id', visitIds);

      // Add final_payment status to each visit
      const visitsWithPaymentStatus = (data || []).map(visit => ({
        ...visit,
        has_final_payment: finalPayments?.some(fp => fp.visit_id === visit.visit_id) || false
      }));

      // Sort manually to ensure patients with sr_no come first, then patients without sr_no
      const sortedData = visitsWithPaymentStatus.sort((a, b) => {
        // If both have sr_no, sort numerically
        if (a.sr_no && b.sr_no) {
          return parseInt(a.sr_no) - parseInt(b.sr_no);
        }
        // If only a has sr_no, a comes first (starting)
        if (a.sr_no && !b.sr_no) {
          return -1;
        }
        // If only b has sr_no, b comes first (starting)
        if (!a.sr_no && b.sr_no) {
          return 1;
        }
        // If neither has sr_no, both go to end, maintain original order
        return 0;
      });

      return sortedData;
    }
  });

  // Fetch advance payments and bill totals for payment status column
  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!todaysVisits || todaysVisits.length === 0) return;

      const visitIds = todaysVisits.map(v => v.visit_id).filter(Boolean) as string[];
      const patientIds = todaysVisits.map(v => v.patient_id || v.patients?.id).filter(Boolean) as string[];

      if (visitIds.length === 0) return;

      try {
        // Fetch advance payments
        const { data: advanceData, error: advanceError } = await supabase
          .from('advance_payment')
          .select('visit_id, advance_amount')
          .in('visit_id', visitIds);

        if (advanceError) {
          console.error('Error fetching advance payments:', advanceError);
        } else if (advanceData) {
          const advanceSums: Record<string, number> = {};
          advanceData.forEach((payment: { visit_id: string; advance_amount: number }) => {
            if (payment.visit_id) {
              advanceSums[payment.visit_id] = (advanceSums[payment.visit_id] || 0) + (payment.advance_amount || 0);
            }
          });
          setAdvancePayments(advanceSums);
        }

        // Fetch bill totals
        const { data: billData, error: billError } = await supabase
          .from('bills')
          .select('patient_id, total_amount')
          .in('patient_id', patientIds);

        if (billError) {
          console.error('Error fetching bills:', billError);
        } else if (billData) {
          const billMap: Record<string, number> = {};
          billData.forEach((bill: { patient_id: string; total_amount: number | null }) => {
            if (bill.patient_id) {
              billMap[bill.patient_id] = (billMap[bill.patient_id] || 0) + (bill.total_amount || 0);
            }
          });

          const billByVisit: Record<string, number> = {};
          todaysVisits.forEach(v => {
            const patientId = v.patient_id || v.patients?.id;
            if (patientId && v.visit_id && billMap[patientId]) {
              billByVisit[v.visit_id] = billMap[patientId];
            }
          });
          setBillTotals(billByVisit);
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
      }
    };

    fetchPaymentData();
  }, [todaysVisits]);

  // Function to check if referral letter is uploaded for a visit
  const checkReferralLetterUploaded = async (visitId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('is_uploaded')
        .eq('visit_id', visitId)
        .eq('document_type_id', 1) // Referral Letter from ESIC is document type 1
        .eq('is_uploaded', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking referral letter:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking referral letter:', error);
      return false;
    }
  };

  // Function to check if visit is within 24 hours
  const isWithin24Hours = (visitDate: string) => {
    if (!visitDate) return false;
    
    const visitTime = new Date(visitDate).getTime();
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (currentTime - visitTime) <= twentyFourHours;
  };

  // Function to get remaining time until 24 hours
  const getRemainingTime = (visitDate: string) => {
    if (!visitDate) return '';
    
    const visitTime = new Date(visitDate).getTime();
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const elapsedTime = currentTime - visitTime;
    const remainingTime = twentyFourHours - elapsedTime;
    
    if (remainingTime <= 0) return '';
    
    const hours = Math.floor(remainingTime / (60 * 60 * 1000));
    const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m remaining`;
  };

  // Render advance payment status with color coding
  // Red: No payment, Orange: Partial/Advance payment, Green: Full payment
  const renderAdvancePaymentStatus = (visit: any) => {
    const visitId = visit.visit_id || '';
    const totalAdvance = advancePayments[visitId] || 0;
    const totalBill = billTotals[visitId] || 0;

    if (totalAdvance === 0) {
      // No payment made - Red
      return (
        <div className="flex justify-center" title="No payment received">
          <Circle className="h-4 w-4 text-red-600 fill-red-600" />
        </div>
      );
    } else if (totalBill > 0 && totalAdvance < totalBill) {
      // Partial payment (advance) - Orange
      return (
        <div className="flex justify-center" title={`Advance payment: ₹${totalAdvance.toLocaleString()} / ₹${totalBill.toLocaleString()}`}>
          <Circle className="h-4 w-4 text-orange-500 fill-orange-500" />
        </div>
      );
    } else {
      // Full payment - Green
      return (
        <div className="flex justify-center" title={`Full payment received: ₹${totalAdvance.toLocaleString()}`}>
          <Circle className="h-4 w-4 text-green-600 fill-green-600" />
        </div>
      );
    }
  };

  // Load referral letter status for all visits
  useEffect(() => {
    const loadReferralLetterStatus = async () => {
      if (!todaysVisits || todaysVisits.length === 0) return;

      const statusPromises = todaysVisits.map(async (visit) => {
        const isUploaded = await checkReferralLetterUploaded(visit.visit_id);
        return { visitId: visit.visit_id, isUploaded };
      });

      const results = await Promise.all(statusPromises);
      const statusMap: Record<string, boolean> = {};
      
      results.forEach(({ visitId, isUploaded }) => {
        statusMap[visitId] = isUploaded;
      });

      setReferralLetterStatus(statusMap);
    };

    loadReferralLetterStatus();
  }, [todaysVisits]);

  // Compute unique options for column filters from current data
  const fileStatusOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.file_status).filter(Boolean))) as string[], [todaysVisits]);
  const condonationSubmissionOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.condonation_delay_claim).filter(Boolean))) as string[], [todaysVisits]);
  const condonationIntimationOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.condonation_delay_intimation).filter(Boolean))) as string[], [todaysVisits]);
  const extensionOfStayOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.extension_of_stay).filter(Boolean))) as string[], [todaysVisits]);
  const additionalApprovalsOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.additional_approvals).filter(Boolean))) as string[], [todaysVisits]);

  const filteredVisits = useMemo(() => {
    // First, filter the visits
    const filtered = (todaysVisits || []).filter(visit => {
      const matchesSearch = visit.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.visit_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.appointment_with?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBillingExecutive = !billingExecutiveFilter ||
        visit.billing_executive === billingExecutiveFilter;

      const matchesBillingStatus = !billingStatusFilter ||
        visit.billing_status === billingStatusFilter;

      const matchesBunch = !bunchFilter ||
        visit.bunch_no === bunchFilter;

      const matchesCorporate = !corporateFilter ||
        visit.patients?.corporate?.toLowerCase().trim() === corporateFilter.toLowerCase().trim();


      const includeBy = (selected: string[], value?: string | null) =>
        selected.length === 0 || (value ? selected.includes(value) : false);

      const matchesFile = includeBy(fileStatusFilter, visit.file_status);
      const matchesCondSub = includeBy(condonationSubmissionFilter, visit.condonation_delay_claim);
      const matchesCondInt = includeBy(condonationIntimationFilter, visit.condonation_delay_intimation);
      const matchesExtStay = includeBy(extensionOfStayFilter, visit.extension_of_stay);
      const matchesAddAppr = includeBy(additionalApprovalsFilter, visit.additional_approvals);

      return matchesSearch && matchesBillingExecutive && matchesBillingStatus && matchesBunch && matchesCorporate && matchesFile && matchesCondSub && matchesCondInt && matchesExtStay && matchesAddAppr;
    });

    // Then, sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'sr_no':
          // Ascending order by sr_no (default)
          const srNoA = Number(a.sr_no) || 0;
          const srNoB = Number(b.sr_no) || 0;
          return srNoA - srNoB;

        case 'sr_no_desc':
          // Descending order by sr_no
          const srNoDescA = Number(a.sr_no) || 0;
          const srNoDescB = Number(b.sr_no) || 0;
          return srNoDescB - srNoDescA;

        case 'latest':
          // Latest first (newest visit_id or created_at)
          return (b.visit_id || '').localeCompare(a.visit_id || '');

        case 'oldest':
          // Oldest first
          return (a.visit_id || '').localeCompare(b.visit_id || '');

        case 'name_asc':
          // Patient name A-Z
          const nameA = a.patients?.name || '';
          const nameB = b.patients?.name || '';
          return nameA.localeCompare(nameB);

        case 'name_desc':
          // Patient name Z-A
          const nameDescA = a.patients?.name || '';
          const nameDescB = b.patients?.name || '';
          return nameDescB.localeCompare(nameDescA);

        case 'visit_id_asc':
          // Visit ID ascending
          return (a.visit_id || '').localeCompare(b.visit_id || '');

        case 'visit_id_desc':
          // Visit ID descending
          return (b.visit_id || '').localeCompare(a.visit_id || '');

        default:
          return 0;
      }
    });

    return sorted;
  }, [todaysVisits, searchTerm, billingExecutiveFilter, billingStatusFilter, bunchFilter, corporateFilter, fileStatusFilter, condonationSubmissionFilter, condonationIntimationFilter, extensionOfStayFilter, additionalApprovalsFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil((filteredVisits?.length || 0) / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVisits = filteredVisits?.slice(startIndex, endIndex) || [];
  const startItem = filteredVisits?.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredVisits?.length || 0);

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <Badge
        variant="secondary"
        className={statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}
      >
        {status || 'Scheduled'}
      </Badge>
    );
  };

  const handleVisitIdClick = (patientId: string, visitId: string) => {
    // Navigate to patient profile with the specific patient and visit selected
    navigate(`/patient-profile?patient=${patientId}&visit=${visitId}`);
  };

  const handleBillClick = async (visit) => {
    // Determine if this is an ESIC patient (has ESIC UHID or corporate field indicates ESIC)
    const isESICPatient = Boolean(visit.esic_uh_id) ||
                          visit.patients?.corporate?.toLowerCase().includes('esic') ||
                          visit.patients?.corporate?.toLowerCase() === 'esic';

    // For private patients, allow direct access to billing without referral document requirements
    if (!isESICPatient) {
      navigate(`/final-bill/${visit.visit_id}`);
      return;
    }

    // For ESIC patients only - check referral letter requirements
    const isReferralLetterUploaded = await checkReferralLetterUploaded(visit.visit_id);
    const withinGracePeriod = isWithin24Hours(visit.visit_date || visit.created_at);

    // If within 24 hours, allow access even without referral letter
    if (withinGracePeriod) {
      navigate(`/final-bill/${visit.visit_id}`);
      return;
    }

    // After 24 hours, require referral letter for ESIC patients only
    if (!isReferralLetterUploaded) {
      // Show popup notification
      alert(`24-hour grace period has expired. Please upload the referral letter for patient ${visit.patients?.name} before accessing billing section.`);
      return;
    }

    // Navigate to final bill page with patient and visit data
    navigate(`/final-bill/${visit.visit_id}`);
  };

  const handleEditPatientClick = (visit) => {
    const patient = visit.patients;
    if (patient) {
      // Parse remark2 to extract individual fields
      let hopeSurgeon = '';
      let hopeConsultants = '';
      let surgeon = '';
      let consultant = '';
      let sanctionStatus = '';

      console.log('🔍 Edit Patient - visit.remark2:', visit.remark2);

      if (visit.remark2) {
        const remarks = visit.remark2.split('; ');
        remarks.forEach(remark => {
          if (remark.startsWith('Hope Surgeon: ')) {
            hopeSurgeon = remark.replace('Hope Surgeon: ', '');
          } else if (remark.startsWith('Hope Consultants: ')) {
            hopeConsultants = remark.replace('Hope Consultants: ', '');
          } else if (remark.startsWith('ESIC Surgeons: ')) {
            surgeon = remark.replace('ESIC Surgeons: ', '');
          } else if (remark.startsWith('Referee: ')) {
            consultant = remark.replace('Referee: ', '');
          } else if (remark.startsWith('Surgery Status: ')) {
            sanctionStatus = remark.replace('Surgery Status: ', '');
          }
        });
      }

      console.log('🔍 Extracted hopeSurgeon:', hopeSurgeon);
      console.log('🔍 Extracted hopeConsultants:', hopeConsultants);
      console.log('🔍 Extracted surgeon:', surgeon);
      console.log('🔍 Extracted consultant:', consultant);

      const patientForEdit = {
        id: patient.id,
        patientUuid: patient.id,
        name: patient.name,
        patients_id: patient.patients_id,
        insurance_person_no: patient.insurance_person_no || '',
        primaryDiagnosis: visit.reason_for_visit || '',
        complications: visit.remark1 || '',
        surgery: visit.sst_treatment || '',
        labs: '',
        radiology: '',
        labsRadiology: '',
        antibiotics: '',
        otherMedications: '',
        surgeon: surgeon,
        consultant: consultant,
        hopeSurgeon: hopeSurgeon,
        hopeConsultants: hopeConsultants,
        sanctionStatus: sanctionStatus,
        admissionDate: visit.admission_date || '',
        surgeryDate: visit.surgery_date || '',
        dischargeDate: visit.discharge_date || '',
        visitId: visit.id
      };
      setSelectedPatientForEdit(patientForEdit);
      setShowEditPatientDialog(true);
    }
  };

  const handleSavePatient = (updatedPatient) => {
    updatePatient(updatedPatient);
    setShowEditPatientDialog(false);
    setSelectedPatientForEdit(null);
  };

  // Comment handlers
  const handleCommentClick = (visit: any) => {
    console.log('🔍 Opening comment dialog for visit:', visit.id);
    console.log('📋 Visit object:', visit);
    console.log('💬 Existing comment from visit.comments:', visit.comments);

    const existingComment = visit.comments || '';
    console.log('📝 Loading comment into dialog:', existingComment);

    // Load existing comment if any
    setCommentTexts(prev => ({
      ...prev,
      [visit.id]: existingComment
    }));

    // Store original comment to track changes
    setOriginalComments(prev => ({
      ...prev,
      [visit.id]: existingComment
    }));

    // Open dialog for this visit
    setCommentDialogs(prev => ({
      ...prev,
      [visit.id]: true
    }));
  };

  const handleCommentChange = (visitId: string, text: string) => {
    setCommentTexts(prev => ({
      ...prev,
      [visitId]: text
    }));
  };

  // Debounced function to auto-save comments
  const [debouncedCommentTexts] = useDebounce(commentTexts, 1500); // 1.5 seconds delay

  // Auto-save comments when debounced value changes
  useEffect(() => {
    Object.entries(debouncedCommentTexts).forEach(async ([visitId, text]) => {
      // Only save if dialog is open and text has actually changed from original
      const originalText = originalComments[visitId] || '';
      const hasChanged = text !== originalText;

      if (commentDialogs[visitId] && text !== undefined && hasChanged) {
        console.log('🔄 Attempting to save comment for visit:', visitId, 'Text:', text, 'Original:', originalText);
        setSavingComments(prev => ({ ...prev, [visitId]: true }));

        try {
          const { error, data } = await supabase
            .from('visits')
            .update({ comments: text })
            .eq('id', visitId)
            .select();

          if (error) {
            console.error('❌ Error saving comment:', error);
            console.error('Error details:', {
              visitId,
              text,
              errorMessage: error.message,
              errorCode: error.code
            });
            alert(`Failed to save comment: ${error.message}`);
            setSavingComments(prev => ({ ...prev, [visitId]: false }));
          } else {
            console.log('✅ Comment saved successfully for visit:', visitId, 'Response:', data);
            // Update the original comment after successful save
            setOriginalComments(prev => ({ ...prev, [visitId]: text }));
            // Show saved indicator
            setSavingComments(prev => ({ ...prev, [visitId]: false }));
            setSavedComments(prev => ({ ...prev, [visitId]: true }));
            // Hide saved indicator after 2 seconds
            setTimeout(() => {
              setSavedComments(prev => ({ ...prev, [visitId]: false }));
            }, 2000);
            // Refresh the data to get updated comments
            refetch();
          }
        } catch (error) {
          console.error('❌ Exception while saving comment:', error);
          console.error('Exception details:', {
            visitId,
            text,
            error: error.message || error
          });
          alert(`Failed to save comment: ${error.message || error}`);
          setSavingComments(prev => ({ ...prev, [visitId]: false }));
        }
      }
    });
  }, [debouncedCommentTexts, commentDialogs, originalComments]);

  const handleSrNoSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ sr_no: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating sr_no:', error);
        return;
      }

      console.log('Sr No updated successfully for visit:', visitId);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating sr_no:', error);
    }
  };

  const handleBillingExecutiveSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ billing_executive: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating billing_executive:', error);
        return;
      }

      console.log('Billing Executive updated successfully for visit:', visitId);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating billing_executive:', error);
    }
  };

  const handleBillingStatusSubmit = async (visitId: string, value: string) => {
    console.log('🔄 Starting billing status update for visitId:', visitId, 'value:', value);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ billing_status: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('❌ Error updating billing_status:', error);
        return;
      }

      console.log('✅ Billing Status updated successfully for visit:', visitId, 'with value:', value);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('❌ Exception during billing_status update:', error);
    }
  };

  const handleBillingSubStatusSubmit = async (visitId: string, value: string) => {
    console.log('🔄 Starting billing sub status update for visitId:', visitId, 'value:', value);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ billing_sub_status: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('❌ Error updating billing_sub_status:', error);
        return;
      }

      console.log('✅ Billing Sub Status updated successfully for visit:', visitId, 'with value:', value);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('❌ Exception during billing_sub_status update:', error);
    }
  };

  const handleClaimIdSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ claim_id: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating claim_id:', error);
        return;
      }

      console.log('Claim ID updated successfully for visit:', visitId);
      refetch();
    } catch (error) {
      console.error('Error updating claim_id:', error);
    }
  };

  const handleEsicUhidSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ esic_uh_id: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating esic_uh_id:', error);
        return;
      }

      console.log('ESIC UHID updated successfully for visit:', visitId);
      refetch();
    } catch (error) {
      console.error('Error updating esic_uh_id:', error);
    }
  };

  const handleBunchNumberSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ bunch_no: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating bunch_no:', error);
        return;
      }

      console.log('Bunch Number updated successfully for visit:', visitId);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating bunch_no:', error);
    }
  };

  const handleRevokeDischarge = async (visitId: string, patientName: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          discharge_date: null
        })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error revoking discharge:', error);
        alert('Failed to revoke discharge. Please try again.');
        return;
      }

      console.log('Discharge revoked successfully for visit:', visitId);
      refetch(); // Refresh the data
      alert(`Discharge revoked for ${patientName}. Patient moved back to currently admitted.`);
    } catch (error) {
      console.error('Error revoking discharge:', error);
      alert('Failed to revoke discharge. Please try again.');
    }
  };

  const handlePrint = () => {
    openPrintPicker();
  };

  const handlePrintConfirm = () => {
    setIsPrintPickerOpen(false);
    setShowPrintPreview(true);
  };

  const handlePrintPreview = () => {
    setIsPrintPickerOpen(false);
    setShowPrintPreview(true);
  };

  const getCurrentFilters = () => {
    return generateIPDFilterSummary({
      searchTerm,
      billingExecutiveFilter,
      billingStatusFilter,
      bunchFilter,
      corporateFilter,
      fileStatusFilter,
      condonationSubmissionFilter,
      condonationIntimationFilter,
      extensionOfStayFilter,
      additionalApprovalsFilter
    });
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (window.confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      try {
        console.log('Deleting visit and related data for visit ID:', visitId);

        // First get the UUID for this visit_id
        const { data: visitData, error: visitFetchError } = await supabase
          .from('visits')
          .select('id, patient_id')
          .eq('visit_id', visitId)
          .single();

        if (visitFetchError || !visitData) {
          console.error('Error fetching visit data:', visitFetchError);
          alert('Failed to find visit. Please try again.');
          return;
        }

        const visitUUID = visitData.id;
        console.log('Found visit UUID:', visitUUID);

        // Tables with NO ACTION constraint - must delete manually FIRST
        const noActionTables = [
          'visit_complications',
          'visit_surgeons',
          'visit_consultants',
          'doctor_plan'
        ];

        // Tables with CASCADE constraint - will auto-delete when visit is deleted
        // Note: ai_clinical_recommendations also has CASCADE but uses UUID visit_id

        // Tables that might use text visit_id (need to check if they exist)
        const textVisitIdTables = [
          'patient_documents',
          'pharmacy_sales'
        ];

        // STEP 1: Delete from NO ACTION tables first (to avoid constraint violations)
        console.log('🗑️ Step 1: Deleting from NO ACTION constraint tables...');

        for (const tableName of noActionTables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('visit_id', visitUUID);

            if (error) {
              console.error(`❌ Error deleting from ${tableName}:`, error);
              // Continue with other tables even if one fails
            } else {
              console.log(`✅ Deleted data from ${tableName}`);
            }
          } catch (tableError) {
            console.error(`❌ Exception deleting from ${tableName}:`, tableError);
            // Continue with other tables
          }
        }

        // STEP 2: Delete from text-based tables (if they exist)
        console.log('🗑️ Step 2: Deleting from text-based tables...');

        for (const tableName of textVisitIdTables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('visit_id', visitId);

            if (error) {
              console.error(`❌ Error deleting from ${tableName}:`, error);
              // Continue with other tables even if one fails
            } else {
              console.log(`✅ Deleted data from ${tableName}`);
            }
          } catch (tableError) {
            console.error(`❌ Exception deleting from ${tableName}:`, tableError);
            // Continue with other tables
          }
        }

        // Note: CASCADE tables will be automatically deleted when main visit is deleted

        // Delete from bills table (uses patient_id, not visit_id)
        const { error: billsError } = await supabase
          .from('bills')
          .delete()
          .eq('patient_id', visitData.patient_id);

        if (billsError) {
          console.error('Error deleting bills for visit:', billsError);
        } else {
          console.log('✅ Deleted bills data for visit');
        }

        // Finally, delete the visit record itself using UUID
        console.log('Deleting visit record...');
        const { error: visitError } = await supabase
          .from('visits')
          .delete()
          .eq('id', visitUUID);

        if (visitError) {
          console.error('Error deleting visit:', visitError);
          alert('Failed to delete visit. Please try again.');
          return;
        }

        console.log('✅ Successfully deleted visit and all related data');

        // Refresh the visits list
        refetch();
        alert('Visit and all related data deleted successfully.');
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Failed to delete visit. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading today's visits...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">IPD PATIENT DASHBOARD</h1>
              <p className="text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM do, yyyy')} - {filteredVisits?.length || 0} visits scheduled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print List
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort By
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setSortBy('sr_no')} className={sortBy === 'sr_no' ? 'bg-accent' : ''}>
                  Sr No (Ascending) {sortBy === 'sr_no' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('sr_no_desc')} className={sortBy === 'sr_no_desc' ? 'bg-accent' : ''}>
                  Sr No (Descending) {sortBy === 'sr_no_desc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('latest')} className={sortBy === 'latest' ? 'bg-accent' : ''}>
                  Latest First {sortBy === 'latest' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')} className={sortBy === 'oldest' ? 'bg-accent' : ''}>
                  Oldest First {sortBy === 'oldest' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('name_asc')} className={sortBy === 'name_asc' ? 'bg-accent' : ''}>
                  Patient Name (A-Z) {sortBy === 'name_asc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name_desc')} className={sortBy === 'name_desc' ? 'bg-accent' : ''}>
                  Patient Name (Z-A) {sortBy === 'name_desc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('visit_id_asc')} className={sortBy === 'visit_id_asc' ? 'bg-accent' : ''}>
                  Visit ID (Ascending) {sortBy === 'visit_id_asc' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('visit_id_desc')} className={sortBy === 'visit_id_desc' ? 'bg-accent' : ''}>
                  Visit ID (Descending) {sortBy === 'visit_id_desc' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <select
              value={billingExecutiveFilter}
              onChange={(e) => {
                console.log('Billing Executive selected:', e.target.value);
                setBillingExecutiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-48 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Billing Executives</option>
              <option value="Dr.B.K.Murali">Dr.B.K.Murali</option>
              <option value="Ruby">Ruby</option>
              <option value="Shrikant">Shrikant</option>
              <option value="Gaurav">Gaurav</option>
              <option value="Dr. Swapnil">Dr. Swapnil</option>
              <option value="Dr.Sachin">Dr.Sachin</option>
              <option value="Dr.Shiraj">Dr.Shiraj</option>
              <option value="Dr. Sharad">Dr. Sharad</option>
              <option value="Shashank">Shashank</option>
              <option value="Shweta">Shweta</option>
              <option value="Suraj">Suraj</option>
              <option value="Nitin">Nitin</option>
              <option value="Sonali">Sonali</option>
              <option value="Ruchika">Ruchika</option>
              <option value="Pragati">Pragati</option>
              <option value="Rachana">Rachana</option>
              <option value="Kashish">Kashish</option>
              <option value="Aman">Aman</option>
              <option value="Dolly">Dolly</option>
              <option value="Ruchi">Ruchi</option>
              <option value="Gayatri">Gayatri</option>
              <option value="Noor">Noor</option>
              <option value="Nisha">Nisha</option>
              <option value="Diksha">Diksha</option>
              <option value="Ayush">Ayush</option>
              <option value="Kiran">Kiran</option>
              <option value="Pratik">Pratik</option>
              <option value="Azhar">Azhar</option>
              <option value="Tejas">Tejas</option>
              <option value="Abhishek">Abhishek</option>
              <option value="Chandrprakash">Chandrprakash</option>
            </select>

            <select
              value={billingStatusFilter}
              onChange={(e) => { setBillingStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Billing Status</option>
              {[
                'Approval Pending',
                'ID Pending',
                'Doctor Planning Done',
                'Bill Completed',
                'Bill Submitted',
                'Bill uploaded, not couriered',
                'Bill uploaded, couriered',
                'Payment received'
              ].map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Bill Completed' ? 'Bill PDF Completed' : (opt === 'Bill Submitted' ? 'Bill submitted - DSC done' : opt)}
                </option>
              ))}
            </select>
            <select
              value={corporateFilter}
              onChange={(e) => { setCorporateFilter(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Corporates</option>
              {corporates.map((corporate) => (
                <option key={corporate.id} value={corporate.name}>
                  {corporate.name}
                </option>
              ))}
            </select>
            <select
              value={bunchFilter}
              onChange={(e) => { setBunchFilter(e.target.value); setCurrentPage(1); }}
              className="w-36 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Bunches</option>
              {Array.from(new Set((todaysVisits || []).map(visit => visit.bunch_no).filter(Boolean))).sort().map((bunchNo) => (
                <option key={bunchNo} value={bunchNo}>
                  Bunch {bunchNo}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {(todaysVisits || []).filter(v => v.status === 'scheduled' || !v.status).length}
            </div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">
              {(todaysVisits || []).filter(v => v.status === 'in-progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {(todaysVisits || []).filter(v => v.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">
              {(todaysVisits || []).length}
            </div>
            <div className="text-sm text-muted-foreground">Total Visits</div>
          </div>
        </div>

        {/* Print Info - Disabled to remove blank space in print output */}
        {false && (
          <div className="print-info">
            <h3 className="font-semibold">Applied Filters:</h3>
            {billingExecutiveFilter && <p>Billing Executive: {billingExecutiveFilter}</p>}
            {billingStatusFilter && <p>Billing Status: {billingStatusFilter}</p>}
            {bunchFilter && <p>Bunch: {bunchFilter}</p>}
            {searchTerm && <p>Search: {searchTerm}</p>}
            {!billingExecutiveFilter && !billingStatusFilter && !bunchFilter && !searchTerm && <p>No filters applied - Showing all visits</p>}
          </div>
        )}

        {/* Visits Table */}
        <div className="bg-card rounded-lg border no-print">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">IPD PATIENT</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Sr No</TableHead>
                <TableHead className="font-semibold">Bunch No.</TableHead>
                <TableHead className="font-semibold">Visit ID</TableHead>
                <TableHead className="font-semibold">Patient Name</TableHead>
                <TableHead className="font-semibold">Claim ID</TableHead>
                <TableHead className="text-center font-semibold">Payment Received</TableHead>
                <TableHead className="font-semibold">ESIC UHID</TableHead>
                <TableHead className="font-semibold">Bill</TableHead>
                <TableHead className="font-semibold">Admission Notes</TableHead>
                <TableHead className="font-semibold">Corporate</TableHead>
                <TableHead className="font-semibold">Billing Executive</TableHead>
                <TableHead className="font-semibold">Billing Status</TableHead>
                <TableHead className="font-semibold">File Status</TableHead>
                <TableHead className="font-semibold">Photos</TableHead>
                <TableHead className="font-semibold">Sign</TableHead>
                <TableHead className="font-semibold">HospitalStamp</TableHead>
                <TableHead className="font-semibold">DrSurgeonStamp</TableHead>
                <TableHead className="font-semibold">Condonation Delay -submission</TableHead>
                <TableHead className="font-semibold">Condonation Delay -intimation</TableHead>
                <TableHead className="font-semibold">Extension of Stay</TableHead>
                <TableHead className="font-semibold">Additional Approvals</TableHead>
                <TableHead className="font-semibold">Visit Type</TableHead>
                <TableHead className="font-semibold">Stickers</TableHead>
                <TableHead className="font-semibold">Doctor</TableHead>
                <TableHead className="font-semibold">Diagnosis</TableHead>
                <TableHead className="font-semibold">Admission Date</TableHead>
                <TableHead className="font-semibold">Days Admitted</TableHead>
                <TableHead className="font-semibold">Discharge Date</TableHead>
                <TableHead className="font-semibold">Summaries and Certificates</TableHead>
                {isAdmin && <TableHead className="font-semibold">Actions</TableHead>}
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead>
                  <ColumnFilter options={fileStatusOptions} selected={fileStatusFilter} onChange={setFileStatusFilter} />
                </TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead>
                  <ColumnFilter options={condonationSubmissionOptions} selected={condonationSubmissionFilter} onChange={setCondonationSubmissionFilter} />
                </TableHead>
                <TableHead>
                  <ColumnFilter options={condonationIntimationOptions} selected={condonationIntimationFilter} onChange={setCondonationIntimationFilter} />
                </TableHead>
                <TableHead>
                  <ColumnFilter options={extensionOfStayOptions} selected={extensionOfStayFilter} onChange={setExtensionOfStayFilter} />
                </TableHead>
                <TableHead>
                  <ColumnFilter options={additionalApprovalsOptions} selected={additionalApprovalsFilter} onChange={setAdditionalApprovalsFilter} />
                </TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
                {isAdmin && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedVisits.map((visit) => (
                <TableRow key={visit.id} className="hover:bg-muted/50">
                  <TableCell>
                    {isAdmin ? (
                      <Input
                        value={visit.sr_no || ''}
                        onChange={(e) => handleSrNoSubmit(visit.visit_id, e.target.value)}
                        onBlur={(e) => handleSrNoSubmit(visit.visit_id, e.target.value)}
                        placeholder="Enter Sr No"
                        className="w-20 h-8 text-sm"
                      />
                    ) : (
                      <span className="text-sm">{visit.sr_no || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <BunchNumberInput visit={visit} isAdmin={isAdmin} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <button
                      onClick={() => handleVisitIdClick(visit.patient_id, visit.visit_id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                    >
                      {visit.visit_id}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {visit.patients?.name}
                    {visit.discharge_date && <span className="text-red-500 text-xs ml-1">(discharged)</span>}
                  </TableCell>
                  <TableCell>
                    <ClaimIdInput visit={visit} />
                  </TableCell>
                  <TableCell className="text-center">
                    {renderAdvancePaymentStatus(visit)}
                  </TableCell>
                  <TableCell>
                    <EsicUhidInput visit={visit} />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Check if this is an ESIC patient
                      const isESICPatient = Boolean(visit.esic_uh_id) ||
                                            visit.patients?.corporate?.toLowerCase().includes('esic') ||
                                            visit.patients?.corporate?.toLowerCase() === 'esic';

                      // For private patients, always show normal green bill icon (no referral document requirements)
                      if (!isESICPatient) {
                        return (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleBillClick(visit)}
                            title="View Bill - Private Patient"
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        );
                      }

                      // For ESIC patients only - apply referral document logic
                      const hasReferralLetter = referralLetterStatus[visit.visit_id];
                      const withinGracePeriod = isWithin24Hours(visit.visit_date || visit.created_at);
                      const remainingTime = getRemainingTime(visit.visit_date || visit.created_at);

                      // Case 1: Has referral letter - always enabled (green)
                      if (hasReferralLetter) {
                        return (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleBillClick(visit)}
                            title="View Bill - Referral letter uploaded"
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        );
                      }

                      // Case 2: Within 24 hours without referral letter - enabled but orange (grace period)
                      if (withinGracePeriod) {
                        return (
                          <div className="relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleBillClick(visit)}
                            >
                              <DollarSign className="h-4 w-4 text-orange-500" />
                            </Button>

                            {/* Grace period tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-orange-500 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 whitespace-nowrap">
                              <div className="font-medium">⏰ Grace Period Active</div>
                              <div className="text-xs">Billing accessible without referral letter</div>
                              <div className="text-xs font-semibold">Patient: {visit.patients?.name}</div>
                              <div className="text-xs">{remainingTime}</div>
                              <div className="text-xs mt-1 text-orange-100">Please upload referral letter soon</div>

                              {/* Arrow pointing down */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
                            </div>
                          </div>
                        );
                      }

                      // Case 3: After 24 hours without referral letter - disabled (red)
                      return (
                        <div className="relative group">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                            disabled
                            onClick={() => handleBillClick(visit)}
                          >
                            <DollarSign className="h-4 w-4 text-red-600" />
                          </Button>

                          {/* 24-hour expired tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 whitespace-nowrap">
                            <div className="font-medium">🚫 Grace Period Expired</div>
                            <div className="text-xs">24-hour grace period has ended</div>
                            <div className="text-xs">Please upload the referral letter for</div>
                            <div className="text-xs font-semibold">{visit.patients?.name}</div>
                            <div className="text-xs">before accessing billing section</div>
                            
                            {/* Arrow pointing down */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-50"
                      onClick={() => navigate(`/admission-notes/${visit.visit_id}`)}
                      title="Admission Notes"
                    >
                      <FileText className="h-4 w-4 text-green-600" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {visit.patients?.corporate || '—'}
                  </TableCell>
                  <TableCell>
                    <BillingExecutiveInput visit={visit} isAdmin={isAdmin} />
                  </TableCell>
                  <TableCell>
                    <BillingStatusDropdown visit={visit} />
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <FileStatusToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.file_status || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <PhotosCountButton visit={visit} />
                  </TableCell>
                  <TableCell className="text-center">
                    <SignCountButton visit={visit} />
                  </TableCell>
                  <TableCell className="text-center">
                    <HospitalStampCountButton visit={visit} />
                  </TableCell>
                  <TableCell className="text-center">
                    <DrSurgeonStampCountButton visit={visit} />
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <CondonationDelayToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.condonation_delay_claim || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <CondonationDelayIntimationToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.condonation_delay_intimation || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <ExtensionOfStayToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.extension_of_stay || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <AdditionalApprovalsToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.additional_approvals || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {visit.visit_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printSticker({
                        patientName: visit.patients?.name || 'N/A',
                        uhid: visit.esic_uh_id || visit.patients?.patients_id || 'N/A',
                        visitId: visit.visit_id || 'N/A',
                        age: visit.patients?.age || 'N/A',
                        gender: visit.patients?.gender || 'N/A',
                        consultant: visit.appointment_with || 'N/A',
                        department: visit.visit_type || 'General',
                        tariff: visit.patients?.corporate || 'Private'
                      })}
                    >
                      Print Sticker
                    </Button>
                  </TableCell>
                  <TableCell>
                    {visit.appointment_with}
                  </TableCell>
                  <TableCell>
                    General
                  </TableCell>
                  <TableCell>
                    {visit.admission_date ? format(new Date(visit.admission_date), 'MMM dd, yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell>
                    {visit.admission_date ? `${Math.ceil((((visit.discharge_date ? new Date(visit.discharge_date).getTime() : Date.now()) - new Date(visit.admission_date).getTime())) / (1000 * 60 * 60 * 24))} days` : '—'}
                  </TableCell>
                  <TableCell>
                    {visit.discharge_date ? (
                      (() => {
                        try {
                          console.log('🗓️ Discharge date for', visit.patients?.name, ':', visit.discharge_date, 'Type:', typeof visit.discharge_date);
                          return format(new Date(visit.discharge_date), 'MMM dd, yyyy HH:mm');
                        } catch (error) {
                          console.error('❌ Date format error for', visit.patients?.name, ':', error, 'Value:', visit.discharge_date);
                          return String(visit.discharge_date); // Show raw value if format fails
                        }
                      })()
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Select onValueChange={(value) => {
                      if (value === 'discharge-summary') {
                        navigate(`/ipd-discharge-summary/${visit.visit_id}`);
                      } else if (value === 'death-certificate') {
                        navigate(`/death-certificate/${visit.visit_id}`);
                      }
                    }}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discharge-summary">Discharge Summary</SelectItem>
                        <SelectItem value="death-summary" disabled>Death Summary</SelectItem>
                        <SelectItem value="death-certificate">Death Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {isAdmin && (
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-8 w-8 p-0 hover:bg-blue-50"
                         onClick={() => {
                           setSelectedPatientForView(visit);
                           setViewDialogOpen(true);
                         }}
                         title="View Patient Details"
                       >
                         <Eye className="h-4 w-4 text-blue-600" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-10 w-10 p-0 relative bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 rounded-full animate-pulse hover:scale-110 transition-all duration-200 shadow-lg shadow-blue-500/50"
                         onClick={() => handleEditPatientClick(visit)}
                         title="Edit Patient Details"
                       >
                         <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                         <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping animation-delay-75"></div>
                         <FileText className="h-5 w-5 text-blue-600 relative z-10 animate-bounce" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-8 w-8 p-0 hover:bg-green-50"
                         onClick={() => handleCommentClick(visit)}
                         title="View/Add Comments"
                       >
                         <MessageSquare className="h-4 w-4 text-green-600" />
                       </Button>
                       {/* Show Revoke Discharge button only for discharged patients */}
                       {visit.discharge_date && (
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-8 w-8 p-0 hover:bg-orange-50"
                               title="Revoke Discharge - Move back to Currently Admitted"
                             >
                               <RotateCcw className="h-4 w-4 text-orange-600" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Revoke Discharge</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to revoke the discharge for <strong>{visit.patients?.name}</strong>?
                                 This will remove the discharge date/time and move the patient back to "Currently Admitted Patients" list.
                                 This action is typically used for correcting accidental or wrong discharge entries.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => handleRevokeDischarge(visit.visit_id, visit.patients?.name)}
                                 className="bg-orange-600 hover:bg-orange-700"
                               >
                                 Revoke Discharge
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       )}
                       {(user?.email === 'user@ayushmanhospital.com' || user?.email === 'user@hopehospital.com') && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0 hover:bg-red-50"
                           onClick={() => handleDeleteVisit(visit.visit_id)}
                           title="Delete Visit"
                         >
                           <Trash2 className="h-4 w-4 text-red-600" />
                         </Button>
                       )}
                     </div>
                   </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {filteredVisits.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Showing {startItem} to {endItem} of {filteredVisits.length} results
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 w-20 text-sm border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {filteredVisits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No visits scheduled for today.</p>
            <p className="text-sm">Registered visits will appear here.</p>
          </div>
        )}

        {/* Edit Patient Dialog */}
        {selectedPatientForEdit && (
          <EditPatientDialog
            isOpen={showEditPatientDialog}
            onClose={() => {
              setShowEditPatientDialog(false);
              setSelectedPatientForEdit(null);
            }}
            patient={selectedPatientForEdit}
            onSave={handleSavePatient}
          />
        )}

        {/* Comment Dialogs */}
        {paginatedVisits.map((visit) => (
          <Dialog
            key={`comment-dialog-${visit.id}`}
            open={commentDialogs[visit.id] || false}
            onOpenChange={(open) => {
              setCommentDialogs(prev => ({
                ...prev,
                [visit.id]: open
              }));
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Comments for {visit.patients?.name || 'Patient'}</DialogTitle>
                <DialogDescription className="text-xs">
                  Visit ID: {visit.visit_id} | Auto-saves as you type
                </DialogDescription>
              </DialogHeader>

              <div className="relative">
                <textarea
                  className="w-full min-h-[150px] p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
                  placeholder="Add your comments here..."
                  value={commentTexts[visit.id] || ''}
                  onChange={(e) => handleCommentChange(visit.id, e.target.value)}
                />

                {/* Save indicators */}
                {savingComments[visit.id] && (
                  <div className="absolute bottom-2 right-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    Saving...
                  </div>
                )}
                {savedComments[visit.id] && !savingComments[visit.id] && (
                  <div className="absolute bottom-2 right-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                    ✓ Saved
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}

        {/* View Visit Dialog - Shows visit registration information in read-only format */}
        {selectedPatientForView && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-blue-600">
                  Visit Information
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Patient Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Patient Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span> {selectedPatientForView.patients?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Patient ID:</span> {selectedPatientForView.patients?.patients_id || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Gender:</span> {selectedPatientForView.patients?.gender || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Age:</span> {selectedPatientForView.patients?.age || 'N/A'} years
                    </div>
                  </div>
                </div>

                {/* Visit Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-700 mb-2">Visit Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Visit ID:</span> <span className="text-blue-600 font-mono">{selectedPatientForView.visit_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Visit Date:</span> {selectedPatientForView.visit_date ? new Date(selectedPatientForView.visit_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Visit Type:</span> {selectedPatientForView.visit_type || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Patient Type:</span> <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{selectedPatientForView.patient_type || 'IPD'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Doctor/Appointment With:</span> {selectedPatientForView.appointment_with || 'Not specified'}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Reason for Visit:</span> {selectedPatientForView.reason_for_visit || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-700 mb-2">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span> {selectedPatientForView.patients?.phone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Emergency Contact:</span> {selectedPatientForView.patients?.emergency_contact_name || 'N/A'}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Emergency Mobile:</span> {selectedPatientForView.patients?.emergency_contact_mobile || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-700 mb-2">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedPatientForView.status === 'completed' ? 'bg-green-100 text-green-700' :
                        selectedPatientForView.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        selectedPatientForView.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedPatientForView.status || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Diagnosis:</span> {selectedPatientForView.diagnosis || 'General'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Relation with Employee:</span> {selectedPatientForView.relation_with_employee || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Claim ID:</span> {selectedPatientForView.claim_id || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Referring Doctor:</span> {selectedPatientForView.referring_doctor || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Record Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Created At:</span> {selectedPatientForView.created_at ? new Date(selectedPatientForView.created_at).toLocaleString() : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Updated At:</span> {selectedPatientForView.updated_at ? new Date(selectedPatientForView.updated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedPatientForView(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Print Column Picker Modal */}
        <ColumnPickerModal
          isOpen={isPrintPickerOpen}
          columns={IPD_PRINT_COLUMNS}
          selectedIds={printSelectedIds}
          presets={IPD_PRINT_PRESETS}
          settings={printSettings}
          onSelectedIdsChange={setPrintSelectedIds}
          onSettingsChange={setPrintSettings}
          onClose={() => setIsPrintPickerOpen(false)}
          onConfirm={handlePrintConfirm}
          onPreview={handlePrintPreview}
        />

        {/* Print Preview */}
        {showPrintPreview && (() => {
          const finalSettings = { ...printSettings, selectedColumnIds: printSelectedIds };
          console.log('=== IPD DASHBOARD PRINT DEBUG ===');
          console.log('printSelectedIds:', printSelectedIds);
          console.log('printSettings:', printSettings);
          console.log('finalSettings:', finalSettings);
          console.log('finalSettings.selectedColumnIds:', finalSettings.selectedColumnIds);
          console.log('Number of columns to print:', finalSettings.selectedColumnIds.length);
          console.log('Column IDs:', finalSettings.selectedColumnIds);
          console.log('Total available columns:', IPD_PRINT_COLUMNS.length);
          console.log('=================================');

          return (
            <PrintPreview
              reportTitle="IPD Dashboard"
              columns={IPD_PRINT_COLUMNS}
              data={filteredVisits}
              settings={finalSettings}
              appliedFilters={getCurrentFilters()}
              onClose={() => setShowPrintPreview(false)}
            />
          );
        })()}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Page settings */
          @page {
            margin: 0.5in;
            size: A4 landscape;
          }

          /* Reset body and html */
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Hide UI elements and dashboard content */
          [data-sidebar],
          aside,
          nav,
          button:not(.print-preview-overlay button),
          select,
          input,
          .no-print,
          header,
          footer,
          [role="dialog"]:not(.print-preview-overlay [role="dialog"]),
          [data-radix-portal],
          [data-radix-dialog-overlay],
          [data-radix-dialog-content],
          .flex.flex-col.md\\:flex-row.justify-between.items-start.md\\:items-center.mb-6,
          .grid.grid-cols-1.md\\:grid-cols-4.gap-4,
          .bg-card.rounded-lg.border.no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Hide the page title/header inside the table card */
          .bg-card.rounded-lg.border .p-4.border-b {
            display: none !important;
          }

          /* Hide the filter row (second header row) */
          thead tr:nth-child(2) {
            display: none !important;
          }

          /* Hide actions column */
          th:last-child,
          td:last-child {
            display: none !important;
          }

          /* Main container adjustments */
          .min-h-screen.flex.w-full {
            display: block !important;
          }

          main {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .max-w-7xl.mx-auto.space-y-6 {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* CRITICAL: Ensure PrintPreview and its content are visible */
          .print-preview-overlay {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            z-index: 99999 !important;
          }

          .print-preview-overlay,
          .print-preview-overlay *,
          [data-print-content="true"],
          [data-print-content="true"] * {
            visibility: visible !important;
          }

          /* Remove any interactive elements styling */
          a {
            color: black !important;
            text-decoration: none !important;
          }

          /* Ensure proper text sizing */
          .text-sm, .text-xs {
            font-size: 9px !important;
          }

          .font-mono {
            font-family: monospace !important;
          }
        }

        /* Hide print info by default */
        .print-info {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TodaysIpdDashboard;
