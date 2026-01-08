import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ArrowUpDown,
  Save,
  DollarSign,
} from "lucide-react";
import { PatientFormModal } from "@/components/PatientFormModal";
import { SessionModal } from "@/components/SessionModal";
import { AttendanceControlTab } from "@/components/patients/AttendanceControlTab";
import { PatientFinancialTab } from "@/components/patients/PatientFinancialTab";
import { PatientPackagesCard } from "@/components/patients/PatientPackagesCard";
import { PatientCreditsCard } from "@/components/patients/PatientCreditsCard";
import { usePatients, useDeletePatient, Patient } from "@/hooks/usePatients";
import { useSessions } from "@/hooks/useSessions";
import { useMonthlyEvolutions, useCreateMonthlyEvolution, useUpdateMonthlyEvolution } from "@/hooks/useMonthlyEvolutions";
import { therapistsWithAll } from "@/data/therapists";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  
  // Evolução mensal
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [evolutionText, setEvolutionText] = useState("");
  const [editingEvolutionId, setEditingEvolutionId] = useState<string | null>(null);

  // Fetch real data from database
  const { data: patients = [], isLoading } = usePatients(searchTerm, filterTherapist);
  const { data: allSessions = [] } = useSessions();
  const { data: monthlyEvolutions = [] } = useMonthlyEvolutions(selectedPatient?.id);
  const deletePatient = useDeletePatient();
  const createEvolution = useCreateMonthlyEvolution();
  const updateEvolution = useUpdateMonthlyEvolution();

  // Set first patient as selected when data loads
  if (!selectedPatient && patients.length > 0) {
    setSelectedPatient(patients[0]);
  }

  // Carregar evolução do mês selecionado
  useEffect(() => {
    const currentEvolution = monthlyEvolutions.find(e => e.year_month === selectedYearMonth);
    
    if (currentEvolution) {
      setEvolutionText(currentEvolution.evolution_text || "");
      setEditingEvolutionId(currentEvolution.id);
    } else {
      setEvolutionText("");
      setEditingEvolutionId(null);
    }
  }, [selectedYearMonth, monthlyEvolutions]);

  const handleSaveEvolution = () => {
    if (!selectedPatient) return;

    if (editingEvolutionId) {
      updateEvolution.mutate({
        id: editingEvolutionId,
        evolution_text: evolutionText,
      });
    } else {
      createEvolution.mutate({
        patient_id: selectedPatient.id,
        year_month: selectedYearMonth,
        evolution_text: evolutionText,
      });
    }
  };

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
      {/* Header with Icon */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-success/20 to-success/5 rounded-xl shadow-soft">
          <User className="w-8 h-8 text-success" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestão de Pacientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro completo e controle de presença
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-full gap-4">
        {/* Sidebar - Lista de Pacientes */}
        <div className="w-full md:w-80 flex-shrink-0">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl">Pacientes</CardTitle>
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

            {/* Barra de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtros e Ordenação */}
            <div className="flex gap-2 mt-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
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
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
            <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors border-l-4 ${
                    selectedPatient?.id === patient.id
                      ? "bg-accent border-primary"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        patient.status === "active" ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    >
                      {getInitials(patient.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{patient.name}</p>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            patient.status === "active" ? "bg-success" : "bg-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {patient.health_plan || "Não informado"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Área Principal - Ficha do Paciente */}
      <div className="flex-1 overflow-auto">
        {selectedPatient ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedPatient.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">
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
                    variant="destructive" 
                    size="sm"
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
                <TabsList className="flex w-full gap-1 overflow-x-auto scrollbar-hide">
                  <TabsTrigger value="personal" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                    <span className="hidden sm:inline">Dados Pessoais</span>
                    <span className="sm:hidden">Pessoais</span>
                  </TabsTrigger>
                  <TabsTrigger value="clinical" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                    <span className="hidden sm:inline">Clínicas</span>
                    <span className="sm:hidden">Clínicos</span>
                  </TabsTrigger>
                  <TabsTrigger value="operational" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 py-2">Operacional</TabsTrigger>
                  <TabsTrigger value="financial" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                    <span className="hidden sm:inline">Financeiro</span>
                    <span className="sm:hidden">$</span>
                  </TabsTrigger>
                  <TabsTrigger value="evolution" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                    <span className="hidden sm:inline">Evolução Mensal</span>
                    <span className="sm:hidden">Evolução</span>
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                    <span className="hidden sm:inline">Controle de Presença</span>
                    <span className="sm:hidden">Presença</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                      <p className="mt-1">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                      <p className="mt-1">{selectedPatient.birth_date ? format(new Date(selectedPatient.birth_date), 'dd/MM/yyyy') : "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CPF</label>
                      <p className="mt-1">{selectedPatient.cpf || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <p className="mt-1">{selectedPatient.phone || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                      <p className="mt-1">{selectedPatient.email || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Convênio</label>
                      <p className="mt-1">{selectedPatient.health_plan || "Não informado"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clinical" className="space-y-4">
                  <p className="text-muted-foreground">
                    Informações clínicas completas serão exibidas aqui após preenchimento do formulário.
                  </p>
                </TabsContent>

                <TabsContent value="operational" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fisioterapeuta Padrão</label>
                      <p className="mt-1">{selectedPatient.main_therapist}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Porcentagem de Repasse</label>
                      <p className="mt-1">{selectedPatient.commission_percentage || 0}%</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <PatientCreditsCard patientId={selectedPatient.id} />
                  <PatientPackagesCard patientId={selectedPatient.id} />
                  <PatientFinancialTab patientName={selectedPatient.name} />
                </TabsContent>

                <TabsContent value="evolution" className="space-y-4">
                  <div className="space-y-4">
                    {/* Seletor de Mês/Ano */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Selecione o mês/ano
                        </label>
                        <Input
                          type="month"
                          value={selectedYearMonth}
                          onChange={(e) => setSelectedYearMonth(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                      <Button
                        onClick={handleSaveEvolution}
                        disabled={!evolutionText.trim()}
                        className="mt-6"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Evolução
                      </Button>
                    </div>

                    {/* Área de texto para evolução */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Evolução do mês {format(new Date(selectedYearMonth + "-01"), "MM/yyyy", { locale: ptBR })}
                      </label>
                      <Textarea
                        value={evolutionText}
                        onChange={(e) => setEvolutionText(e.target.value)}
                        placeholder="Descreva a evolução do paciente durante este mês..."
                        className="min-h-[300px] resize-y"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {evolutionText.length} caracteres
                      </p>
                    </div>

                    {/* Histórico de evoluções anteriores */}
                    {monthlyEvolutions.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-3">Histórico de Evoluções</h3>
                        <div className="space-y-2">
                          {monthlyEvolutions
                            .filter(e => e.year_month !== selectedYearMonth)
                            .slice(0, 5)
                            .map((evolution) => (
                              <Card
                                key={evolution.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedYearMonth(evolution.year_month)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">
                                      {format(new Date(evolution.year_month + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {evolution.updated_at ? format(new Date(evolution.updated_at), "dd/MM/yyyy", { locale: ptBR }) : ""}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {evolution.evolution_text || "Sem texto registrado"}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4">
                  <AttendanceControlTab 
                    patientId={selectedPatient.id} 
                    patientName={selectedPatient.name}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum paciente selecionado</h3>
              <p className="text-muted-foreground mb-4">
                Selecione um paciente da lista ou crie um novo
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
