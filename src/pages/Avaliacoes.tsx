import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, User, Calendar, Filter, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReviews, useReviewsStats } from "@/hooks/useReviews";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";

const Avaliacoes = () => {
  const isMobile = useIsMobile();
  const [filtroEstrelas, setFiltroEstrelas] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  // Use real data from database
  const { data: reviews = [], isLoading: isLoadingReviews } = useReviews({
    rating: filtroEstrelas,
    search: busca
  });
  
  const { data: stats, isLoading: isLoadingStats } = useReviewsStats();

  const renderEstrelas = (quantidade: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index} 
        className={`w-4 h-4 ${
          index < quantidade 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-muted-foreground'
        }`} 
      />
    ));
  };

  if (isLoadingReviews || isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Avaliações" icon={Star} />}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Avaliações dos Clientes</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as avaliações dos seus clientes
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageRating || "0.0"}</div>
            <div className="flex items-center mt-1">
              {renderEstrelas(Math.round(parseFloat(stats?.averageRating || "0")))}
              <span className="text-xs text-muted-foreground ml-2">
                ({stats?.totalReviews || 0} avaliações)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <Star className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.satisfactionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              4+ estrelas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Estrelas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.distribution?.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm">{stars}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente, serviço ou comentário..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroEstrelas} onValueChange={setFiltroEstrelas}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as estrelas</SelectItem>
                <SelectItem value="5">5 estrelas</SelectItem>
                <SelectItem value="4">4 estrelas</SelectItem>
                <SelectItem value="3">3 estrelas</SelectItem>
                <SelectItem value="2">2 estrelas</SelectItem>
                <SelectItem value="1">1 estrela</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{review.client_name || 'Cliente'}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {renderEstrelas(review.rating)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">{review.service_name || 'Serviço'}</Badge>
                  {review.employee_name && (
                    <Badge variant="outline">Por: {review.employee_name}</Badge>
                  )}
                </div>
                {review.comment && (
                  <p className="text-muted-foreground">{review.comment}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-muted-foreground">
              Ajuste os filtros para ver mais avaliações
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Avaliacoes;