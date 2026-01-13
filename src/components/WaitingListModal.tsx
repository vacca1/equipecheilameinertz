import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WaitingListModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    patient_name: string;
    patient_id: string | null;
    preferred_time: string;
    notes: string;
  }) => void;
  patients: Array<{ id: string; name: string }>;
  date: string;
}

export function WaitingListModal({
  open,
  onClose,
  onAdd,
  patients,
  date,
}: WaitingListModalProps) {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [comboOpen, setComboOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    onAdd({
      patient_name: patientName,
      patient_id: patientId,
      preferred_time: preferredTime,
      notes,
    });

    // Reset form
    setPatientName("");
    setPatientId(null);
    setPreferredTime("");
    setNotes("");
  };

  const handlePatientSelect = (patient: { id: string; name: string }) => {
    setPatientName(patient.name);
    setPatientId(patient.id);
    setComboOpen(false);
  };

  const formattedDate = format(parseISO(date), "dd 'de' MMMM", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar à Lista de Espera</DialogTitle>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal"
                >
                  {patientName || "Selecione ou digite um paciente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar paciente..."
                    value={patientName}
                    onValueChange={(value) => {
                      setPatientName(value);
                      setPatientId(null);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {patientName ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setPatientId(null);
                            setComboOpen(false);
                          }}
                        >
                          Usar "{patientName}" (novo paciente)
                        </Button>
                      ) : (
                        "Nenhum paciente encontrado"
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {patients
                        .filter((p) =>
                          p.name.toLowerCase().includes(patientName.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((patient) => (
                          <CommandItem
                            key={patient.id}
                            value={patient.name}
                            onSelect={() => handlePatientSelect(patient)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                patientId === patient.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {patient.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredTime">Horário de Preferência</Label>
            <Input
              id="preferredTime"
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="Ex: 14:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a espera..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!patientName.trim()}>
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
