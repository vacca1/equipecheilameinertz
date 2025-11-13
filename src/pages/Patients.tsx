import { useState } from "react";
import { Search, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  insurance: string;
  therapist: string;
  nextAppointment?: string;
  status: "active" | "inactive";
}

// Mock data
const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Maria Silva",
    cpf: "123.456.789-00",
    phone: "(11) 98765-4321",
    insurance: "Particular",
    therapist: "Cheila",
    nextAppointment: "08/01/2024 às 08:00",
    status: "active",
  },
  {
    id: "2",
    name: "João Santos",
    cpf: "987.654.321-00",
    phone: "(11) 91234-5678",
    insurance: "Unimed",
    therapist: "Ana Falcão",
    nextAppointment: "08/01/2024 às 09:00",
    status: "active",
  },
  {
    id: "3",
    name: "Pedro Costa",
    cpf: "456.789.123-00",
    phone: "(11) 95555-1234",
    insurance: "SUS",
    therapist: "Grazii",
    status: "active",
  },
];

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(mockPatients[0]);

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm) ||
      patient.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
        <Button className="shadow-soft">
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="grid lg:grid-cols-[350px,1fr] gap-6">
        {/* Patient List */}
        <Card className="p-4 shadow-soft h-fit lg:sticky lg:top-20">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all hover:shadow-soft",
                  selectedPatient?.id === patient.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-card hover:bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{patient.name}</div>
                    <div className="text-sm opacity-80">{patient.phone}</div>
                    {patient.nextAppointment && (
                      <div className="text-xs opacity-70 mt-1">
                        Próxima: {patient.nextAppointment}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={patient.status === "active" ? "default" : "secondary"}
                    className="flex-shrink-0"
                  >
                    {patient.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Patient Details */}
        {selectedPatient && (
          <Card className="p-6 shadow-soft">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedPatient.name}</h2>
                <div className="flex gap-2">
                  <Badge>{selectedPatient.insurance}</Badge>
                  <Badge variant="outline">{selectedPatient.therapist}</Badge>
                </div>
              </div>
              <Button variant="outline" className="shadow-soft">
                Editar
              </Button>
            </div>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="clinical">Informações Clínicas</TabsTrigger>
                <TabsTrigger value="operational">Operacional</TabsTrigger>
                <TabsTrigger value="attendance">Controle de Presença</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <Input value={selectedPatient.name} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                    <Input type="date" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CPF</label>
                    <Input value={selectedPatient.cpf} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">RG</label>
                    <Input className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone 1</label>
                    <Input value={selectedPatient.phone} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone 2</label>
                    <Input className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                    <Input type="email" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Convênio</label>
                    <Input value={selectedPatient.insurance} className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço Completo</label>
                  <Input className="mt-1" placeholder="CEP, Rua, Número, Complemento, Bairro, Cidade, Estado" />
                </div>
                <div className="flex gap-2">
                  <Button className="shadow-soft">Salvar</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </TabsContent>

              <TabsContent value="clinical" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Médico Solicitante</label>
                    <Input className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Diagnóstico Médico *</label>
                    <Input className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Patologias Prévias</label>
                    <textarea className="w-full mt-1 min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">História da Vida Pregressa (HVP)</label>
                    <textarea className="w-full mt-1 min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="shadow-soft">Salvar</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </TabsContent>

              <TabsContent value="operational" className="space-y-4">
                <Card className="p-4 border-primary/20 bg-primary/5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fisioterapeuta Padrão *</label>
                      <Input value={selectedPatient.therapist} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fisioterapeuta Substituta</label>
                      <Input className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Porcentagem de Repasse (%)</label>
                      <Input type="number" placeholder="60" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sala Específica</label>
                      <Input className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" className="rounded" />
                        Requer Nota Fiscal
                      </label>
                    </div>
                  </div>
                </Card>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações Gerais</label>
                  <textarea className="w-full mt-1 min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button className="shadow-soft">Salvar</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button className="shadow-soft">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Nova Sessão
                  </Button>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4 shadow-soft">
                    <div className="text-sm text-muted-foreground mb-1">Total de Sessões</div>
                    <div className="text-2xl font-bold text-primary">12</div>
                  </Card>
                  <Card className="p-4 shadow-soft">
                    <div className="text-sm text-muted-foreground mb-1">Próxima Sessão</div>
                    <div className="text-lg font-semibold">08/01 08:00</div>
                  </Card>
                  <Card className="p-4 shadow-soft">
                    <div className="text-sm text-muted-foreground mb-1">Valor Total Pago</div>
                    <div className="text-2xl font-bold text-success">R$ 1.200</div>
                  </Card>
                  <Card className="p-4 shadow-soft">
                    <div className="text-sm text-muted-foreground mb-1">Saldo Pendente</div>
                    <div className="text-2xl font-bold text-warning">R$ 200</div>
                  </Card>
                </div>

                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left text-sm font-semibold">Data</th>
                          <th className="p-3 text-left text-sm font-semibold">Sessão Nº</th>
                          <th className="p-3 text-left text-sm font-semibold">Fisioterapeuta</th>
                          <th className="p-3 text-left text-sm font-semibold">Valor</th>
                          <th className="p-3 text-left text-sm font-semibold">Pagamento</th>
                          <th className="p-3 text-left text-sm font-semibold">NF</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="p-3 text-sm">05/01/2024</td>
                          <td className="p-3 text-sm">12</td>
                          <td className="p-3 text-sm">Cheila</td>
                          <td className="p-3 text-sm font-semibold">R$ 100,00</td>
                          <td className="p-3">
                            <Badge variant="default">Pago</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="default">Sim</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Patients;
