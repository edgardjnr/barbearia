import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface LoyaltyLegendProps {
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
  vipThreshold: number;
}

export const LoyaltyLegend = ({ 
  bronzeThreshold, 
  silverThreshold, 
  goldThreshold, 
  vipThreshold 
}: LoyaltyLegendProps) => {
  const levels = [
    {
      name: "Bronze",
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      threshold: bronzeThreshold,
      description: "Nível inicial para novos clientes"
    },
    {
      name: "Silver",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      threshold: silverThreshold,
      description: "Cliente com engajamento regular"
    },
    {
      name: "Gold",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      threshold: goldThreshold,
      description: "Cliente valorizado e frequente"
    },
    {
      name: "VIP",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      threshold: vipThreshold,
      description: "Cliente premium de maior valor"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Níveis de Fidelidade
        </CardTitle>
        <CardDescription>
          Os níveis são baseados no total de pontos acumulados pelo cliente ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {levels.map((level, index) => (
            <div key={level.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={level.color}>
                  {level.name}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {level.threshold === 0 ? "0" : level.threshold === vipThreshold ? `${level.threshold}+` : `${level.threshold}+`} pts
                </div>
                <div className="text-xs text-muted-foreground">
                  {level.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};