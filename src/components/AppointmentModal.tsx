import { useState } from "react";
import { Calendar as CalendarIcon, Clock, User, MapPin, FileText } from "lucide-react";
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

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment?: any;
  prefilledDate?: Date;
  prefilledTime?: string;
}

const therapists = ["Ana Falcão", "Cheila", "Grazii"];
const rooms = ["Sala 1", "Sala 2", "Sala 3"];
const durations = ["30min", "45min", "1h", "1h15", "1h30"];
const timeSlots = Array.from({ length: 50 }, (_, i) => {
  const totalMinutes = 7.5 * 60 + i * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export const AppointmentModal = ({ open, onClose, appointment, prefilledDate, prefilledTime }: AppointmentModalProps) => {
  const [date, setDate] = useState<Date | undefined>(prefilledDate || appointment?.date || new Date());
  const [time, setTime] = useState(prefilledTime || appointment?.time || "08:00");
  const [patient, setPatient] = useState(appointment?.patientName || "");
  const [therapist, setTherapist] = useState(appointment?.therapist || "");
  const [duration, setDuration] = useState(appointment?.duration || "1h");
  const [room, setRoom] = useState(appointment?.room || "");
  const [status, setStatus] = useState(appointment?.status || "pending");
  const [notes, setNotes] = useState(appointment?.notes || "");
  const [isFirstSession, setIsFirstSession] = useState(appointment?.isFirstSession || false);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState<Date | undefined>();

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

    // Aqui você salvaria no backend
    toast.success(appointment ? "Agendamento atualizado!" : "Agendamento criado!");
    onClose();
  };

  const handleBlock = () => {
    toast.success("Horário bloqueado!");
    onClose();
  };

  const handleCancel = () => {
    if (appointment) {
      toast.success("Agendamento cancelado!");
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Paciente */}
          <div className="grid gap-2">
            <Label htmlFor="patient" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente *
            </Label>
            <Input
              id="patient"
              placeholder="Buscar paciente..."
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              list="patients"
            />
            <datalist id="patients">
              <option value="Maria Silva" />
              <option value="João Santos" />
              <option value="Pedro Costa" />
              <option value="Ana Lima" />
              <option value="Carlos Mendes" />
            </datalist>
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

        <DialogFooter className="gap-2">
          {appointment ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Fechar
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancelar Horário
              </Button>
              <Button onClick={handleSave}>
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleBlock}>
                Bloquear Horário
              </Button>
              <Button onClick={handleSave}>
                Salvar Agendamento
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
