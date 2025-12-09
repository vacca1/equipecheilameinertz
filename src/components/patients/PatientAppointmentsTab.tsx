import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MapPin, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { usePatientAppointments } from "@/hooks/usePatientAppointments";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientAppointmentsTabProps {
  patientId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: { label: "Confirmado", color: "bg-success text-success-foreground", icon: <CheckCircle className="h-3 w-3" /> },
  completed: { label: "Realizado", color: "bg-success text-success-foreground", icon: <CheckCircle className="h-3 w-3" /> },
  pending: { label: "Pendente", color: "bg-warning text-warning-foreground", icon: <Clock className="h-3 w-3" /> },
  cancelled: { label: "Cancelado", color: "bg-destructive text-destructive-foreground", icon: <XCircle className="h-3 w-3" /> },
  blocked: { label: "Bloqueado", color: "bg-muted text-muted-foreground", icon: <AlertCircle className="h-3 w-3" /> },
  no_show: { label: "Não Compareceu", color: "bg-destructive text-destructive-foreground", icon: <XCircle className="h-3 w-3" /> },
};

export function PatientAppointmentsTab({ patientId }: PatientAppointmentsTabProps) {
  const { data: appointments = [], isLoading } = usePatientAppointments(patientId);

  const upcoming = appointments.filter(apt => {
    const aptDate = parseISO(apt.date);
    return isFuture(aptDate) && !["cancelled", "blocked"].includes(apt.status);
  });

  const history = appointments.filter(apt => {
    const aptDate = parseISO(apt.date);
    return isPast(aptDate) || apt.status === "completed";
  });

  const cancelled = appointments.filter(apt => 
    apt.status === "cancelled"
  );

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  const AppointmentCard = ({ appointment }: { appointment: typeof appointments[0] }) => {
    const status = statusConfig[appointment.status] || statusConfig.pending;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  {format(parseISO(appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="text-sm text-muted-foreground">{appointment.time}</span>
              </div>
            </div>
            <Badge className={status.color}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.therapist}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duração: {appointment.duration || 60} min</span>
            </div>

            {appointment.room && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.room}</span>
              </div>
            )}

            {appointment.notes && (
              <div className="flex items-start gap-2 text-sm mt-3 p-3 bg-muted rounded-md">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium block mb-1">Observações:</span>
                  <span className="text-muted-foreground">{appointment.notes}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="text-center py-8">
      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
      <h3 className="font-medium text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="flex w-full gap-1 overflow-x-auto scrollbar-hide mb-4">
        <TabsTrigger value="upcoming" className="shrink-0 whitespace-nowrap">
          Próximas ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="history" className="shrink-0 whitespace-nowrap">
          Histórico ({history.length})
        </TabsTrigger>
        <TabsTrigger value="cancelled" className="shrink-0 whitespace-nowrap">
          Canceladas ({cancelled.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-4">
        {upcoming.length === 0 ? (
          <EmptyState 
            title="Sem consultas agendadas"
            description="Nenhuma consulta futura para este paciente"
          />
        ) : (
          upcoming.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {history.length === 0 ? (
          <EmptyState 
            title="Sem histórico"
            description="Nenhuma consulta realizada ainda"
          />
        ) : (
          history.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)
        )}
      </TabsContent>

      <TabsContent value="cancelled" className="space-y-4">
        {cancelled.length === 0 ? (
          <EmptyState 
            title="Sem cancelamentos"
            description="Nenhuma consulta cancelada"
          />
        ) : (
          cancelled.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)
        )}
      </TabsContent>
    </Tabs>
  );
}
