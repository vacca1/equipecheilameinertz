import { useState, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, User, MapPin, FileText, Eye, Plus, AlertTriangle } from "lucide-react";
import { format, addWeeks, differenceInWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { therapists } from "@/data/therapists";
import { rooms } from "@/data/rooms";
import { useCreateAppointment, useUpdateAppointment, useDeleteAppointment, useAppointments, validateWeeklyRepetition } from "@/hooks/useAppointments";
import { usePatients, type Patient } from "@/hooks/usePatients";
import { PatientQuickView } from "@/components/PatientQuickView";
import { PatientFormModal } from "@/components/PatientFormModal";

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment?: any;
  prefilledDate?: Date;
  prefilledTime?: string;
  prefilledTherapist?: string;
}

const durations = ["30min", "45min", "1h", "1h15", "1h30"];
const timeSlots = Array.from({ length: 29 }, (_, i) => {
  const totalMinutes = 6.5 * 60 + i * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export const AppointmentModal = ({ open, onClose, appointment, prefilledDate, prefilledTime, prefilledTherapist }: AppointmentModalProps) => {
  const [date, setDate] = useState<Date | undefined>(prefilledDate || appointment?.date || new Date());
  const [time, setTime] = useState(prefilledTime || appointment?.time || "08:00");
  const [patient, setPatient] = useState(appointment?.patientName || "");
  const [therapist, setTherapist] = useState(appointment?.therapist || prefilledTherapist || "");
  const [duration, setDuration] = useState(appointment?.duration || "30min");
  const [room, setRoom] = useState(appointment?.room || "");
  const [status, setStatus] = useState(appointment?.status || "pending");
  const [notes, setNotes] = useState(appointment?.notes || "");
  const [isFirstSession, setIsFirstSession] = useState(appointment?.isFirstSession || false);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState<Date | undefined>();
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [conflictPreview, setConflictPreview] = useState<{ conflicts: string[]; totalWeeks: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [roomConflict, setRoomConflict] = useState<string>("");

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const { data: patientsData = [] } = usePatients();
  const { data: allAppointments = [] } = useAppointments();

  useEffect(() => {
    if (!open) return;

    if (appointment) {
      // Edição de agendamento existente
      setPatient(appointment.patientName || "");
      // Data e horário: usar o slot clicado se veio da agenda
      setDate(prefilledDate || appointment.date || new Date());
      setTime(prefilledTime || appointment.time || "08:00");
      // Fisioterapeuta: priorizar o que está no agendamento
      setTherapist(appointment.therapist || prefilledTherapist || "");
      setDuration(appointment.duration || "1h");
      setRoom(appointment.room || "");
      setStatus(appointment.status || "pending");
      setNotes(appointment.notes || "");
      setIsFirstSession(appointment.isFirstSession || false);
      setRepeatWeekly(false);
      setRepeatUntil(undefined);
    } else {
      // Novo agendamento (slot vazio ou botão "Novo Agendamento")
      setPatient("");
      setDate(prefilledDate || new Date());
      setTime(prefilledTime || "08:00");
      setTherapist(prefilledTherapist || "");
      setDuration("30min");
      setRoom("");
      setStatus("pending");
      setNotes("");
      setIsFirstSession(false);
      setRepeatWeekly(false);
      setRepeatUntil(undefined);
    }
  }, [open, appointment, prefilledDate, prefilledTime, prefilledTherapist]);

  // Função auxiliar para converter "1h", "45min" etc em minutos
  const parseDuration = (dur: string): number => {
    if (dur.includes('h')) {
      const match = dur.match(/(\d+)h(\d+)?/);
      if (match) {
        const hours = parseInt(match[1]) || 1;
        const minutes = parseInt(match[2]) || 0;
        return hours * 60 + minutes;
      }
      return 60;
    }
    return parseInt(dur.replace(/\D/g, '')) || 60;
  };

  // Função para verificar conflito de horários considerando duração
  const hasTimeConflict = (
    newStart: string, 
    newDuration: number, 
    existingStart: string, 
    existingDuration: number
  ): boolean => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    
    const newStartMin = toMinutes(newStart);
    const newEndMin = newStartMin + newDuration;
    const existingStartMin = toMinutes(existingStart);
    const existingEndMin = existingStartMin + existingDuration;
    
    // Verifica sobreposição de intervalos
    return newStartMin < existingEndMin && newEndMin > existingStartMin;
  };

  // Validar conflito de sala
  const checkRoomConflict = () => {
    if (!room || !date || !time || !duration) {
      setRoomConflict("");
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const newDurationMinutes = parseDuration(duration);

    const conflictingApt = allAppointments.find((apt) => {
      if (apt.room !== room) return false;
      if (apt.date !== formattedDate) return false;
      if (apt.status === "cancelled") return false;
      if (apt.id === appointment?.id) return false;
      
      return hasTimeConflict(time, newDurationMinutes, apt.time, apt.duration || 60);
    });

    if (conflictingApt) {
      const [h, m] = conflictingApt.time.split(':').map(Number);
      const endMin = h * 60 + m + (conflictingApt.duration || 60);
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      
      setRoomConflict(
        `${room} ocupada de ${conflictingApt.time} às ${endTime} por ${conflictingApt.therapist} (${conflictingApt.patient_name})`
      );
    } else {
      setRoomConflict("");
    }
  };

  // Verificar conflito de sala quando mudar sala, data, horário ou duração
  useEffect(() => {
    checkRoomConflict();
  }, [room, date, time, duration, allAppointments]);

  const handleSave = () => {
    // Validações
    if (!patient) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!therapist) {
      toast.error("Selecione uma fisioterapeuta");
      return;
    }
    if (!date) {
      toast.error("Selecione uma data");
      return;
    }

    // Verificar conflito de sala
    if (roomConflict) {
      toast.error("Existe um conflito de sala. Escolha outro horário ou outra sala.");
      return;
    }

    // Verificar conflito de horário com duração (Pilates dupla permite até 2 pacientes)
    const formattedDate = format(date, "yyyy-MM-dd");
    const newDurationMinutes = parseDuration(duration);
    
    const conflicts = allAppointments.filter(
      (apt) =>
        apt.therapist === therapist &&
        apt.date === formattedDate &&
        apt.status !== 'cancelled' &&
        apt.id !== appointment?.id && // Exclui o próprio agendamento se estiver editando
        hasTimeConflict(time, newDurationMinutes, apt.time, apt.duration || 60)
    );

    // Pilates dupla: permitir até 2 pacientes no mesmo horário
    if (conflicts.length >= 2) {
      toast.error(
        `⚠️ Horário lotado: máximo 2 pacientes permitidos (Pilates dupla). Já existem ${conflicts.length} agendamentos neste horário.`
      );
      return;
    }

    if (conflicts.length === 1) {
      const conflict = conflicts[0];
      const conflictEndTime = (() => {
        const [h, m] = conflict.time.split(':').map(Number);
        const totalMin = h * 60 + m + (conflict.duration || 60);
        const endH = Math.floor(totalMin / 60);
        const endM = totalMin % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      })();
      
      toast.warning(
        `⚠️ Este horário invade o tempo da sessão anterior (${conflict.patient_name} - termina às ${conflictEndTime}). Pilates dupla: ainda é possível agendar.`,
        { duration: 5000 }
      );
    }

    // Validar repeat_until se repeat_weekly está ativo
    if (repeatWeekly && !repeatUntil) {
      toast.error("Selecione uma data final para a repetição semanal");
      return;
    }

    // Buscar patient_id do paciente selecionado
    const selectedPatient = patientsData.find(p => p.name === patient);
    
    const appointmentData = {
      patient_id: selectedPatient?.id || undefined,
      patient_name: patient,
      date: format(date, "yyyy-MM-dd"),
      time,
      duration: parseDuration(duration),
      therapist,
      room: room || undefined,
      status: status as "scheduled" | "confirmed" | "cancelled" | "completed",
      is_first_session: isFirstSession,
      repeat_weekly: repeatWeekly,
      repeat_until: repeatUntil ? format(repeatUntil, "yyyy-MM-dd") : undefined,
      notes: notes || undefined,
    };

    if (appointment?.id) {
      updateAppointment.mutate({ id: appointment.id, ...appointmentData });
    } else {
      createAppointment.mutate(appointmentData);
    }
    
    onClose();
  };

  const handleBlock = () => {
    if (!therapist || !date) {
      toast.error("Selecione fisioterapeuta e data");
      return;
    }

    const blockData = {
      patient_name: "Bloqueio",
      date: format(date, "yyyy-MM-dd"),
      time,
      duration: parseDuration(duration),
      therapist,
      status: "blocked" as const,
      is_first_session: false,
      repeat_weekly: false,
      notes: notes || undefined,
    };

    createAppointment.mutate(blockData);
    onClose();
  };

  const handleCancel = () => {
    if (appointment?.id) {
      deleteAppointment.mutate(appointment.id);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:gap-6 py-3 sm:py-4">
          {/* Paciente */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente *
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  type="text"
                  placeholder="🔍 Buscar por nome ou CPF..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                
                <Select 
                  value={patient} 
                  onValueChange={(value) => {
                    setPatient(value);
                    const patientData = patientsData.find(p => p.name === value);
                    setSelectedPatientData(patientData || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {patientsData
                      .filter((p) => 
                        p.status === "active" && 
                        (p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                         p.cpf?.includes(patientSearch))
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            {p.cpf && (
                              <span className="text-xs text-muted-foreground">
                                CPF: {p.cpf}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowAddPatientModal(true)}
                title="Cadastrar novo paciente"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPatientDetails(true)}
                disabled={!patient}
                title="Ver ficha completa do paciente"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Data */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Data *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário com indicador de conflito */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário *
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar horário" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((slot) => {
                    // Verificar se o slot está ocupado pela duração de uma sessão anterior
                    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                    const isOccupied = therapist && allAppointments.some((apt) => {
                      if (apt.therapist !== therapist || apt.date !== formattedDate || apt.status === 'cancelled') return false;
                      if (apt.id === appointment?.id) return false;
                      
                      const aptDuration = apt.duration || 60;
                      const [aptH, aptM] = apt.time.split(':').map(Number);
                      const [slotH, slotM] = slot.split(':').map(Number);
                      const aptStartMin = aptH * 60 + aptM;
                      const aptEndMin = aptStartMin + aptDuration;
                      const slotMin = slotH * 60 + slotM;
                      
                      return slotMin >= aptStartMin && slotMin < aptEndMin;
                    });
                    
                    const occupyingApt = therapist && allAppointments.find((apt) => {
                      if (apt.therapist !== therapist || apt.date !== formattedDate || apt.status === 'cancelled') return false;
                      if (apt.id === appointment?.id) return false;
                      
                      const aptDuration = apt.duration || 60;
                      const [aptH, aptM] = apt.time.split(':').map(Number);
                      const [slotH, slotM] = slot.split(':').map(Number);
                      const aptStartMin = aptH * 60 + aptM;
                      const aptEndMin = aptStartMin + aptDuration;
                      const slotMin = slotH * 60 + slotM;
                      
                      return slotMin >= aptStartMin && slotMin < aptEndMin;
                    });
                    
                    return (
                      <SelectItem 
                        key={slot} 
                        value={slot}
                        className={cn(isOccupied && "text-warning")}
                      >
                        <span className="flex items-center gap-2">
                          {slot}
                          {isOccupied && occupyingApt && (
                            <span className="text-xs text-warning">
                              ⚠️ {occupyingApt.patient_name.split(' ')[0]} até {(() => {
                                const [h, m] = occupyingApt.time.split(':').map(Number);
                                const endMin = h * 60 + m + (occupyingApt.duration || 60);
                                return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
                              })()}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Duração */}
            <div className="grid gap-2">
              <Label>Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fisioterapeuta */}
            <div className="grid gap-2">
              <Label>Fisioterapeuta *</Label>
              <Select value={therapist} onValueChange={setTherapist}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar fisioterapeuta" />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Sala */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Sala (opcional)
              </Label>
              <Select value={room} onValueChange={setRoom}>
                <SelectTrigger className={cn(roomConflict && "border-destructive")}>
                  <SelectValue placeholder="Selecionar sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Alerta de conflito de sala */}
              {roomConflict && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {roomConflict}
                    <br />
                    <span className="opacity-80">Escolha outro horário ou outra sala</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">✓ Confirmado</SelectItem>
                  <SelectItem value="pending">🕐 A confirmar</SelectItem>
                  <SelectItem value="blocked">🔒 Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observação rápida (até 100 caracteres)
            </Label>
            <Textarea
              placeholder="Ex: Trazer exames anteriores, primeira consulta, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 100))}
              maxLength={100}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length}/100
            </div>
          </div>

          {/* Primeira sessão */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base">Primeira sessão?</Label>
              <div className="text-sm text-muted-foreground">
                Marca como consulta de avaliação
              </div>
            </div>
            <Switch checked={isFirstSession} onCheckedChange={setIsFirstSession} />
          </div>

          {/* Repetir semanalmente */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Repetir semanalmente</Label>
                <div className="text-sm text-muted-foreground">
                  Agendar para as próximas semanas
                </div>
              </div>
              <Switch 
                checked={repeatWeekly} 
                onCheckedChange={(checked) => {
            setRepeatWeekly(checked);
                  setConflictPreview(null);
                  // Auto-preencher com 4 semanas a partir da data selecionada
                  if (checked && date && !repeatUntil) {
                    setRepeatUntil(addWeeks(date, 4));
                  }
                }}
              />
            </div>

            {repeatWeekly && (
              <div className="grid gap-2 pt-2">
                <Label className="flex items-center gap-1">
                  Repetir até quando? <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !repeatUntil && "text-muted-foreground border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {repeatUntil ? format(repeatUntil, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data final"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={repeatUntil}
                      onSelect={setRepeatUntil}
                      initialFocus
                      className="pointer-events-auto"
                      locale={ptBR}
                      disabled={(d) => d < (date || new Date())}
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Preview de quantos agendamentos serão criados */}
                {repeatUntil && date && (
                  <div className="space-y-2">
                    <div className="text-sm text-primary font-medium bg-primary/10 p-2 rounded">
                      📅 Serão criados {differenceInWeeks(repeatUntil, date) + 1} agendamentos 
                      (de {format(date, "dd/MM", { locale: ptBR })} até {format(repeatUntil, "dd/MM/yyyy", { locale: ptBR })})
                    </div>
                    
                    {/* Botão para verificar conflitos */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!therapist || isValidating}
                      onClick={async () => {
                        if (!therapist || !date || !repeatUntil) return;
                        
                        setIsValidating(true);
                        try {
                          const result = await validateWeeklyRepetition({
                            date: format(date, "yyyy-MM-dd"),
                            repeat_until: format(repeatUntil, "yyyy-MM-dd"),
                            therapist,
                            time,
                            duration: parseDuration(duration),
                            patient_name: patient
                          });
                          setConflictPreview(result);
                        } catch (error) {
                          console.error("Erro ao validar:", error);
                        } finally {
                          setIsValidating(false);
                        }
                      }}
                    >
                      {isValidating ? "Verificando..." : "🔍 Verificar conflitos antes de salvar"}
                    </Button>
                    
                    {/* Resultado da verificação */}
                    {conflictPreview && (
                      conflictPreview.conflicts.length > 0 ? (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium">
                              {conflictPreview.conflicts.length} de {conflictPreview.totalWeeks} semanas têm conflito:
                            </div>
                            <div className="text-xs mt-1">
                              {conflictPreview.conflicts.join(", ")}
                            </div>
                            <div className="text-xs mt-1 opacity-80">
                              Essas datas serão ignoradas ao salvar.
                            </div>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="border-success bg-success/10">
                          <AlertDescription className="text-success">
                            ✓ Nenhum conflito encontrado! Todas as {conflictPreview.totalWeeks} semanas estão livres.
                          </AlertDescription>
                        </Alert>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          {appointment ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                Fechar
              </Button>
              <Button variant="destructive" onClick={handleCancel} className="w-full sm:w-auto">
                Cancelar Horário
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleBlock} className="w-full sm:w-auto">
                Bloquear Horário
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Salvar Agendamento
              </Button>
            </>
          )}
        </DialogFooter>

        <PatientQuickView
          open={showPatientDetails}
          onOpenChange={setShowPatientDetails}
          patient={selectedPatientData}
        />
        
        <PatientFormModal
          open={showAddPatientModal}
          onOpenChange={setShowAddPatientModal}
        />
      </DialogContent>
    </Dialog>
  );
};
