import { useState, useEffect, useMemo } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, Upload, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { therapists } from "@/data/therapists";
import { rooms } from "@/data/rooms";
import { useCreatePatient, useUpdatePatient, type Patient } from "@/hooks/usePatients";
import { supabase } from "@/integrations/supabase/client";

const patientSchema = z.object({
  // Dados Pessoais
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  birthDate: z.date({ required_error: "Data de nascimento é obrigatória" }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  phone1: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido"),
  mobilityLevel: z.enum(['severe', 'partial', 'none']).optional().default('none'),
  rg: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  insurance: z.string().optional(),
  discount: z.string().optional(),
  discountPercentage: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, "Porcentagem deve ser entre 1 e 100"),
  phone2: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  
  // Informações Clínicas
  requestingDoctor: z.string().optional(),
  medicalDiagnosis: z.string().optional(),
  previousPathologies: z.string().optional(),
  hvp: z.string().optional(),
  hvaQp: z.string().optional(),
  professionHobby: z.string().optional(),
  physicalExam: z.string().optional(),
  surgeries: z.string().optional(),
  medications: z.string().optional(),
  treatmentPlan: z.string().optional(),
  
  // Informações Operacionais
  specificRoom: z.string().optional(),
  scheduleFlexibility: z.boolean(),
  flexibilityNotes: z.string().optional(),
  billingDate: z.string().optional(),
  requiresInvoice: z.boolean(),
  mainTherapist: z.string().optional(),
  substituteTherapist: z.string().optional(),
  commissionPercentage: z.string().optional(),
  generalNotes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: any;
}

export function PatientFormModal({
  open,
  onOpenChange,
  patient,
}: PatientFormModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [birthDateText, setBirthDateText] = useState("");
  const [showDiscountPercentage, setShowDiscountPercentage] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<Patient[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  // Camada 2: Verificar CPF duplicado
  const checkDuplicateCPF = async (cpf: string, patientId?: string) => {
    if (!cpf || cpf.length < 14) return null;
    
    const { data } = await supabase
      .from('patients')
      .select('id, name')
      .eq('cpf', cpf);
    
    if (!data || data.length === 0) return null;
    
    // Se está editando, ignora o próprio registro
    if (patientId && data[0].id === patientId) return null;
    
    return data[0].name;
  };

  // Camada 3: Buscar nomes similares
  const searchSimilarNames = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (searchTerm: string) => {
        clearTimeout(timeoutId);
        
        if (searchTerm.length < 3) {
          setNameSuggestions([]);
          setShowSimilarWarning(false);
          return;
        }
        
        timeoutId = setTimeout(async () => {
          const { data } = await supabase
            .from('patients')
            .select('*')
            .ilike('name', `%${searchTerm}%`)
            .limit(5);
          
          if (data && data.length > 0) {
            setNameSuggestions(data as Patient[]);
            setShowSimilarWarning(true);
          } else {
            setNameSuggestions([]);
            setShowSimilarWarning(false);
          }
        }, 500);
      };
    },
    []
  );

  // Converter dados do paciente para o formato do formulário
  const getDefaultValues = () => {
    if (patient) {
      return {
        // Dados Pessoais
        name: patient.name || "",
        cpf: patient.cpf || "",
        birthDate: patient.birth_date ? new Date(patient.birth_date) : undefined,
        phone1: patient.phone || "",
        phone2: patient.emergency_contact || "",
        email: patient.email || "",
        mobilityLevel: patient.mobility_level || 'none',
        rg: patient.rg || "",
        cep: patient.cep || "",
        address: patient.address || "",
        city: patient.city || "",
        state: patient.state || "",
        number: patient.address_number || "",
        complement: patient.address_complement || "",
        
        // Convênio e Desconto
        insurance: patient.health_plan || "",
        discount: patient.discount || "",
        discountPercentage: patient.discount_percentage?.toString() || "",
        
        // Informações Clínicas
        requestingDoctor: patient.requesting_doctor || "",
        medicalDiagnosis: patient.diagnosis || "",
        previousPathologies: patient.previous_pathologies || "",
        hvp: "",
        hvaQp: "",
        professionHobby: "",
        physicalExam: patient.medical_report || "",
        surgeries: patient.surgeries || "",
        medications: patient.medications || "",
        treatmentPlan: patient.treatment_plan || "",
        
        // Informações Operacionais
        specificRoom: patient.specific_room || "",
        scheduleFlexibility: false,
        flexibilityNotes: patient.flexibility_notes || "",
        billingDate: patient.payment_day?.toString() || "",
        requiresInvoice: patient.invoice_delivery === "sim",
        mainTherapist: patient.main_therapist || "",
        substituteTherapist: patient.substitute_therapist || "",
        commissionPercentage: patient.commission_percentage?.toString() || "",
        generalNotes: patient.observations || "",
      };
    }
    return {
      name: "",
      cpf: "",
      rg: "",
      insurance: "",
      phone1: "",
      phone2: "",
      email: "",
      scheduleFlexibility: false,
      requiresInvoice: false,
      medicalDiagnosis: "",
      mainTherapist: "",
    };
  };

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: getDefaultValues(),
  });

  // Atualizar valores quando o paciente mudar
  React.useEffect(() => {
    if (open) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
      setUploadedFiles([]);
      
      // Controlar visibilidade do campo de porcentagem
      setShowDiscountPercentage(!!defaultValues.discount);

      // Inicializar texto da data de nascimento
      const birthDate = defaultValues.birthDate;
      if (birthDate instanceof Date && !isNaN(birthDate.getTime())) {
        setBirthDateText(format(birthDate, "dd/MM/yyyy"));
      } else {
        setBirthDateText("");
      }
    }
  }, [open, patient, form]);

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          form.setValue("address", data.logradouro);
          form.setValue("city", data.localidade);
          form.setValue("state", data.uf);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const maskCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const maskCep = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const onSubmit = (data: PatientFormData) => {
    const patientData = {
      // Dados Pessoais
      name: data.name,
      cpf: data.cpf,
      rg: data.rg || undefined,
      birth_date: format(data.birthDate, "yyyy-MM-dd"),
      phone: data.phone1,
      emergency_contact: data.phone2 || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      address_number: data.number || undefined,
      address_complement: data.complement || undefined,
      cep: data.cep || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      mobility_level: data.mobilityLevel || 'none',
      
      // Convênio e Desconto
      health_plan: data.insurance || undefined,
      discount: data.discount || undefined,
      discount_percentage: data.discountPercentage ? parseInt(data.discountPercentage) : undefined,
      
      // Informações Clínicas
      requesting_doctor: data.requestingDoctor || undefined,
      diagnosis: data.medicalDiagnosis || undefined,
      previous_pathologies: data.previousPathologies || undefined,
      medical_report: data.physicalExam || undefined,
      surgeries: data.surgeries || undefined,
      medications: data.medications || undefined,
      treatment_plan: data.treatmentPlan || undefined,
      
      // Informações Operacionais
      main_therapist: data.mainTherapist || "",
      substitute_therapist: data.substituteTherapist || undefined,
      specific_room: data.specificRoom || undefined,
      flexibility_notes: data.flexibilityNotes || undefined,
      payment_day: data.billingDate ? parseInt(data.billingDate) : undefined,
      commission_percentage: data.commissionPercentage ? parseInt(data.commissionPercentage) : undefined,
      invoice_delivery: data.requiresInvoice ? "sim" : "não",
      observations: data.generalNotes || undefined,
      status: "active",
    };

    if (patient?.id) {
      updatePatient.mutate({ id: patient.id, ...patientData });
    } else {
      createPatient.mutate(patientData);
    }
    
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {patient ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="flex w-full gap-1 overflow-x-auto scrollbar-hide">
                <TabsTrigger value="personal" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                  <span className="hidden sm:inline">Dados Pessoais</span>
                  <span className="sm:hidden">Pessoais</span>
                </TabsTrigger>
                <TabsTrigger value="clinical" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                  <span className="hidden sm:inline">Informações Clínicas</span>
                  <span className="sm:hidden">Clínicos</span>
                </TabsTrigger>
                <TabsTrigger value="operational" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">Operacional</TabsTrigger>
              </TabsList>

              {/* SEÇÃO 1: DADOS PESSOAIS */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o nome completo" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              searchSimilarNames(e.target.value);
                            }}
                          />
                        </FormControl>
                        
                        {showSimilarWarning && nameSuggestions.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>⚠️ Atenção: Pacientes similares encontrados</AlertTitle>
                            <AlertDescription className="space-y-2">
                              <p className="text-sm">Verifique se não é um destes:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {nameSuggestions.map(p => (
                                  <li key={p.id} className="text-sm">
                                    <strong>{p.name}</strong> - CPF: {p.cpf || 'Não informado'}
                                  </li>
                                ))}
                              </ul>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSimilarWarning(false)}
                              >
                                Continuar mesmo assim
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="dd/mm/aaaa"
                              value={birthDateText}
                              onChange={(e) => {
                                const value = e.target.value;

                                // Máscara simples dd/mm/aaaa
                                const masked = value
                                  .replace(/\D/g, "")
                                  .replace(/(\d{2})(\d)/, "$1/$2")
                                  .replace(/(\d{2}\/\d{2})(\d)/, "$1/$2")
                                  .slice(0, 10);

                                setBirthDateText(masked);

                                // Quando completar 10 caracteres, tenta converter para Date
                                if (masked.length === 10) {
                                  const [day, month, year] = masked.split("/");
                                  const parsed = new Date(
                                    Number(year),
                                    Number(month) - 1,
                                    Number(day),
                                  );

                                  if (!isNaN(parsed.getTime())) {
                                    field.onChange(parsed);
                                  } else {
                                    // Se inválida, zera o campo para deixar o zod reclamar
                                    field.onChange(undefined as unknown as Date);
                                  }
                                }
                              }}
                              onBlur={() => {
                                // Se saiu do campo sem data completa, considera inválido
                                if (birthDateText.length !== 10) {
                                  field.onChange(undefined as unknown as Date);
                                }
                              }}
                            />
                          </FormControl>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="px-3 shrink-0"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  // Quando escolher no calendário, atualiza o Date e o texto
                                  field.onChange(date as Date);
                                  if (date) {
                                    setBirthDateText(format(date, "dd/MM/yyyy"));
                                  }
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                captionLayout="dropdown-buttons"
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormDescription className="text-xs">
                          Digite a data ou use o calendário
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            {...field}
                            onChange={(e) => field.onChange(maskCpf(e.target.value))}
                            onBlur={async () => {
                              const existingPatient = await checkDuplicateCPF(field.value, patient?.id);
                              if (existingPatient) {
                                setCpfError(`CPF já cadastrado para: ${existingPatient}`);
                                form.setError('cpf', {
                                  type: 'manual',
                                  message: `CPF já cadastrado para: ${existingPatient}`
                                });
                              } else {
                                setCpfError(null);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o RG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Convênio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o convênio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Particular">Particular</SelectItem>
                            <SelectItem value="Fusex">Fusex</SelectItem>
                            <SelectItem value="Cabergs">Cabergs</SelectItem>
                            <SelectItem value="Cass">Cass</SelectItem>
                            <SelectItem value="IBCM">IBCM</SelectItem>
                            <SelectItem value="AFMU">AFMU</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setShowDiscountPercentage(!!value);
                            if (!value) {
                              form.setValue("discountPercentage", "");
                            }
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o desconto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Angelus">Angelus</SelectItem>
                            <SelectItem value="Unimed">Unimed</SelectItem>
                            <SelectItem value="Vida Card">Vida Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showDiscountPercentage && (
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porcentagem de Desconto (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="Ex: 10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000-000"
                            {...field}
                            onChange={(e) => field.onChange(maskCep(e.target.value))}
                            onBlur={(e) => handleCepBlur(e.target.value)}
                          />
                        </FormControl>
                        {loadingCep && <p className="text-sm text-muted-foreground">Buscando...</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="Nº" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Bloco..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone 1 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone 2</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobilityLevel"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Dificuldade de Locomoção</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o nível" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma dificuldade de locomoção</SelectItem>
                            <SelectItem value="partial">Dificuldade de locomoção parcial</SelectItem>
                            <SelectItem value="severe">Dificuldade de locomoção severa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* SEÇÃO 2: INFORMAÇÕES CLÍNICAS */}
              <TabsContent value="clinical" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="requestingDoctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médico Solicitante</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do médico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicalDiagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico Médico *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o diagnóstico médico"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previousPathologies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patologias Prévias</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Liste patologias anteriores"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hvp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HVP (História da Vida Pregressa)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a história pregressa"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hvaQp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HVA e QP (História Atual e Queixa Principal)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a história atual e queixa principal"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professionHobby"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão e Hobby</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Profissão e hobbies do paciente"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="physicalExam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exame Físico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o exame físico"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Exames Complementares</FormLabel>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arraste arquivos ou clique para fazer upload
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedFiles((prev) => [...prev, ...files.map((f) => f.name)]);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-secondary rounded-md"
                        >
                          <span className="text-sm">{file}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="surgeries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cirurgias</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Liste cirurgias realizadas"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicamentos em Uso</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Liste medicamentos atuais"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tratamento Indicado e Evolução Esperada</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o plano de tratamento e evolução"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* SEÇÃO 3: INFORMAÇÕES OPERACIONAIS */}
              <TabsContent value="operational" className="space-y-4 mt-4">
                <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-4">
                  <FormField
                    control={form.control}
                    name="specificRoom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Necessidade de Sala Específica</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a sala" />
                            </SelectTrigger>
                          </FormControl>
                      <SelectContent>
                        <SelectItem value="nenhuma">Nenhuma preferência</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room} value={room.toLowerCase().replace(" ", "")}>
                            {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduleFlexibility"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Liberdade de Horários para Tratamento
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("scheduleFlexibility") && (
                    <FormField
                      control={form.control}
                      name="flexibilityNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações sobre Flexibilidade</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva as condições de flexibilidade"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="billingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Específica para Cobrança</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Dia do mês (1-31) ou deixe em branco"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresInvoice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-primary p-4 bg-primary/10">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-bold">
                            Requer Nota Fiscal
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="scale-125"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mainTherapist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fisioterapeuta Padrão *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a fisioterapeuta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {therapists.map((therapist) => (
                              <SelectItem key={therapist} value={therapist}>
                                {therapist}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="substituteTherapist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fisioterapeuta Substituta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a substituta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="nenhuma">Nenhuma</SelectItem>
                            <SelectItem value="qualquer">Qualquer uma</SelectItem>
                            {therapists.map((therapist) => (
                              <SelectItem key={therapist} value={therapist}>
                                {therapist}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commissionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porcentagem de Repasse (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Ex: 60"
                              {...field}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="generalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais relevantes"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Paciente
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
