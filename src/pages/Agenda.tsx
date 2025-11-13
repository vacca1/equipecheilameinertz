import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Check, Clock, X, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentModal } from "@/components/AppointmentModal";
import { therapistsWithAll } from "@/data/therapists";

type AppointmentStatus = "confirmed" | "pending" | "blocked" | "cancelled" | "free";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  status: AppointmentStatus;
  therapist: string;
  hasInvoice: boolean;
  notes?: string;
  room?: string;
  duration: string;
}

// Mock data com mais exemplos
const mockAppointments: Record<string, Appointment[]> = {
  "2024-01-08": [
    {
      id: "1",
      patientName: "Maria Silva",
      time: "08:00",
      status: "confirmed",
      therapist: "Cheila",
      hasInvoice: true,
      room: "Sala 1",
      duration: "1h",
      notes: "Paciente com dor lombar crônica",
    },
    {
      id: "2",
      patientName: "João Santos",
      time: "09:00",
      status: "pending",
      therapist: "Ana Falcão",
      hasInvoice: false,
      room: "Sala 2",
      duration: "1h",
      notes: "Confirmar presença",
    },
    {
      id: "3",
      patientName: "Carlos Mendes",
      time: "10:30",
      status: "confirmed",
      therapist: "Cheila",
      hasInvoice: true,
      room: "Sala 1",
      duration: "45min",
    },
    {
      id: "4",
      patientName: "Bloqueio - Reunião",
      time: "14:00",
      status: "blocked",
      therapist: "Cheila",
      hasInvoice: false,
      duration: "1h",
    },
    {
      id: "5",
      patientName: "Fernanda Costa",
      time: "15:30",
      status: "confirmed",
      therapist: "Grazii",
      hasInvoice: true,
      room: "Sala 3",
      duration: "1h",
      notes: "Primeira sessão - Avaliação",
    },
  ],
  "2024-01-09": [
    {
      id: "6",
      patientName: "Pedro Costa",
      time: "10:00",
      status: "confirmed",
      therapist: "Grazii",
      hasInvoice: true,
      room: "Sala 3",
      duration: "1h",
      notes: "Sessão de RPG",
    },
    {
      id: "7",
      patientName: "Ana Lima",
      time: "11:00",
      status: "pending",
      therapist: "Ana Falcão",
      hasInvoice: false,
      room: "Sala 2",
      duration: "1h",
    },
    {
      id: "8",
      patientName: "Roberto Silva",
      time: "14:00",
      status: "cancelled",
      therapist: "Cheila",
      hasInvoice: false,
      room: "Sala 1",
      duration: "1h",
      notes: "Paciente cancelou por motivo de saúde",
    },
    {
      id: "9",
      patientName: "Julia Mendes",
      time: "16:00",
      status: "confirmed",
      therapist: "Ana Falcão",
      hasInvoice: true,
      room: "Sala 2",
      duration: "1h",
    },
  ],
  "2024-01-10": [
    {
      id: "10",
      patientName: "Marcos Paulo",
      time: "08:30",
      status: "confirmed",
      therapist: "Cheila",
      hasInvoice: true,
      room: "Sala 1",
      duration: "1h",
    },
    {
      id: "11",
      patientName: "Patricia Santos",
      time: "09:30",
      status: "pending",
      therapist: "Grazii",
      hasInvoice: false,
      room: "Sala 3",
      duration: "45min",
      notes: "Ligar para confirmar",
    },
    {
      id: "12",
      patientName: "Eduardo Lima",
      time: "13:00",
      status: "confirmed",
      therapist: "Ana Falcão",
      hasInvoice: true,
      room: "Sala 2",
      duration: "1h",
    },
  ],
  "2024-01-11": [
    {
      id: "13",
      patientName: "Claudia Oliveira",
      time: "10:00",
      status: "confirmed",
      therapist: "Cheila",
      hasInvoice: true,
      room: "Sala 1",
      duration: "1h",
      notes: "Pós-operatório joelho",
    },
    {
      id: "14",
      patientName: "Ricardo Costa",
      time: "11:00",
      status: "confirmed",
      therapist: "Grazii",
      hasInvoice: false,
      room: "Sala 3",
      duration: "1h",
    },
  ],
  "2024-01-12": [
    {
      id: "15",
      patientName: "Luciana Ferreira",
      time: "09:00",
      status: "confirmed",
      therapist: "Ana Falcão",
      hasInvoice: true,
      room: "Sala 2",
      duration: "1h",
    },
    {
      id: "16",
      patientName: "Sergio Alves",
      time: "14:00",
      status: "pending",
      therapist: "Cheila",
      hasInvoice: false,
      room: "Sala 1",
      duration: "1h",
    },
  ],
  "2024-01-13": [
    {
      id: "17",
      patientName: "Beatriz Santos",
      time: "10:00",
      status: "confirmed",
      therapist: "Grazii",
      hasInvoice: true,
      room: "Sala 3",
      duration: "1h",
    },
  ],
};



