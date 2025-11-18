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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import { PatientFormModal } from "@/components/PatientFormModal";
import { SessionModal } from "@/components/SessionModal";
import { usePatients, useDeletePatient } from "@/hooks/usePatients";
import { therapistsWithAll } from "@/data/therapists";

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  insurance: string;
  therapist: string;
  nextAppointment?: string;
  status: "active" | "inactive";
  birthDate: string;
  email: string;
  mainTherapist: string;
  commissionPercentage: string;
}

interface Session {
  id: string;
  patientId: string;
  date: string;
  sessionNumber: number;
  therapist: string;
  value: number;
  paymentStatus: "paid" | "pending";
  invoiceDelivered: boolean;
  observations: string;
  paymentMethod: string;
}

const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Maria da Silva Santos",
    cpf: "123.456.789-00",
    phone: "(11) 98765-4321",
    insurance: "Unimed",
    therapist: "Cheila",
    nextAppointment: "Segunda 10:00",
    status: "active",
    birthDate: "15/03/1975",
    email: "maria.silva@email.com",
    mainTherapist: "cheila",
    commissionPercentage: "60",
  },
  {
    id: "2",
    name: "João Pedro Oliveira",
    cpf: "987.654.321-00",
    phone: "(11) 91234-5678",
    insurance: "Particular",
    therapist: "Ana Falcão",
    nextAppointment: "Terça 14:30",
    status: "active",
    birthDate: "22/07/1988",
    email: "joao.pedro@email.com",
    mainTherapist: "ana",
    commissionPercentage: "65",
  },
  {
    id: "3",
    name: "Ana Carolina Souza",
    cpf: "456.789.123-00",
    phone: "(11) 99876-5432",
    insurance: "SUS",
    therapist: "Grazii",
    status: "active",
    birthDate: "08/11/1992",
    email: "ana.souza@email.com",
    mainTherapist: "grazii",
    commissionPercentage: "55",
  },
  {
    id: "4",
    name: "Carlos Eduardo Lima",
    cpf: "321.654.987-00",
    phone: "(11) 97654-3210",
    insurance: "Amil",
    therapist: "Cheila",
    nextAppointment: "Quarta 09:00",
    status: "active",
    birthDate: "30/01/1980",
    email: "carlos.lima@email.com",
    mainTherapist: "cheila",
    commissionPercentage: "60",
  },
  {
    id: "5",
    name: "Patricia Mendes Costa",
    cpf: "789.123.456-00",
    phone: "(11) 96543-2109",
    insurance: "Particular",
    therapist: "Ana Falcão",
    status: "active",
    birthDate: "19/05/1995",
    email: "patricia.mendes@email.com",
    mainTherapist: "ana",
    commissionPercentage: "65",
  },
  {
    id: "6",
    name: "Roberto Alves Pereira",
    cpf: "147.258.369-00",
    phone: "(11) 95432-1098",
    insurance: "Unimed",
    therapist: "Grazii",
    nextAppointment: "Quinta 16:00",
    status: "active",
    birthDate: "12/09/1970",
    email: "roberto.alves@email.com",
    mainTherapist: "grazii",
    commissionPercentage: "55",
  },
  {
    id: "7",
    name: "Fernanda Santos Rodrigues",
    cpf: "258.369.147-00",
    phone: "(11) 94321-0987",
    insurance: "SulAmérica",
    therapist: "Cheila",
    status: "inactive",
    birthDate: "25/12/1985",
    email: "fernanda.santos@email.com",
    mainTherapist: "cheila",
    commissionPercentage: "60",
  },
  {
    id: "8",
    name: "Lucas Gabriel Martins",
    cpf: "369.147.258-00",
    phone: "(11) 93210-9876",
    insurance: "Particular",
    therapist: "Ana Falcão",
    nextAppointment: "Sexta 11:30",
    status: "active",
    birthDate: "07/06/1998",
    email: "lucas.martins@email.com",
    mainTherapist: "ana",
    commissionPercentage: "65",
  },
];

