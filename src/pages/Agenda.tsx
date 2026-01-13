import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Check, Clock, X, Lock, FileText, Copy, MessageSquare, StickyNote, Users } from "lucide-react";
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
import { therapists } from "@/data/therapists";
import { useAppointments, useCopyWeekAppointments } from "@/hooks/useAppointments";
import { useDayNotes } from "@/hooks/useDayNotes";
import { useWaitingList } from "@/hooks/useWaitingList";
import { usePatients } from "@/hooks/usePatients";
import { DayNotesPopover } from "@/components/DayNotesPopover";
import { WaitingListPopover } from "@/components/WaitingListPopover";
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

type AppointmentStatus = "confirmed" | "pending" | "blocked" | "cancelled" | "free";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  status: AppointmentStatus;
  attendanceStatus?: string; // 'scheduled' | 'present' | 'absent' | 'cancelled'
  therapist: string;
  hasInvoice: boolean;
  notes?: string;
  room?: string;
  duration: string;
}

// Mock data com mais exemplos - REMOVED, using real data from DB

const timeSlots = Array.from({ length: 29 }, (_, i) => {
  const totalMinutes = 6.5 * 60 + i * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

// Parse duration string to minutes
const parseDuration = (duration: string): number => {
  if (!duration) return 60;
  const clean = duration.toLowerCase().replace(/\s/g, '');
  if (clean.includes('h')) {
    const parts = clean.split('h');
    const hours = parseInt(parts[0]) || 0;
    const mins = parseInt(parts[1]?.replace('min', '')) || 0;
    return hours * 60 + mins;
  }
  return parseInt(clean.replace('min', '')) || 60;
};

// Calculate how many 30-min slots an appointment spans
const getRowSpan = (duration: string): number => {
  const minutes = parseDuration(duration);
  return Math.ceil(minutes / 30);
};

// Get height multiplier for cell (proportional to duration)
const getHeightMultiplier = (duration: string): number => {
  const minutes = parseDuration(duration);
  return minutes / 30;
};

// Check if a time slot is occupied by an ongoing appointment
const isSlotOccupied = (
  time: string,
  appointments: Appointment[],
  currentTimeSlots: string[]
): { occupied: boolean; appointmentInfo?: Appointment } => {
  const timeIndex = currentTimeSlots.indexOf(time);
  if (timeIndex === -1) return { occupied: false };

  for (const apt of appointments) {
    const aptStartIndex = currentTimeSlots.indexOf(apt.time);
    if (aptStartIndex === -1 || aptStartIndex >= timeIndex) continue;
    
    const slotsSpanned = getRowSpan(apt.duration);
    const aptEndIndex = aptStartIndex + slotsSpanned - 1;
    
    if (timeIndex > aptStartIndex && timeIndex <= aptEndIndex) {
      return { occupied: true, appointmentInfo: apt };
    }
  }
  return { occupied: false };
};

const getStatusColor = (status: AppointmentStatus, attendanceStatus?: string) => {
  // PRIORIDADE: Se presença confirmada, sempre verde forte
  if (attendanceStatus === "present") {
    return "bg-emerald-100 text-foreground border-emerald-500 border-2";
  }
  
  // Se faltou, cor de aviso (laranja)
  if (attendanceStatus === "absent") {
    return "bg-orange-100 text-foreground border-orange-400";
  }
  
  // Caso contrário, usar status do agendamento
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

const getStatusIcon = (status: AppointmentStatus, attendanceStatus?: string) => {
  // PRIORIDADE: Se presença confirmada, ícone de check verde
  if (attendanceStatus === "present") {
    return <Check className="w-3 h-3 text-emerald-600" />;
  }
  
  // Se faltou, ícone X laranja
  if (attendanceStatus === "absent") {
    return <X className="w-3 h-3 text-orange-500" />;
  }
  
  // Caso contrário, usar status do agendamento
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
  const [selectedTherapist, setSelectedTherapist] = useState<string>(therapists[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const copyWeek = useCopyWeekAppointments();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  // Fetch appointments for the current week
  const startDate = format(weekStart, "yyyy-MM-dd");
  const endDate = format(addDays(weekStart, 5), "yyyy-MM-dd");
  const therapistFilter = selectedTherapist;
  
  const { data: appointments = [], isLoading } = useAppointments(
    new Date(startDate),
    new Date(endDate),
    therapistFilter
  );

  // Fetch day notes and waiting list
  const { notes: dayNotes, upsertNote, deleteNote, getNoteForDate } = useDayNotes(startDate, endDate, therapistFilter);
  const { waitingList, addToWaitingList, removeFromWaitingList, markAsScheduled, getWaitingListForDate, getCountForDate } = useWaitingList(startDate, endDate, therapistFilter);
  const { data: patients = [] } = usePatients();

  // Group appointments by date
  const mockAppointments: Record<string, Appointment[]> = {};
  appointments.forEach((apt) => {
    const dateKey = apt.date;
    if (!mockAppointments[dateKey]) {
      mockAppointments[dateKey] = [];
    }
    mockAppointments[dateKey].push({
      id: apt.id,
      patientName: apt.patient_name,
      time: apt.time,
      status: apt.status as AppointmentStatus,
      attendanceStatus: apt.attendance_status || undefined,
      therapist: apt.therapist,
      hasInvoice: false,
      notes: apt.notes || undefined,
      room: apt.room || undefined,
      duration: apt.duration ? `${apt.duration}min` : "60min",
    });
  });

  const handleCellClick = (day: Date, time: string) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const appointment = mockAppointments[dateKey]?.find((a) => a.time === time);

    // Se tiver agendamento, envia o objeto; senão, null
    setSelectedAppointment(appointment || null);

    // Sempre guarda a data e horário do slot clicado
    setSelectedDate(day);
    setSelectedTime(time);

    setModalOpen(true);
  };

  // Handle scheduling from waiting list
  const handleScheduleFromWaitingList = (item: typeof waitingList[0]) => {
    // Mark as scheduled and open modal with prefilled data
    markAsScheduled.mutate(item.id);
    const dateObj = new Date(item.date + "T12:00:00");
    setSelectedAppointment(null);
    setSelectedDate(dateObj);
    setSelectedTime(item.preferred_time || "08:00");
    setModalOpen(true);
  };

  // Convert patients to simple format for waiting list modal
  const patientsList = patients.map((p) => ({ id: p.id, name: p.name }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-title">Agenda Semanal</h1>
            <p className="page-subtitle">
              Visualização e gerenciamento de consultas por fisioterapeuta
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowCopyDialog(true)}
            >
              <Copy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Copiar Semana</span>
            </Button>
            <Button onClick={() => {
              setSelectedAppointment(null);
              setSelectedDate(undefined);
              setSelectedTime(undefined);
              setModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Agendamento</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">

          {/* Week Navigator */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 min-w-0">
                    <CalendarIcon className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                    <span className="font-medium text-sm truncate">
                      <span className="hidden sm:inline">Semana de </span>
                      {format(weekDays[0], "dd/MM", { locale: ptBR })}
                      <span className="mx-1">-</span>
                      {format(weekDays[5], "dd/MM/yyyy", { locale: ptBR })}
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
                className="flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Therapist Tabs */}
          <div className="inline-flex h-10 items-center gap-1 rounded-xl bg-muted/50 p-1 overflow-x-auto scrollbar-hide">
            {therapists.map((therapist) => (
              <Button
                key={therapist}
                variant={selectedTherapist === therapist ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTherapist(therapist)}
                className="whitespace-nowrap rounded-lg min-w-fit text-sm px-4"
              >
                {therapist}
              </Button>
            ))}
          </div>

          {/* Legend - Collapsible on mobile */}
          <details className="lg:hidden">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground p-3 bg-card rounded-lg border border-border flex items-center justify-between">
              <span>Ver Legenda</span>
              <ChevronRight className="w-4 h-4" />
            </summary>
            <Card className="p-3 mt-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-emerald-100 border-2 border-emerald-500" />
                  <span>Presente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-orange-100 border border-orange-400" />
                  <span>Faltou</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-status-confirmed border border-success/20" />
                  <span>Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-status-pending border border-pink-300" />
                  <span>A confirmar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-status-blocked border border-destructive" />
                  <span>Bloqueado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md bg-status-free border border-border/50" />
                  <span>Livre</span>
                </div>
              </div>
            </Card>
          </details>

          {/* Legend - Desktop */}
          <Card className="p-4 hidden lg:block">
            <div className="flex flex-wrap gap-3 sm:gap-5 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-emerald-100 border-2 border-emerald-500" />
                <span className="text-muted-foreground">Presente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-orange-100 border border-orange-400" />
                <span className="text-muted-foreground">Faltou</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-status-confirmed border border-success/20" />
                <span className="text-muted-foreground">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-status-pending border border-pink-300" />
                <span className="text-muted-foreground">A confirmar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-status-blocked border border-destructive" />
                <span className="text-muted-foreground">Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-status-free border border-border/50" />
                <span className="text-muted-foreground">Livre</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Com observação</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">NF emitida</span>
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
                  {/* Notes and Waiting List Row */}
                  <tr className="bg-muted/30 border-t border-border">
                    <th className="p-2 text-left text-xs font-medium text-muted-foreground border-r border-border">
                      <div className="flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />
                        <span>Notas</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        <span>Espera</span>
                      </div>
                    </th>
                    {weekDays.map((day) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const currentNote = getNoteForDate(dateKey, selectedTherapist !== "Todos" ? selectedTherapist : undefined);
                      const waitingCount = getCountForDate(dateKey);
                      const waitingItems = getWaitingListForDate(dateKey);

                      return (
                        <th key={`notes-${day.toISOString()}`} className="p-2 border-r border-border last:border-r-0">
                          <div className="flex items-center justify-center gap-2">
                            <DayNotesPopover
                              date={dateKey}
                              therapist={selectedTherapist !== "Todos" ? selectedTherapist : "Geral"}
                              currentNote={currentNote ? { id: currentNote.id, content: currentNote.content } : undefined}
                              onSave={(content) => upsertNote.mutate({ 
                                date: dateKey, 
                                therapist: selectedTherapist !== "Todos" ? selectedTherapist : "Geral", 
                                content 
                              })}
                              onDelete={(id) => deleteNote.mutate(id)}
                            />
                            <WaitingListPopover
                              date={dateKey}
                              therapist={selectedTherapist !== "Todos" ? selectedTherapist : "Todos"}
                              items={waitingItems}
                              onAdd={(item) => addToWaitingList.mutate(item)}
                              onRemove={(id) => removeFromWaitingList.mutate(id)}
                              onSchedule={handleScheduleFromWaitingList}
                              patients={patientsList}
                            />
                          </div>
                        </th>
                      );
                    })}
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
                        const dayAppointments = mockAppointments[dateKey] || [];
                        const appointmentsAtTime = dayAppointments.filter((a) => a.time === time);
                        const occupiedInfo = isSlotOccupied(time, dayAppointments, timeSlots);

                        return (
                          <td 
                            key={day.toISOString()} 
                            className="p-1 border-r border-border last:border-r-0 relative"
                            style={{ height: '80px' }}
                          >
                            {appointmentsAtTime.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCellClick(day, time)}
                                    style={{
                                      height: `${getHeightMultiplier(appointmentsAtTime[0].duration) * 80 - 8}px`,
                                    }}
                                    className={cn(
                                      "absolute inset-x-1 top-1 z-10 rounded-2xl text-left text-xs transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 border-0 overflow-hidden group",
                                      appointmentsAtTime.length === 1 && getStatusColor(appointmentsAtTime[0].status, appointmentsAtTime[0].attendanceStatus),
                                      appointmentsAtTime.length === 1 && appointmentsAtTime[0].status === "cancelled" && "line-through opacity-70",
                                      appointmentsAtTime.length > 1 && "bg-card shadow-sm flex flex-col"
                                    )}
                                  >
                                    {appointmentsAtTime.length === 1 ? (
                                      // Single patient layout - Premium card style
                                      <div className="p-2.5 h-full flex flex-col relative">
                                        {/* Status indicator dot */}
                                        <div className="absolute top-2 right-2">
                                          <div className={cn(
                                            "w-2.5 h-2.5 rounded-full shadow-sm",
                                            appointmentsAtTime[0].attendanceStatus === "present" && "bg-emerald-500",
                                            appointmentsAtTime[0].attendanceStatus === "absent" && "bg-orange-500",
                                            appointmentsAtTime[0].status === "confirmed" && !appointmentsAtTime[0].attendanceStatus && "bg-success",
                                            appointmentsAtTime[0].status === "pending" && "bg-warning",
                                            appointmentsAtTime[0].status === "blocked" && "bg-destructive",
                                          )} />
                                        </div>
                                        
                                        {/* Patient name - full display */}
                                        <div className="flex-1 min-w-0 pr-5">
                                          <span className="font-semibold text-[13px] leading-snug text-foreground block">
                                            {appointmentsAtTime[0].patientName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                          </span>
                                        </div>
                                        
                                        {/* Bottom info row */}
                                        <div className="flex items-center justify-between mt-auto pt-1">
                                          <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[55%]">
                                            {appointmentsAtTime[0].therapist}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {appointmentsAtTime[0].notes && (
                                              <MessageSquare className="w-3 h-3 text-primary opacity-70" />
                                            )}
                                            <span className="text-[9px] font-medium text-muted-foreground/80 bg-black/5 px-1.5 py-0.5 rounded">
                                              {appointmentsAtTime[0].duration}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // Dual patient layout - split view premium
                                      <div className="flex flex-1 h-full">
                                        {appointmentsAtTime.map((apt, aptIdx) => (
                                          <div
                                            key={apt.id}
                                            className={cn(
                                              "flex-1 p-2 flex flex-col relative",
                                              getStatusColor(apt.status, apt.attendanceStatus),
                                              apt.status === "cancelled" && "line-through opacity-70",
                                              aptIdx === 0 && "rounded-l-xl border-r border-black/5",
                                              aptIdx === 1 && "rounded-r-xl"
                                            )}
                                          >
                                            {/* Status dot */}
                                            <div className="absolute top-1.5 right-1.5">
                                              <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                apt.attendanceStatus === "present" && "bg-emerald-500",
                                                apt.attendanceStatus === "absent" && "bg-orange-500",
                                                apt.status === "confirmed" && !apt.attendanceStatus && "bg-success",
                                                apt.status === "pending" && "bg-warning",
                                              )} />
                                            </div>
                                            <div className="font-semibold text-[10px] leading-tight line-clamp-2 pr-3 flex-1">
                                              {apt.patientName}
                                            </div>
                                            {apt.notes && (
                                              <MessageSquare className="w-2.5 h-2.5 text-primary opacity-60 mt-0.5" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {appointmentsAtTime.length > 1 && (
                                      <div className="text-[9px] text-primary font-medium text-center py-1 bg-primary/10 border-t border-primary/10">
                                        🤸 Pilates Dupla
                                      </div>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2">
                                    {appointmentsAtTime.map((apt, aptIdx) => (
                                      <div key={apt.id} className={cn(aptIdx > 0 && "pt-2 border-t border-border")}>
                                        <div className="font-semibold">{apt.patientName}</div>
                                        <div className="text-xs">
                                          {apt.time} - {apt.duration}
                                        </div>
                                        <div className="text-xs">
                                          Fisioterapeuta: {apt.therapist}
                                        </div>
                                        {apt.room && (
                                          <div className="text-xs">Sala: {apt.room}</div>
                                        )}
                                        {apt.notes && (
                                          <div className="text-xs mt-1 pt-1 border-t border-border/50">
                                            📝 {apt.notes}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {appointmentsAtTime.length > 1 && (
                                      <div className="text-xs text-primary font-medium pt-2 border-t border-border">
                                        🤸 Pilates Dupla
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : occupiedInfo.occupied ? (
                              // Slot ocupado por sessão em andamento - célula invisível mas não clicável
                              <div className="w-full h-full" />
                            ) : (
                              <button
                                onClick={() => handleCellClick(day, time)}
                                className="w-full h-full rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-sm"
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
          {/* Mobile Day Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
              disabled={selectedDayIndex === 0}
              className="flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide">
              {weekDays.map((day, index) => (
                <Button
                  key={day.toISOString()}
                  variant={selectedDayIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDayIndex(index)}
                  className="flex-shrink-0 min-w-[80px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">
                      {format(day, "EEE", { locale: ptBR })}
                    </span>
                    <span className="text-sm font-semibold">
                      {format(day, "dd/MM")}
                    </span>
                  </div>
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDayIndex((prev) => Math.min(5, prev + 1))}
              disabled={selectedDayIndex === 5}
              className="flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected Day Card */}
          {(() => {
            const day = weekDays[selectedDayIndex];
            const dateKey = format(day, "yyyy-MM-dd");
            const allAppointments = mockAppointments[dateKey] || [];
            const currentNote = getNoteForDate(dateKey, selectedTherapist !== "Todos" ? selectedTherapist : undefined);
            const waitingItems = getWaitingListForDate(dateKey);

            return (
              <Card className="p-3 sm:p-4 shadow-soft">
                <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">
                      {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {allAppointments.length} agend.
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <DayNotesPopover
                      date={dateKey}
                      therapist={selectedTherapist !== "Todos" ? selectedTherapist : "Geral"}
                      currentNote={currentNote ? { id: currentNote.id, content: currentNote.content } : undefined}
                      onSave={(content) => upsertNote.mutate({ 
                        date: dateKey, 
                        therapist: selectedTherapist !== "Todos" ? selectedTherapist : "Geral", 
                        content 
                      })}
                      onDelete={(id) => deleteNote.mutate(id)}
                    />
                    <WaitingListPopover
                      date={dateKey}
                      therapist={selectedTherapist !== "Todos" ? selectedTherapist : "Todos"}
                      items={waitingItems}
                      onAdd={(item) => addToWaitingList.mutate(item)}
                      onRemove={(id) => removeFromWaitingList.mutate(id)}
                      onSchedule={handleScheduleFromWaitingList}
                      patients={patientsList}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {timeSlots.map((time) => {
                    const appointmentsAtTime = allAppointments.filter((a) => a.time === time);
                    const occupiedInfo = isSlotOccupied(time, allAppointments, timeSlots);

                    return (
                      <div key={time} className="flex gap-2">
                        <div className="text-xs sm:text-sm text-muted-foreground font-medium w-12 sm:w-16 pt-2">
                          {time}
                        </div>
                        {appointmentsAtTime.length > 0 ? (
                          <button
                            onClick={() => handleCellClick(day, time)}
                            className={cn(
                              "flex-1 rounded-2xl text-left transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 border-0 overflow-hidden",
                              appointmentsAtTime.length === 1 && getStatusColor(appointmentsAtTime[0].status, appointmentsAtTime[0].attendanceStatus),
                              appointmentsAtTime.length > 1 && "bg-card shadow-sm"
                            )}
                          >
                            {appointmentsAtTime.length === 1 ? (
                              // Single patient layout - Premium mobile card
                              <div className="p-3 sm:p-4 relative">
                                {/* Status indicator dot */}
                                <div className="absolute top-3 right-3">
                                  <div className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    appointmentsAtTime[0].attendanceStatus === "present" && "bg-emerald-500",
                                    appointmentsAtTime[0].attendanceStatus === "absent" && "bg-orange-500",
                                    appointmentsAtTime[0].status === "confirmed" && !appointmentsAtTime[0].attendanceStatus && "bg-success",
                                    appointmentsAtTime[0].status === "pending" && "bg-warning",
                                    appointmentsAtTime[0].status === "blocked" && "bg-destructive",
                                  )} />
                                </div>
                                
                                <div className="flex items-start gap-3 pr-6">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm sm:text-base text-foreground">
                                      {appointmentsAtTime[0].patientName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                      {appointmentsAtTime[0].therapist}
                                    </div>
                                    {appointmentsAtTime[0].room && (
                                      <div className="text-xs text-muted-foreground/70 mt-0.5">
                                        {appointmentsAtTime[0].room}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Bottom row with icons and duration */}
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                                  <div className="flex items-center gap-2">
                                    {appointmentsAtTime[0].notes && (
                                      <MessageSquare className="w-3.5 h-3.5 text-primary opacity-70" />
                                    )}
                                    {appointmentsAtTime[0].hasInvoice && (
                                      <FileText className="w-3.5 h-3.5 text-success opacity-70" />
                                    )}
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground bg-black/5 px-2 py-0.5 rounded-md">
                                    {appointmentsAtTime[0].duration}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Dual patient layout - split view
                              <div className="flex flex-col">
                                <div className="flex">
                                  {appointmentsAtTime.map((apt, aptIdx) => (
                                    <div
                                      key={apt.id}
                                      className={cn(
                                        "flex-1 p-2 sm:p-3",
                                        getStatusColor(apt.status, apt.attendanceStatus),
                                        apt.status === "cancelled" && "line-through opacity-70",
                                        aptIdx === 0 && "border-r border-border/50"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-1">
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-xs sm:text-sm truncate">{apt.patientName}</div>
                                          <div className="text-[10px] sm:text-xs opacity-80 mt-0.5">
                                            {apt.therapist}
                                          </div>
                                          {apt.room && (
                                            <div className="text-[10px] opacity-70 mt-0.5 truncate">
                                              {apt.room}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                          {getStatusIcon(apt.status, apt.attendanceStatus)}
                                          {apt.notes && (
                                            <MessageSquare className="w-3 h-3 text-primary" />
                                          )}
                                          {apt.hasInvoice && (
                                            <FileText className="w-3 h-3 text-success" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-xs text-primary font-medium text-center py-1 bg-primary/10 border-t border-primary/20">
                                  🤸 Pilates Dupla
                                </div>
                              </div>
                            )}
                          </button>
                        ) : occupiedInfo.occupied ? (
                          // Slot ocupado - não clicável, visualmente sutil
                          <div className="flex-1 rounded-lg bg-muted/50 p-2 sm:p-3" />
                        ) : (
                          <button
                            onClick={() => handleCellClick(day, time)}
                            className="flex-1 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-sm p-3 sm:p-4"
                          >
                            <span className="text-xs sm:text-sm text-muted-foreground/70">Horário livre</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })()}
        </div>

        {/* Appointment Modal */}
        <AppointmentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          appointment={selectedAppointment}
          prefilledDate={selectedDate}
          prefilledTime={selectedTime}
          prefilledTherapist={selectedTherapist !== "TODAS" ? selectedTherapist : undefined}
        />

        {/* Copy Week Dialog */}
        <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Copiar Agenda para Próxima Semana</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    Isso irá copiar os agendamentos de <strong>{selectedTherapist}</strong> da semana atual 
                    ({format(weekDays[0], "dd/MM")} a {format(weekDays[5], "dd/MM")}) para a próxima semana 
                    ({format(addWeeks(weekDays[0], 1), "dd/MM")} a {format(addWeeks(weekDays[5], 1), "dd/MM")}).
                  </p>
                  <p>
                    Os novos agendamentos serão criados com status "A confirmar".
                    Agendamentos que já existem na semana destino serão ignorados.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  copyWeek.mutate({
                    sourceWeekStart: weekStart,
                    targetWeekStart: addWeeks(weekStart, 1),
                    therapistFilter: selectedTherapist,
                  });
                  setShowCopyDialog(false);
                }}
                disabled={copyWeek.isPending}
              >
                {copyWeek.isPending ? "Copiando..." : "Confirmar Cópia"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default Agenda;
