import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type AppointmentStatus = "confirmed" | "pending" | "blocked" | "cancelled" | "free";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  status: AppointmentStatus;
  therapist: string;
  hasInvoice: boolean;
  notes?: string;
}

// Mock data
const mockAppointments: Record<string, Appointment[]> = {
  "2024-01-08": [
    {
      id: "1",
      patientName: "Maria Silva",
      time: "08:00",
      status: "confirmed",
      therapist: "Cheila",
      hasInvoice: true,
    },
    {
      id: "2",
      patientName: "João Santos",
      time: "09:00",
      status: "pending",
      therapist: "Ana Falcão",
      hasInvoice: false,
    },
  ],
  "2024-01-09": [
    {
      id: "3",
      patientName: "Pedro Costa",
      time: "10:00",
      status: "confirmed",
      therapist: "Grazii",
      hasInvoice: true,
    },
  ],
};

const therapists = ["TODAS", "Ana Falcão", "Cheila", "Grazii"];

const timeSlots = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(7.5 + i * 0.5);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

const getStatusColor = (status: AppointmentStatus) => {
  switch (status) {
    case "confirmed":
      return "bg-status-confirmed text-success-foreground";
    case "pending":
      return "bg-status-pending text-foreground";
    case "blocked":
      return "bg-status-blocked text-destructive-foreground";
    case "cancelled":
      return "bg-status-cancelled text-destructive-foreground line-through";
    default:
      return "bg-status-free hover:bg-muted";
  }
};

const Agenda = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTherapist, setSelectedTherapist] = useState("TODAS");
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Agenda Semanal</h1>
          <Button className="shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Week Navigator */}
        <Card className="p-4 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="shadow-soft"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">
                Semana de {format(weekDays[0], "dd/MM", { locale: ptBR })} a{" "}
                {format(weekDays[5], "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="shadow-soft"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Therapist Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {therapists.map((therapist) => (
            <Button
              key={therapist}
              variant={selectedTherapist === therapist ? "default" : "outline"}
              onClick={() => setSelectedTherapist(therapist)}
              className={cn(
                "whitespace-nowrap shadow-soft",
                selectedTherapist === therapist && "shadow-hover"
              )}
            >
              {therapist}
            </Button>
          ))}
        </div>

        {/* Legend */}
        <Card className="p-4 shadow-soft">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-confirmed" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-pending" />
              <span>A confirmar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-blocked" />
              <span>Bloqueado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-cancelled line-through" />
              <span>Cancelado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-free border border-border" />
              <span>Livre</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar Grid - Desktop */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-semibold text-sm w-24">Horário</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="p-3 text-center font-semibold text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          {format(day, "EEEEEE", { locale: ptBR })}
                        </span>
                        <span className="text-lg">{format(day, "dd/MM", { locale: ptBR })}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-t border-border">
                    <td className="p-2 text-sm text-muted-foreground font-medium">{time}</td>
                    {weekDays.map((day) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const appointment = mockAppointments[dateKey]?.find((a) => a.time === time);

                      return (
                        <td key={day.toISOString()} className="p-1">
                          {appointment ? (
                            <button
                              className={cn(
                                "w-full p-2 rounded-lg text-left text-xs transition-all hover:shadow-hover",
                                getStatusColor(appointment.status)
                              )}
                            >
                              <div className="font-semibold">{appointment.patientName}</div>
                              <div className="text-xs opacity-80">{appointment.therapist}</div>
                              {appointment.hasInvoice && <Badge variant="outline" className="mt-1 text-xs">NF</Badge>}
                            </button>
                          ) : (
                            <button className="w-full h-16 rounded-lg bg-status-free hover:bg-muted transition-colors border border-border/50" />
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
        {weekDays.map((day) => (
          <Card key={day.toISOString()} className="p-4 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">
              {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="space-y-2">
              {timeSlots.slice(0, 10).map((time) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const appointment = mockAppointments[dateKey]?.find((a) => a.time === time);

                return (
                  <div key={time} className="flex gap-2">
                    <div className="text-sm text-muted-foreground font-medium w-16">{time}</div>
                    {appointment ? (
                      <button
                        className={cn(
                          "flex-1 p-3 rounded-lg text-left transition-all",
                          getStatusColor(appointment.status)
                        )}
                      >
                        <div className="font-semibold">{appointment.patientName}</div>
                        <div className="text-sm opacity-80">{appointment.therapist}</div>
                      </button>
                    ) : (
                      <button className="flex-1 rounded-lg bg-status-free hover:bg-muted transition-colors border border-border/50" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Agenda;
