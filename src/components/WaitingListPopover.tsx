import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, Clock, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaitingListItem } from "@/hooks/useWaitingList";
import { WaitingListModal } from "./WaitingListModal";

interface WaitingListPopoverProps {
  date: string;
  therapist: string;
  items: WaitingListItem[];
  onAdd: (item: Omit<WaitingListItem, "id" | "created_at" | "updated_at">) => void;
  onRemove: (id: string) => void;
  onSchedule: (item: WaitingListItem) => void;
  patients?: Array<{ id: string; name: string }>;
}

export function WaitingListPopover({
  date,
  therapist,
  items,
  onAdd,
  onRemove,
  onSchedule,
  patients = [],
}: WaitingListPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const count = items.length;

  const handleAddPatient = (data: {
    patient_name: string;
    patient_id: string | null;
    preferred_time: string;
    notes: string;
  }) => {
    onAdd({
      date,
      therapist: therapist !== "Todos" ? therapist : null,
      patient_name: data.patient_name,
      patient_id: data.patient_id,
      preferred_time: data.preferred_time || null,
      notes: data.notes || null,
      priority: 0,
      status: "waiting",
    });
    setShowAddModal(false);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 gap-1 px-1.5",
              count > 0
                ? "text-amber-600 hover:text-amber-700"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={count > 0 ? `${count} na lista de espera` : "Lista de espera vazia"}
          >
            <Users className="h-4 w-4" />
            {count > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-amber-100 text-amber-700">
                {count}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lista de Espera
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhum paciente na lista de espera
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {item.patient_name}
                      </div>
                      {item.preferred_time && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Preferência: {item.preferred_time}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-primary"
                        onClick={() => onSchedule(item)}
                        title="Agendar"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => onRemove(item.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <WaitingListModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPatient}
        patients={patients}
        date={date}
      />
    </>
  );
}
