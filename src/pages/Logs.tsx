
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  fetchLatestLogs, 
  fetchInteractionStatistics,
  RouterLog, 
  InteractionStatistic 
} from "@/services/log-service";
import { Json } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Logs = () => {
  const [viewLimit, setViewLimit] = useState<number>(20);
  
  // Fetch logs data
  const { 
    data: logs = [], 
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
    isError: isLogsError
  } = useQuery({
    queryKey: ["routerLogs", viewLimit],
    queryFn: () => fetchLatestLogs(viewLimit),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch statistics data
  const { 
    data: stats = [], 
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    isError: isStatsError
  } = useQuery({
    queryKey: ["interactionStats"],
    queryFn: () => fetchInteractionStatistics(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Show toast notification when data is refreshed
  const handleRefresh = () => {
    toast.info("Rafraîchissement des données...");
    refetchLogs();
    refetchStats();
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const formatContent = (content: Json) => {
    try {
      if (typeof content === 'string') {
        return content;
      }
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return String(content);
    }
  };

  if (isLogsError || isStatsError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">SysVL Nexus - Journal de diagnostic</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de connexion à la base de données</AlertTitle>
          <AlertDescription>
            Échec du chargement des données depuis la base de données.
            {logsError && <p>{(logsError as Error).message}</p>}
            {statsError && <p>{(statsError as Error).message}</p>}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="px-4 py-2 bg-academic-primary text-white rounded hover:bg-academic-accent">
          <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">SysVL Nexus - Journal de diagnostic</h1>
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Options d'affichage</h2>
        </div>
        <div className="flex space-x-4">
          <Select 
            value={viewLimit.toString()} 
            onValueChange={(val) => setViewLimit(parseInt(val))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nombre d'entrées" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 dernières entrées</SelectItem>
              <SelectItem value="20">20 dernières entrées</SelectItem>
              <SelectItem value="50">50 dernières entrées</SelectItem>
              <SelectItem value="100">100 dernières entrées</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            className="px-4 py-2 bg-academic-primary text-white rounded hover:bg-academic-accent flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Rafraîchir
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Entrées de journal ({logs.length})</TabsTrigger>
          <TabsTrigger value="stats">Statistiques ({stats.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Entrées de journal du système</CardTitle>
              <CardDescription>
                {logsLoading ? "Chargement des journaux..." : `Affichage des ${logs.length} entrées de journal les plus récentes`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : logs.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Aucun journal trouvé</AlertTitle>
                  <AlertDescription>
                    Il n'y a pas encore d'entrées de journal dans la base de données.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Journaux système du laboratoire virtuel</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Heure</TableHead>
                        <TableHead>IP source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contenu</TableHead>
                        <TableHead>Durée (s)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell className="whitespace-nowrap">{log.source_ip || log.source}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.log_type || log.level}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              <pre className="text-xs overflow-x-auto">
                                {formatContent(log.content || log.details || {})}
                              </pre>
                            </div>
                          </TableCell>
                          <TableCell>{log.time_seconds?.toFixed(2) || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques d'interaction</CardTitle>
              <CardDescription>
                {statsLoading ? "Chargement des statistiques..." : `Résumé des statistiques pour ${stats.length} interactions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Aucune statistique trouvée</AlertTitle>
                  <AlertDescription>
                    Il n'y a pas encore de statistiques d'interaction dans la base de données.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map((stat) => (
                    <Card key={stat.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 p-4">
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">
                            {stat.log_type || stat.interaction_type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {stat.source_ip || stat.student_id}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Interactions</span>
                          <span className="text-2xl font-bold">
                            {stat.interaction_count || stat.count}
                          </span>
                        </div>
                        {(stat.last_interaction) && (
                          <div className="text-sm text-gray-500 mt-2">
                            Dernière activité: {formatTimestamp(stat.last_interaction)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Logs;
