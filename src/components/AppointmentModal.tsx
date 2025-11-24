import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, MapPin, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { therapists } from "@/data/therapists";
import { rooms } from "@/data/rooms";
import { useCreateAppointment, useUpdateAppointment, useDeleteAppointment, useAppointments } from "@/hooks/useAppointments";
import { usePatients, type Patient } from "@/hooks/usePatients";
import { PatientQuickView } from "@/components/PatientQuickView";

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
  const [duration, setDuration] = useState(appointment?.duration || "1h");
  const [room, setRoom] = useState(appointment?.room || "");
  const [status, setStatus] = useState(appointment?.status || "pending");
  const [notes, setNotes] = useState(appointment?.notes || "");
  const [isFirstSession, setIsFirstSession] = useState(appointment?.isFirstSession || false);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState<Date | undefined>();
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);

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
      setDuration("1h");
      setRoom("");
      setStatus("pending");
      setNotes("");
      setIsFirstSession(false);
      setRepeatWeekly(false);
      setRepeatUntil(undefined);
    }
  }, [open, appointment, prefilledDate, prefilledTime, prefilledTherapist]);

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

    // Verificar conflito de horário
    const formattedDate = format(date, "yyyy-MM-dd");
    const conflict = allAppointments.find(
      (apt) =>
        apt.therapist === therapist &&
        apt.date === formattedDate &&
        apt.time === time &&
        apt.status !== 'cancelled' &&
        apt.id !== appointment?.id // Exclui o próprio agendamento se estiver editando
    );

    if (conflict) {
      toast.error(
        `⚠️ Conflito de horário: ${therapist} já tem agendamento às ${time} em ${format(date, "dd/MM/yyyy", { locale: ptBR })}`
      );
      return;
    }

    const appointmentData = {
      patient_name: patient,
      date: format(date, "yyyy-MM-dd"),
      time,
      duration: parseInt(duration.replace(/\D/g, "")) || 60,
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
      duration: parseInt(duration.replace(/\D/g, "")) || 60,
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
              <Select 
                value={patient} 
                onValueChange={(value) => {
                  setPatient(value);
                  const patientData = patientsData.find(p => p.name === value);
                  setSelectedPatientData(patientData || null);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {patientsData
                    .filter((p) => p.status === "active")
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
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

            {/* Horário */}
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
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
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
                <SelectTrigger>
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
              <Switch checked={repeatWeekly} onCheckedChange={setRepeatWeekly} />
            </div>

            {repeatWeekly && (
              <div className="grid gap-2 pt-2">
                <Label>Repetir até quando?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !repeatUntil && "text-muted-foreground"
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
                      disabled={(date) => date < (new Date())}
                    />
                  </PopoverContent>
                </Popover>
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
      </DialogContent>
    </Dialog>
  );
};
