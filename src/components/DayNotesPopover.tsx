import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayNotesPopoverProps {
  date: string;
  therapist: string;
  currentNote?: {
    id: string;
    content: string | null;
  };
  onSave: (content: string) => void;
  onDelete?: (id: string) => void;
}

export function DayNotesPopover({
  date,
  therapist,
  currentNote,
  onSave,
  onDelete,
}: DayNotesPopoverProps) {
  const [content, setContent] = useState(currentNote?.content || "");
  const [isOpen, setIsOpen] = useState(false);
  const hasContent = !!currentNote?.content?.trim();

  useEffect(() => {
    setContent(currentNote?.content || "");
  }, [currentNote?.content]);

  const handleSave = () => {
    onSave(content);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (currentNote?.id && onDelete) {
      onDelete(currentNote.id);
      setContent("");
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0",
            hasContent
              ? "text-blue-500 hover:text-blue-600"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={hasContent ? "Ver/editar observação" : "Adicionar observação"}
        >
          <StickyNote className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="font-medium text-sm">
            Observações do dia
          </div>
          <Textarea
            placeholder="Digite observações para este dia..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] text-sm"
          />
          <div className="flex justify-between">
            {hasContent && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