const timeSlots = Array.from({ length: 50 }, (_, i) => {
  const totalMinutes = 7.5 * 60 + i * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

const getStatusColor = (status: AppointmentStatus) => {
  switch (status) {
    case "confirmed":
      return "bg-status-confirmed text-foreground border-success/20";
    case "pending":
      return "bg-status-pending text-foreground border-pink-300";
    case "blocked":
      return "bg-status-blocked text-destructive-foreground border-destructive";
    case "cancelled":
      return "bg-status-cancelled text-destructive-foreground border-destructive";
    default:
      return "bg-status-free hover:bg-muted border-border/50";
  }
};

const getStatusIcon = (status: AppointmentStatus) => {
  switch (status) {
    case "confirmed":
      return <Check className="w-3 h-3 text-success" />;
    case "pending":
      return <Clock className="w-3 h-3 text-warning" />;
    case "blocked":
      return <Lock className="w-3 h-3 text-destructive-foreground" />;
    case "cancelled":
      return <X className="w-3 h-3 text-destructive-foreground" />;
    default:
      return null;
  }
};

const Agenda = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTherapist, setSelectedTherapist] = useState("TODAS");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const handleCellClick = (day: Date, time: string) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const appointment = mockAppointments[dateKey]?.find((a) => a.time === time);

    if (appointment) {
      setSelectedAppointment(appointment);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
    } else {
      setSelectedAppointment(null);
      setSelectedDate(day);
      setSelectedTime(time);
    }
    setModalOpen(true);
  };

  const filterAppointmentsByTherapist = (appointments: Appointment[]) => {
    if (selectedTherapist === "TODAS") return appointments;
    return appointments.filter((a) => a.therapist === selectedTherapist);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Icon */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-soft">
              <CalendarIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Agenda Semanal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualização e gerenciamento de consultas por fisioterapeuta
              </p>
            </div>
          </div>
          <Button className="shadow-soft" onClick={() => {
            setSelectedAppointment(null);
            setSelectedDate(undefined);
            setSelectedTime(undefined);
            setModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        <div className="flex flex-col gap-4">

          {/* Week Navigator */}
          <Card className="p-3 sm:p-4 shadow-soft">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="shadow-soft flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shadow-soft flex-1 min-w-0">
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-primary flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-base truncate">
                      <span className="hidden sm:inline">Semana de </span>
                      {format(weekDays[0], "dd/MM", { locale: ptBR })} <span className="hidden sm:inline">a</span>
                      <span className="sm:hidden">-</span> {format(weekDays[5], "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={currentWeek}
                    onSelect={(date) => date && setCurrentWeek(date)}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="shadow-soft flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Therapist Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {therapistsWithAll.map((therapist) => (
              <Button
                key={therapist}
                variant={selectedTherapist === therapist ? "default" : "outline"}
                onClick={() => setSelectedTherapist(therapist)}
                className={cn(
                  "whitespace-nowrap shadow-soft min-w-fit text-xs sm:text-sm px-3 sm:px-4",
                  selectedTherapist === therapist && "shadow-hover"
                )}
              >
                {therapist}
              </Button>
            ))}
          </div>

          {/* Legend */}
          <Card className="p-3 sm:p-4 shadow-soft">
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-status-confirmed border border-success/20" />
                <Check className="w-2 h-2 sm:w-3 sm:h-3 text-success -ml-0.5 sm:-ml-1" />
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-pending border border-pink-300" />
                <Clock className="w-3 h-3 text-warning -ml-1" />
                <span>A confirmar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-blocked border border-destructive" />
                <Lock className="w-3 h-3 text-destructive-foreground -ml-1" />
                <span>Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-cancelled border border-destructive line-through" />
                <X className="w-3 h-3 text-destructive-foreground -ml-1" />
                <span>Cancelado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-free border border-border/50" />
                <span>Livre</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Nota fiscal emitida</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Grid - Desktop */}
        <div className="hidden lg:block">
          <Card className="overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left font-semibold text-sm w-24 border-r border-border">
                      Horário
                    </th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="p-3 text-center font-semibold text-sm border-r border-border last:border-r-0">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs uppercase">
                            {format(day, "EEEEEE", { locale: ptBR })}
                          </span>
                          <span className="text-base mt-1">{format(day, "dd/MM", { locale: ptBR })}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time, idx) => (
                    <tr key={time} className={cn(
                      "border-t border-border",
                      idx % 4 === 0 && "border-t-2 border-primary/10"
                    )}>
                      <td className="p-2 text-sm text-muted-foreground font-medium border-r border-border sticky left-0 bg-background">
                        {time}
                      </td>
                      {weekDays.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const allAppointments = mockAppointments[dateKey] || [];
                        const appointments = filterAppointmentsByTherapist(allAppointments);
                        const appointment = appointments.find((a) => a.time === time);

                        return (
                          <td key={day.toISOString()} className="p-1 border-r border-border last:border-r-0">
                            {appointment ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCellClick(day, time)}
                                    className={cn(
                                      "w-full p-2 rounded-lg text-left text-xs transition-all hover:shadow-hover border-2",
                                      getStatusColor(appointment.status),
                                      appointment.status === "cancelled" && "line-through opacity-70"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="font-semibold truncate flex-1">
                                        {appointment.patientName}
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {getStatusIcon(appointment.status)}
                                        {appointment.hasInvoice && (
                                          <FileText className="w-3 h-3 text-primary" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs opacity-80 mt-0.5 truncate">
                                      {appointment.therapist}
                                    </div>
                                    {appointment.room && (
                                      <div className="text-xs opacity-70 mt-0.5">
                                        {appointment.room}
                                      </div>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-1">
                                    <div className="font-semibold">{appointment.patientName}</div>
                                    <div className="text-xs">
                                      {appointment.time} - {appointment.duration}
                                    </div>
                                    <div className="text-xs">
                                      Fisioterapeuta: {appointment.therapist}
                                    </div>
                                    {appointment.room && (
                                      <div className="text-xs">Sala: {appointment.room}</div>
                                    )}
                                    {appointment.notes && (
                                      <div className="text-xs mt-2 pt-2 border-t border-border">
                                        📝 {appointment.notes}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <button
                                onClick={() => handleCellClick(day, time)}
                                className="w-full h-16 rounded-lg bg-status-free hover:bg-muted transition-colors border border-border/50 hover:border-primary/30"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Calendar Grid - Mobile (Day View) */}
        <div className="lg:hidden space-y-4">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const allAppointments = mockAppointments[dateKey] || [];
            const appointments = filterAppointmentsByTherapist(allAppointments);

            return (
              <Card key={day.toISOString()} className="p-3 sm:p-4 shadow-soft">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 pb-2 border-b border-border flex items-center justify-between">
                  <span>{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                  <Badge variant="outline" className="text-xs">
                    {appointments.length} agend.
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {timeSlots.slice(0, 25).map((time) => {
                    const appointment = appointments.find((a) => a.time === time);

                    // Mostrar apenas horários com agendamento ou principais
                    if (!appointment && time !== "08:00" && time !== "14:00") {
                      return null;
                    }

                    return (
                      <div key={time} className="flex gap-2">
                        <div className="text-xs sm:text-sm text-muted-foreground font-medium w-12 sm:w-16 pt-2">
                          {time}
                        </div>
                        {appointment ? (
                          <button
                            onClick={() => handleCellClick(day, time)}
                            className={cn(
                              "flex-1 p-2 sm:p-3 rounded-lg text-left transition-all border-2",
                              getStatusColor(appointment.status)
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm sm:text-base truncate">{appointment.patientName}</div>
                                <div className="text-xs sm:text-sm opacity-80 mt-1">
                                  {appointment.therapist}
                                </div>
                                {appointment.room && (
                                  <div className="text-xs opacity-70 mt-1">
                                    {appointment.room}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {getStatusIcon(appointment.status)}
                                {appointment.hasInvoice && (
                                  <FileText className="w-3 h-3 text-primary" />
                                )}
                              </div>
                            </div>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCellClick(day, time)}
                            className="flex-1 rounded-lg bg-status-free hover:bg-muted transition-colors border border-border/50 p-2 sm:p-3"
                          >
                            <span className="text-xs sm:text-sm text-muted-foreground">Horário livre</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Appointment Modal */}
        <AppointmentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          appointment={selectedAppointment}
          prefilledDate={selectedDate}
          prefilledTime={selectedTime}
        />
      </div>
    </TooltipProvider>
  );
};

export default Agenda;