const mockSessions: Session[] = [
  {
    id: "1",
    patientId: "1",
    date: "15/01/2024",
    sessionNumber: 15,
    therapist: "Cheila",
    value: 120,
    paymentStatus: "paid",
    invoiceDelivered: true,
    observations: "Paciente apresentou melhora significativa na mobilidade",
    paymentMethod: "PIX",
  },
  {
    id: "2",
    patientId: "1",
    date: "10/01/2024",
    sessionNumber: 14,
    therapist: "Cheila",
    value: 120,
    paymentStatus: "paid",
    invoiceDelivered: true,
    observations: "Continuidade do tratamento. Redução do quadro álgico.",
    paymentMethod: "Débito",
  },
  {
    id: "3",
    patientId: "1",
    date: "08/01/2024",
    sessionNumber: 13,
    therapist: "Cheila",
    value: 120,
    paymentStatus: "pending",
    invoiceDelivered: false,
    observations: "Paciente relatou melhora nas dores lombares",
    paymentMethod: "Boleto",
  },
  {
    id: "4",
    patientId: "1",
    date: "05/01/2024",
    sessionNumber: 12,
    therapist: "Cheila",
    value: 120,
    paymentStatus: "paid",
    invoiceDelivered: true,
    observations: "Exercícios de fortalecimento realizados com sucesso",
    paymentMethod: "PIX",
  },
  {
    id: "5",
    patientId: "1",
    date: "03/01/2024",
    sessionNumber: 11,
    therapist: "Cheila",
    value: 120,
    paymentStatus: "paid",
    invoiceDelivered: false,
    observations: "Aplicação de técnicas manuais e eletroterapia",
    paymentMethod: "Dinheiro",
  },
];

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(mockPatients[0]);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [filterTherapist, setFilterTherapist] = useState("all");
  const [filterInsurance, setFilterInsurance] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [sessionFilterTherapist, setSessionFilterTherapist] = useState("all");
  const [sessionFilterPayment, setSessionFilterPayment] = useState("all");

  const filteredPatients = mockPatients
    .filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm) ||
        patient.phone.includes(searchTerm);
      const matchesTherapist =
        filterTherapist === "all" || patient.therapist === filterTherapist;
      const matchesInsurance =
        filterInsurance === "all" || patient.insurance === filterInsurance;
      const matchesStatus =
        filterStatus === "all" || patient.status === filterStatus;
      return matchesSearch && matchesTherapist && matchesInsurance && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const patientSessions = selectedPatient
    ? mockSessions
        .filter((s) => s.patientId === selectedPatient.id)
        .filter((s) => {
          const matchesTherapist =
            sessionFilterTherapist === "all" || s.therapist === sessionFilterTherapist;
          const matchesPayment =
            sessionFilterPayment === "all" || s.paymentStatus === sessionFilterPayment;
          return matchesTherapist && matchesPayment;
        })
    : [];

  const totalSessions = patientSessions.length;
  const totalPaid = patientSessions
    .filter((s) => s.paymentStatus === "paid")
    .reduce((sum, s) => sum + s.value, 0);
  const totalPending = patientSessions
    .filter((s) => s.paymentStatus === "pending")
    .reduce((sum, s) => sum + s.value, 0);

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
                      {patient.nextAppointment && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {patient.nextAppointment}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {patient.insurance}
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
                    {selectedPatient.insurance} • {selectedPatient.therapist}
                  </p>
                </div>
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
                      <p className="mt-1">{selectedPatient.birthDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CPF</label>
                      <p className="mt-1">{selectedPatient.cpf}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <p className="mt-1">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                      <p className="mt-1">{selectedPatient.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Convênio</label>
                      <p className="mt-1">{selectedPatient.insurance}</p>
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
                      <p className="mt-1">{selectedPatient.therapist}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Porcentagem de Repasse</label>
                      <p className="mt-1">{selectedPatient.commissionPercentage}%</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4">
                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total de Sessões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalSessions}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Próxima Sessão
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm font-medium">
                          {selectedPatient.nextAppointment || "Não agendada"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Pago
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-success">
                          R$ {totalPaid.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Saldo Pendente
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-warning">
                          R$ {totalPending.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filtros e Botão Registrar */}
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex gap-2">
                      <Select
                        value={sessionFilterTherapist}
                        onValueChange={setSessionFilterTherapist}
                      >
                        <SelectTrigger className="w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Fisioterapeuta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="Ana Falcão">Ana Falcão</SelectItem>
                          <SelectItem value="Cheila">Cheila</SelectItem>
                          <SelectItem value="Grazii">Grazii</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={sessionFilterPayment}
                        onValueChange={setSessionFilterPayment}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={() => setSessionModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Nova Sessão
                    </Button>
                  </div>

                  {/* Tabela de Sessões */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Sessão Nº</TableHead>
                          <TableHead>Fisioterapeuta</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Nota Fiscal</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{session.date}</TableCell>
                            <TableCell className="font-medium">
                              #{session.sessionNumber}
                            </TableCell>
                            <TableCell>{session.therapist}</TableCell>
                            <TableCell>R$ {session.value.toFixed(2)}</TableCell>
                            <TableCell>
                              {session.paymentStatus === "paid" ? (
                                <Badge variant="default" className="bg-success">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Pago
                                </Badge>
                              ) : (
                                <Badge variant="warning">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getPaymentMethodLabel(session.paymentMethod)}
                            </TableCell>
                            <TableCell>
                              {session.invoiceDelivered ? (
                                <Badge variant="default" className="bg-success">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Sim
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Não
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-sm text-muted-foreground cursor-help"
                                title={session.observations}
                              >
                                {session.observations.substring(0, 30)}...
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
          if (!open) setEditingPatient(null);
        }}
        patient={editingPatient}
      />

      {selectedPatient && (
        <SessionModal
          open={sessionModalOpen}
          onOpenChange={setSessionModalOpen}
          patientName={selectedPatient.name}
          defaultTherapist={selectedPatient.mainTherapist}
          lastSessionNumber={
            patientSessions.length > 0
              ? Math.max(...patientSessions.map((s) => s.sessionNumber))
              : 0
          }
          onSave={(data) => console.log("Sessão salva:", data)}
        />
      )}
    </div>
  );
}
