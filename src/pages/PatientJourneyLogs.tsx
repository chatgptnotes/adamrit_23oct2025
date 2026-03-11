import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icons
import {
  ScrollText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────

const PATIENT_ACTION_TYPES = [
  "user_login",
  "patient_create",
  "patient_edit",
  "visit_create",
  "visit_edit",
  "patient_discharge",
  "bill_create",
];

const ACTION_LABELS: Record<string, string> = {
  user_login: "User Login",
  patient_create: "Patient Registered",
  patient_edit: "Patient Edited",
  visit_create: "Visit Created",
  visit_edit: "Visit Edited",
  patient_discharge: "Patient Discharged",
  bill_create: "Bill Created",
};

const PAGE_SIZE = 50;

// ── Types ──────────────────────────────────────────────────────────────────

interface LogRow {
  id: string;
  user_email: string | null;
  user_role: string | null;
  action: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

// ── Component ──────────────────────────────────────────────────────────────

const PatientJourneyLogs = () => {
  const { hospitalConfig } = useAuth();

  // Filter state
  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [patientSearch, setPatientSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  // Data state
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Users list for dropdown
  const [users, setUsers] = useState<{ email: string; role: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      let query = (supabase as any)
        .from("User")
        .select("email, role");

      // hope: include hospital_type = 'hope' OR null (null defaults to hope)
      // ayushman: only hospital_type = 'ayushman'
      if (hospitalConfig.id === "hope") {
        query = query.or("hospital_type.eq.hope,hospital_type.is.null");
      } else {
        query = query.eq("hospital_type", hospitalConfig.id);
      }

      const { data } = await query
        .not("role", "in", '("superadmin","hope","marketing manager","marketing")')
        .order("email");
      if (data) setUsers(data);
    };
    fetchUsers();
  }, [hospitalConfig.id]);

  // ── Fetch logs ─────────────────────────────────────────────────────────

  const fetchLogs = async () => {
    setLoading(true);
    const fromISO = startOfDay(new Date(dateFrom)).toISOString();
    const toISO = endOfDay(new Date(dateTo)).toISOString();

    try {
      let query = (supabase as any)
        .from("user_activity_log")
        .select("*", { count: "exact" })
        .in("action", PATIENT_ACTION_TYPES)
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (patientSearch.trim()) {
        query = query.or(
          `details->>patients_id.ilike.%${patientSearch.trim()}%,details->>patient_name.ilike.%${patientSearch.trim()}%`
        );
      }

      if (emailSearch && emailSearch !== "all") {
        query = query.eq("user_email", emailSearch);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching patient journey logs:", error);
        setLogs([]);
        setTotalCount(0);
      } else {
        setLogs(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Error fetching patient journey logs:", err);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchLogs();
  }, [dateFrom, dateTo, patientSearch, emailSearch, currentPage]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getActionBadgeVariant = (
    action: string | null
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (!action) return "secondary";
    if (action === "patient_create") return "default";
    if (action === "patient_edit") return "secondary";
    if (action === "patient_discharge") return "destructive";
    if (action === "bill_create") return "outline";
    return "default";
  };

  const getActionBadgeClass = (action: string | null): string => {
    if (action === "patient_create") return "bg-green-600 hover:bg-green-700";
    if (action === "patient_edit") return "bg-blue-600 hover:bg-blue-700 text-white";
    if (action === "visit_create") return "bg-purple-600 hover:bg-purple-700 text-white";
    if (action === "visit_edit") return "bg-indigo-600 hover:bg-indigo-700 text-white";
    return "";
  };

  const formatDetails = (details: Record<string, any> | null, action: string | null): string => {
    if (!details) return "-";
    const parts: string[] = [];
    if (details.visit_id) parts.push(`Visit: ${details.visit_id}`);
    if (details.visit_type) parts.push(`Type: ${details.visit_type}`);
    if (details.patient_type) parts.push(`Patient Type: ${details.patient_type}`);
    if (details.bill_no) parts.push(`Bill: ${details.bill_no}`);
    return parts.length > 0 ? parts.join(" | ") : "-";
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Patient Journey Logs
              </h1>
              <p className="text-muted-foreground">
                Track patient activities from registration to discharge
              </p>
            </div>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patient ID / Name Search */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Patient ID / Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Date From */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </div>

              {/* User Email Dropdown */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  User
                </label>
                <Select
                  value={emailSearch || "all"}
                  onValueChange={(val) => {
                    setEmailSearch(val);
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.email} value={u.email}>
                        {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Journey Records</CardTitle>
              <span className="text-sm text-muted-foreground">
                {totalCount} total record{totalCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading patient journey logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>No patient journey logs found for the selected filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>User Role</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(
                              new Date(log.created_at),
                              "dd MMM yyyy, hh:mm:ss a"
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">
                            {log.details?.patients_id || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.details?.patient_name || "-"}
                          </TableCell>
                          <TableCell>
                            {log.action ? (
                              <Badge
                                variant={getActionBadgeVariant(log.action)}
                                className={getActionBadgeClass(log.action)}
                              >
                                {ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user_email || "-"}
                          </TableCell>
                          <TableCell>
                            {log.user_role ? (
                              <Badge variant="outline">{log.user_role}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                            {formatDetails(log.details, log.action)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {currentPage * PAGE_SIZE + 1} -{" "}
                      {Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of{" "}
                      {totalCount}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientJourneyLogs;
