import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useFinancialReport } from "@/hooks/useFinancialReport";
import { ReportFilters } from "@/components/ReportsFilters";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialReportProps {
  filters: ReportFilters;
}

const FinancialReport = ({ filters }: FinancialReportProps) => {
  const { services, totalRevenue, loading, error } = useFinancialReport(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generateExcel = () => {
    // Criar uma nova planilha
    const workbook = XLSX.utils.book_new();
    
    // Dados para a planilha
    const sheetData = [
      // Cabeçalho com informações do relatório
      ['Relatório Financeiro'],
      [''],
      // Período
      (() => {
        let periodText = 'Período: ';
        if (filters.startDate && filters.endDate) {
          periodText += `${format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })}`;
        } else if (filters.startDate) {
          periodText += `A partir de ${format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })}`;
        } else if (filters.endDate) {
          periodText += `Até ${format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })}`;
        } else {
          periodText += 'Todos os registros';
        }
        return [periodText];
      })(),
      [`Total Geral: ${formatCurrency(totalRevenue)}`],
      [''],
      // Cabeçalhos da tabela
      ['Serviço', 'Quantidade', 'Valor Médio', 'Total'],
      // Dados da tabela
      ...services.map(service => [
        service.service_name,
        service.total_count,
        service.average_value,
        service.total_value
      ]),
      [''],
      [`Relatório gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`]
    ];
    
    // Criar planilha
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Definir larguras das colunas
    worksheet['!cols'] = [
      { wch: 30 }, // Serviço
      { wch: 12 }, // Quantidade
      { wch: 15 }, // Valor Médio
      { wch: 15 }  // Total
    ];
    
    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Financeiro');
    
    // Baixar arquivo
    XLSX.writeFile(workbook, `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Relatório Financeiro
          </CardTitle>
          <CardDescription>
            Análise financeira detalhada dos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando dados financeiros...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Relatório Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Relatório Financeiro
            </CardTitle>
            <CardDescription>
              Análise financeira detalhada dos serviços
            </CardDescription>
          </div>
          <Button 
            onClick={generateExcel}
            className="flex items-center gap-2"
            disabled={services.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Baixar Planilha
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum dado financeiro encontrado para o período selecionado
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo Total */}
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Total Geral:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {formatCurrency(totalRevenue)}
                </Badge>
              </div>
            </div>

            {/* Tabela de Serviços */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Médio</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.service_id}>
                      <TableCell className="font-medium">
                        {service.service_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {service.total_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(service.average_value)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(service.total_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialReport;