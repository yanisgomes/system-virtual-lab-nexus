
import { useState, useEffect } from "react";
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
  
  // Fetch logs data with improved error handling
  const { 
    data: logs = [], 
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
    isError: isLogsError
  } = useQuery({
    queryKey: ["routerLogs", viewLimit],
    queryFn: () => fetchLatestLogs(viewLimit),
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch statistics data with improved error handling
  const { 
    data: stats = [], 
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    isError: isStatsError
  } = useQuery({
    queryKey: ["interactionStats"],
    queryFn: fetchInteractionStatistics,
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Setup auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchLogs();
      refetchStats();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [refetchLogs, refetchStats]);

  // Show toast notification when data is refreshed
  const handleRefresh = () => {
    toast.info("Refreshing data...");
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
        <h1 className="text-3xl font-bold mb-8">Router Logs Dashboard</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            Failed to load data from the database. 
            {logsError && <p>{(logsError as Error).message}</p>}
            {statsError && <p>{(statsError as Error).message}</p>}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Router Logs Dashboard</h1>
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">View Options</h2>
        </div>
        <div className="flex space-x-4">
          <Select 
            value={viewLimit.toString()} 
            onValueChange={(val) => setViewLimit(parseInt(val))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show count" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Last 10 logs</SelectItem>
              <SelectItem value="20">Last 20 logs</SelectItem>
              <SelectItem value="50">Last 50 logs</SelectItem>
              <SelectItem value="100">Last 100 logs</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Log Entries ({logs.length})</TabsTrigger>
          <TabsTrigger value="stats">Statistics ({stats.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Router Log Entries</CardTitle>
              <CardDescription>
                {logsLoading ? "Loading logs..." : `Showing ${logs.length} most recent log entries`}
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
                  <AlertTitle>No logs found</AlertTitle>
                  <AlertDescription>
                    There are no log entries in the database yet. 
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Router logs from your network devices</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Source IP</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Time (s)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell className="whitespace-nowrap">{log.source_ip}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.log_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              <pre className="text-xs overflow-x-auto">
                                {formatContent(log.content)}
                              </pre>
                            </div>
                          </TableCell>
                          <TableCell>{log.time_seconds.toFixed(2)}</TableCell>
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
              <CardTitle>Interaction Statistics</CardTitle>
              <CardDescription>
                {statsLoading ? "Loading statistics..." : `Statistics summary for ${stats.length} interactions`}
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
                  <AlertTitle>No statistics found</AlertTitle>
                  <AlertDescription>
                    There are no interaction statistics in the database yet.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map((stat) => (
                    <Card key={stat.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 p-4">
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">{stat.log_type}</Badge>
                          <span className="text-sm text-gray-500">{stat.source_ip}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Interactions</span>
                          <span className="text-2xl font-bold">{stat.interaction_count}</span>
                        </div>
                        {stat.last_interaction && (
                          <div className="text-sm text-gray-500 mt-2">
                            Last activity: {formatTimestamp(stat.last_interaction)}
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
