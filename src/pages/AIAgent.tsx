import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";

const AIAgent = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-8 max-w-md text-center">
        <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Agente IA</h2>
        <p className="text-muted-foreground">
          Esta funcionalidade estará disponível em breve.
        </p>
      </Card>
    </div>
  );
};

export default AIAgent;
