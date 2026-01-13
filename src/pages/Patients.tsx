import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  User,
  Calendar,
  Edit,
  Trash2,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { PatientFormModal } from "@/components/PatientFormModal";
import { SessionModal } from "@/components/SessionModal";
import { AttendanceControlTab } from "@/components/patients/AttendanceControlTab";
import { PatientFinancialTab } from "@/components/patients/PatientFinancialTab";
import { PatientPackagesCard } from "@/components/patients/PatientPackagesCard";
import { PatientCreditsCard } from "@/components/patients/PatientCreditsCard";
import { usePatients, useDeletePatient, Patient } from "@/hooks/usePatients";
import { useSessions } from "@/hooks/useSessions";

import { therapistsWithAll } from "@/data/therapists";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [filterTherapist, setFilterTherapist] = useState("all");
  const [filterInsurance, setFilterInsurance] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [sessionFilterTherapist, setSessionFilterTherapist] = useState("all");
  const [sessionFilterPayment, setSessionFilterPayment] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch real data from database
  const { data: patients = [], isLoading } = usePatients(searchTerm, filterTherapist);
  const { data: allSessions = [] } = useSessions();
  const deletePatient = useDeletePatient();

  // Set first patient as selected when data loads
  if (!selectedPatient && patients.length > 0) {
    setSelectedPatient(patients[0]);
  }


  const filteredPatients = patients
    .filter((patient) => {
      const matchesInsurance =
        filterInsurance === "all" || patient.health_plan === filterInsurance;
      const matchesStatus =
        filterStatus === "all" || patient.status === filterStatus;
      return matchesInsurance && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const patientSessions = selectedPatient
    ? allSessions
        .filter((s) => s.patient_id === selectedPatient.id)
        .filter((s) => {
          const matchesTherapist =
            sessionFilterTherapist === "all" || s.therapist === sessionFilterTherapist;
          const matchesPayment =
            sessionFilterPayment === "all" || s.payment_status === sessionFilterPayment;
          return matchesTherapist && matchesPayment;
        })
    : [];

  const totalSessions = patientSessions.length;
  const totalPaid = patientSessions
    .filter((s) => s.payment_status === "received")
    .reduce((sum, s) => sum + (s.session_value || 0), 0);
  const totalPending = patientSessions
    .filter((s) => s.payment_status === "pending")
    .reduce((sum, s) => sum + (s.session_value || 0), 0);

  const handleDeletePatient = () => {
    if (!selectedPatient) return;
    
    deletePatient.mutate(selectedPatient.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        // Select first patient or null if no patients left
        setSelectedPatient(filteredPatients[0] || null);
      },
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Dinheiro",
      pix: "PIX",
      debit: "Débito",
      credit: "Crédito",
      insurance: "Convênio",
      boleto: "Boleto",
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Gestão de Pacientes</h1>
        <p className="page-subtitle">
          Cadastro completo e controle de presença
        </p>
      </div>

      <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
        {/* Sidebar - Patient List */}
        <div className={cn(
          "w-full lg:w-80 flex-shrink-0",
          selectedPatient && "hidden lg:block"
        )}>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg">Pacientes</CardTitle>
                <Button 
                  onClick={() => {
                    setEditingPatient(null);
                    setPatientModalOpen(true);
                  }} 
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou telefone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/30"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full bg-muted/30">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">Alfabética</SelectItem>
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="lastVisit">Último Atendimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <Select value={filterTherapist} onValueChange={setFilterTherapist}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Fisio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Ana Falcão">Ana</SelectItem>
                    <SelectItem value="Cheila">Cheila</SelectItem>
                    <SelectItem value="Grazii">Grazii</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterInsurance} onValueChange={setFilterInsurance}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Conv" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="SUS">SUS</SelectItem>
                    <SelectItem value="Unimed">Unimed</SelectItem>
                    <SelectItem value="Particular">Particular</SelectItem>
                    <SelectItem value="Amil">Amil</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="space-y-0 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={cn(
                      "w-full text-left p-4 transition-colors border-l-4",
                      selectedPatient?.id === patient.id
                        ? "bg-primary/5 border-primary"
                        : "border-transparent hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm",
                          patient.status === "active" ? "bg-primary" : "bg-muted-foreground"
                        )}
                      >
                        {getInitials(patient.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{patient.name}</p>
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              patient.status === "active" ? "bg-success" : "bg-muted-foreground"
                            )}
                          />
                        </div>
                        <Badge variant="muted" className="text-xs mt-1">
                          {patient.health_plan || "Não informado"}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Area - Patient File */}
        <div className="flex-1 overflow-auto">
          {selectedPatient ? (
            <Card>
              <CardHeader className="pb-4">
                {/* Mobile back button */}
                <Button 
                  variant="ghost" 
                  className="mb-2 lg:hidden w-fit -ml-2"
                  onClick={() => setSelectedPatient(null)}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2 rotate-90" />
                  Voltar para lista
                </Button>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-xl">{selectedPatient.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPatient.health_plan || "Não informado"} • {selectedPatient.main_therapist}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingPatient(selectedPatient);
                        setPatientModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
                    <TabsTrigger value="personal" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Dados Pessoais</span>
                      <span className="sm:hidden">Pessoais</span>
                    </TabsTrigger>
                    <TabsTrigger value="clinical" className="text-xs sm:text-sm">
                      Clínicos
                    </TabsTrigger>
                    <TabsTrigger value="operational" className="text-xs sm:text-sm">
                      Operacional
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Financeiro</span>
                      <span className="sm:hidden">$</span>
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Controle de Presença</span>
                      <span className="sm:hidden">Presença</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="metric-label">Nome Completo</label>
                        <p className="text-foreground">{selectedPatient.name}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="metric-label">Data de Nascimento</label>
                        <p className="text-foreground">{selectedPatient.birth_date ? format(new Date(selectedPatient.birth_date), 'dd/MM/yyyy') : "Não informado"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="metric-label">CPF</label>
                        <p className="text-foreground">{selectedPatient.cpf || "Não informado"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="metric-label">Telefone</label>
                        <p className="text-foreground">{selectedPatient.phone || "Não informado"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="metric-label">E-mail</label>
                        <p className="text-foreground">{selectedPatient.email || "Não informado"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="metric-label">Convênio</label>
                        <p className="text-foreground">{selectedPatient.health_plan || "Não informado"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="clinical" className="mt-6">
                    <p className="text-muted-foreground">
                      Informações clínicas completas serão exibidas aqui após preenchimento do formulário.
                    </p>
                  </TabsContent>

                  <TabsContent value="operational" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="metric-label">Fisioterapeuta Padrão</label>
                        <p className="text-foreground">{selectedPatient.main_therapist}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="metric-label">Porcentagem de Repasse</label>
                        <p className="text-foreground">{selectedPatient.commission_percentage || 0}%</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-6 mt-6">
                    <PatientCreditsCard patientId={selectedPatient.id} />
                    <PatientPackagesCard patientId={selectedPatient.id} />
                    <PatientFinancialTab patientName={selectedPatient.name} />
                  </TabsContent>

                  <TabsContent value="sessions" className="mt-6">
                    <AttendanceControlTab 
                      patientId={selectedPatient.id} 
                      patientName={selectedPatient.name}
                      healthPlan={selectedPatient.health_plan}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum paciente selecionado</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Selecione um paciente da lista ou crie um novo para visualizar os detalhes
                </p>
                <Button onClick={() => {
                  setEditingPatient(null);
                  setPatientModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Paciente
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <PatientFormModal
        open={patientModalOpen}
        onOpenChange={(open) => {
          setPatientModalOpen(open);
          if (!open) {
            setEditingPatient(null);
            setSelectedPatient(null);
          }
        }}
        patient={editingPatient}
      />

      {selectedPatient && (
        <SessionModal
          open={sessionModalOpen}
          onOpenChange={setSessionModalOpen}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          defaultTherapist={selectedPatient.main_therapist}
          lastSessionNumber={
            patientSessions.length > 0
              ? Math.max(...patientSessions.map((s) => s.session_number))
              : 0
          }
          patientSessionValue={selectedPatient.session_value}
          patientDiscount={selectedPatient.discount}
          patientDiscountPercentage={selectedPatient.discount_percentage}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o paciente <strong>{selectedPatient?.name}</strong>.
              <br /><br />
              <span className="text-destructive font-semibold">⚠️ Esta ação não pode ser desfeita!</span>
              <br /><br />
              Todos os dados do paciente, incluindo sessões, receitas e agendamentos relacionados podem ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
