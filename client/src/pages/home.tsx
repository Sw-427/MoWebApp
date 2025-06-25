import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTimestamp, cn } from "@/lib/utils";
import { Bot, Phone, CreditCard, Crown, Play, MessageCircle, ExternalLink } from "lucide-react";
import type { Task, Message, TaskProgress, AgentStatus } from "@shared/schema";
import taskIds from "@assets/tasks_ids_1750829026136.json";

const samplePrompts = [
  "The last Venmo payment request I sent to Cory was an accident and they approved it. Send them the money back.",
  "I need to split the dinner bill with my roommate Alex. Send them $32.50 and text them about it.",
  "Check my recent Venmo transactions and call if there are any suspicious payments."
];

export default function Home() {
  const [prompt, setPrompt] = useState("The last Venmo payment request I sent to Cory was an accident and they approved it. Send them the money back.");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("60d0b5b_2");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    supervisor: "idle",
    phone: "idle",
    venmo: "idle"
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onerror = (error) => {
        console.log('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'taskProgress') {
            const progressData: TaskProgress = data.data;
            setProgress(progressData.progress);
            setAgentStatus(progressData.agentStatus);
            
            if (progressData.currentMessage) {
              setMessages(prev => {
                const newMessage = {
                  id: Date.now(),
                  taskId: progressData.taskId,
                  agent: progressData.currentMessage!.agent,
                  message: progressData.currentMessage!.message,
                  messageType: progressData.currentMessage!.messageType,
                  metadata: null,
                  timestamp: new Date(progressData.currentMessage!.timestamp)
                };
                
                // Avoid duplicate messages
                const exists = prev.some(msg => 
                  msg.agent === newMessage.agent && 
                  msg.message === newMessage.message &&
                  Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000
                );
                
                return exists ? prev : [...prev, newMessage];
              });
            }
          } else if (data.type === 'taskCompleted') {
            setIsProcessing(false);
            setTaskCompleted(true);
            setProgress(100);
            setAgentStatus({
              supervisor: "complete",
              phone: "complete",
              venmo: "complete"
            });
          } else if (data.type === 'taskError') {
            console.error('Task error:', data.data);
            setIsProcessing(false);
          }
        } catch (error) {
          console.log('WebSocket message parsing error:', error);
        }
      };
    };
    
    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Auto-scroll to bottom of conversation with smooth animation
  useEffect(() => {
    if (conversationRef.current) {
      const element = conversationRef.current;
      const scrollToBottom = () => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      };
      
      // Small delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  // Additional scroll trigger when processing state changes
  useEffect(() => {
    if (conversationRef.current && isProcessing) {
      const element = conversationRef.current;
      setTimeout(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [isProcessing]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: { prompt: string; taskId: string }) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: (task: Task) => {
      setCurrentTask(task);
      setMessages([]);
      setProgress(0);
      setIsProcessing(true);
      setTaskCompleted(false);
      setAgentStatus({
        supervisor: "idle",
        phone: "idle",
        venmo: "idle"
      });
    },
  });

  const handleProcessTask = () => {
    if (!prompt.trim() || !selectedTaskId || isProcessing) return;
    createTaskMutation.mutate({ prompt, taskId: selectedTaskId });
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'supervisor':
        return Crown;
      case 'phone':
      case 'phone_agent':
        return Phone;
      case 'venmo':
      case 'venmo_agent':
        return CreditCard;
      case 'user':
        return MessageCircle;
      default:
        return Bot;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'supervisor':
        return 'bg-blue-500';
      case 'phone':
      case 'phone_agent':
        return 'bg-amber-500';
      case 'venmo':
      case 'venmo_agent':
        return 'bg-violet-500';
      case 'user':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAgentName = (agent: string) => {
    switch (agent) {
      case 'supervisor':
        return 'Supervisor';
      case 'phone':
      case 'phone_agent':
        return 'Phone Agent';
      case 'venmo':
      case 'venmo_agent':
        return 'Venmo Agent';
      case 'user':
        return 'User';
      default:
        return 'Agent';
    }
  };

  const getMessageTypeClass = (messageType: string) => {
    switch (messageType) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'action':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'completion':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'processing':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'delegation':
        return 'border-l-4 border-purple-500 bg-purple-50';
      case 'input':
      case 'user_input':
        return 'border-l-4 border-gray-500 bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>;
      case 'complete':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Agent Interaction Simulator</h1>
                <p className="text-sm text-gray-500">Supervisor & Multi-Agent Coordination</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Input</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="taskId" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Task ID
                    </label>
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={isProcessing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a task ID..." />
                      </SelectTrigger>
                      <SelectContent>
                        {taskIds.map((taskId) => (
                          <SelectItem key={taskId} value={taskId}>
                            {taskId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your task prompt
                    </label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., The last Venmo payment request I sent to Cory was an accident and they approved it. Send them the money back."
                      className="h-32 resize-none"
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleProcessTask}
                    disabled={!prompt.trim() || !selectedTaskId || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingDots />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Process Task
                      </>
                    )}
                  </Button>

                  {/* Task Explorer Link */}
                  <div className="border-t border-gray-200 pt-4">
                    <a
                      href="https://appworld.dev/task-explorer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Task Details on AppWorld Explorer</span>
                    </a>
                  </div>

                  {/* Sample Prompts */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Sample Prompts</h3>
                    <div className="space-y-2">
                      {samplePrompts.map((samplePrompt, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(samplePrompt)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors duration-200"
                          disabled={isProcessing}
                        >
                          "{samplePrompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Flow */}
          <div className="lg:col-span-2">
            <Card className="h-[650px] flex flex-col">
              {/* Flow Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Agent Interaction Flow</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isProcessing ? "bg-blue-500 animate-pulse" : taskCompleted ? "bg-green-500" : "bg-gray-400"
                    )}></div>
                    <span>
                      {isProcessing ? "Calling external API..." : taskCompleted ? "Task completed" : "Ready for external API call"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agent Status Dashboard */}
              <div className="border-b border-gray-200 p-6">
                <div className="grid grid-cols-3 gap-6">
                  {(['supervisor', 'phone', 'venmo'] as const).map((agent) => {
                    const Icon = getAgentIcon(agent);
                    return (
                      <div key={agent} className="flex items-center space-x-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300",
                          getAgentColor(agent),
                          agentStatus[agent] === 'active' ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">{getAgentName(agent)}</h3>
                            {getAgentStatusIcon(agentStatus[agent])}
                          </div>
                          <p className="text-xs text-gray-500 capitalize">{agentStatus[agent]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Bar */}
                {isProcessing && (
                  <div className="mt-4">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
                  </div>
                )}
              </div>

              {/* Conversation Messages */}
              <div className="flex-1 overflow-hidden bg-gray-50">
                <div 
                  ref={conversationRef}
                  className="h-full overflow-y-auto scrollbar-thin px-4 py-6"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="space-y-4 max-w-4xl"
                >
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const Icon = getAgentIcon(message.agent);
                      return (
                        <motion.div
                          key={`${message.id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "p-4 rounded-lg shadow-sm border border-gray-100 max-w-full mx-2",
                            getMessageTypeClass(message.messageType)
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                              getAgentColor(message.agent)
                            )}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {getAgentName(message.agent)}
                                </h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                {message.message}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                    {messages.length === 0 && !isProcessing && (
                      <div className="text-center py-12 mx-2">
                        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Start</h3>
                        <p className="text-gray-500">Enter a prompt and click "Process Task" to begin the agent interaction simulation.</p>
                      </div>
                    )}

                    {isProcessing && messages.length === 0 && (
                      <div className="text-center py-12 mx-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <LoadingDots />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Task</h3>
                        <p className="text-gray-500">Agents are working on your request...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}