import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, CheckCircle, Calendar, Hash, User } from "lucide-react";
import { therapists } from "@/data/therapists";

interface HealthPlanAuthorizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  healthPlan?: string;
}

export function HealthPlanAuthorizationModal({
  open,
  onOpenChange,
  patientId,
  patientName,
  healthPlan = "Fusex",
}: HealthPlanAuthorizationModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    authorizationCode: "",
    authorizationDate: new Date().toISOString().split("T")[0],
    totalSessions: "10",
    validityDays: "90",
    therapist: "",
    notes: "",
  });

  // Buscar um pacote padrão para vincular
  const { data: availablePackages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("total_sessions");

      if (error) throw error;
      return data;
    },
  });

  const createAuthorization = useMutation({
    mutationFn: async () => {
      const totalSessions = parseInt(formData.totalSessions) || 10;
      const validityDays = parseInt(formData.validityDays) || 90;

      if (!formData.authorizationCode.trim()) {
        throw new Error("Informe o código da guia");
      }

      if (!formData.therapist) {
        throw new Error("Selecione a fisioterapeuta responsável");
      }

      // Calcular data de expiração
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + validityDays);

      // Encontrar pacote compatível ou usar null
      const matchingPackage = availablePackages.find(
        (p) => p.total_sessions === totalSessions
      );

      // Criar patient_package com os campos de autorização
      const { error } = await supabase.from("patient_packages").insert({
        patient_id: patientId,
        package_id: matchingPackage?.id || availablePackages[0]?.id || null,
        total_sessions: totalSessions,
        used_sessions: 0,
        purchase_price: 0, // Convênio não tem valor de compra
        expiration_date: expirationDate.toISOString().split("T")[0],
        status: "active",
        notes: formData.notes || `Guia de convênio ${healthPlan}`,
        authorization_code: formData.authorizationCode.trim(),
        authorization_date: formData.authorizationDate,
        health_plan: healthPlan,
        is_health_plan_authorization: true,
        therapist: formData.therapist,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["patient-packages", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-credits", patientId] });
      queryClient.invalidateQueries({ queryKey: ["active-package", patientId] });
      queryClient.invalidateQueries({ queryKey: ["all-patient-packages", patientId] });
      queryClient.invalidateQueries({ queryKey: ["health-plan-authorizations", patientId] });

      toast.success("📋 Guia de convênio registrada com sucesso!");
      onOpenChange(false);

      // Reset form
      setFormData({
        authorizationCode: "",
        authorizationDate: new Date().toISOString().split("T")[0],
        totalSessions: "10",
        validityDays: "90",
        therapist: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar guia");
      console.error(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Registrar Guia de Convênio - {healthPlan}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Código da Guia */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Código da Guia *
            </Label>
            <Input
              placeholder="Ex: 123456789"
              value={formData.authorizationCode}
              onChange={(e) =>
                setFormData({ ...formData, authorizationCode: e.target.value })
              }
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Código de autorização presente na guia do convênio
            </p>
          </div>

          {/* Data da Guia */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Data da Guia
            </Label>
            <Input
              type="date"
              value={formData.authorizationDate}
              onChange={(e) =>
                setFormData({ ...formData, authorizationDate: e.target.value })
              }
            />
          </div>

          {/* Sessões Autorizadas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sessões Autorizadas *</Label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={formData.totalSessions}
                onChange={(e) =>
                  setFormData({ ...formData, totalSessions: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Validade (dias)</Label>
              <Input
                type="number"
                min="1"
                placeholder="90"
                value={formData.validityDays}
                onChange={(e) =>
                  setFormData({ ...formData, validityDays: e.target.value })
                }
              />
            </div>
          </div>

          {/* Fisioterapeuta Responsável */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Fisioterapeuta Responsável *
            </Label>
            <Select
              value={formData.therapist}
              onValueChange={(v) => setFormData({ ...formData, therapist: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fisioterapeuta" />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((therapist) => (
                  <SelectItem key={therapist} value={therapist}>
                    {therapist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Fisioterapeuta que receberá pela guia
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Observações sobre a guia..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Resumo */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-2">Resumo</h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Paciente: {patientName}</li>
              <li>• Convênio: {healthPlan}</li>
              <li>• Código: {formData.authorizationCode || "-"}</li>
              <li>• Sessões: {formData.totalSessions || "10"}</li>
              <li>
                • Validade:{" "}
                {(() => {
                  const days = parseInt(formData.validityDays) || 90;
                  const expDate = new Date();
                  expDate.setDate(expDate.getDate() + days);
                  return expDate.toLocaleDateString("pt-BR");
                })()}
              </li>
              <li>• Fisioterapeuta: {formData.therapist || "-"}</li>
            </ul>
          </div>

          {/* Botão Confirmar */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => createAuthorization.mutate()}
            disabled={
              !formData.authorizationCode.trim() ||
              !formData.therapist ||
              createAuthorization.isPending
            }
          >
            {createAuthorization.isPending ? (
              "Registrando..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Registrar Guia de Convênio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
