//AI assisted code
"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Upload, Leaf, MapPin, Receipt, Loader2, History, Plus, Edit2, 
  Trash2, X, ChevronDown, ChevronUp, Save, BarChart3, Settings2, 
  PieChart as PieChartIcon, BrainCircuit, User, LogOut, Settings, Camera, Image as ImageIcon, RotateCcw, Check,
  TrendingUp, Lightbulb, LineChart as LineChartIcon, Search, Filter, Download, Trophy, MessageSquare, Send, Users, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 2 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800;
    let startTime: number | null = null;

    const animate = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(start + (end - start) * easeOutQuart);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

function HomeContent() {
  const supabase = createClient();
  const { setTheme } = useTheme();
  const searchParams = useSearchParams();
  const tid = searchParams.get("tid");
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner" | "friends">("scanner");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showScanOptions, setShowScanOptions] = useState(false);
  
  // 摄像头相关状态
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Data States
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState({ 
    monthly_income: 0, saving_goal: 0, scheduled_expenses: 0, username: "", avatar_url: "", 
    last_analysis_date: "", last_analysis_text: "", theme: "system", 
    font_size: "base",
    gradient_type: "linear",
    gradient_direction: "to bottom right",
    gradient_stops: [{ color: "#ffffff", position: 0 }, { color: "#f3f4f6", position: 100 }] as {color: string, position: number}[]
  });
  const [data, setData] = useState<any>(null); // Last scan result
  const [scanError, setScanError] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Friends & Messaging State
  const [friendsData, setFriendsData] = useState<any[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messageContent, setMessageContent] = useState("");
  const [isNudgesModalOpen, setIsNudgesModalOpen] = useState(false);

  // Cursor Following Fluid Shape Refs
  const blobRef = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const blobPos = useRef({ x: 0, y: 0 });
  const blob2Pos = useRef({ x: 0, y: 0 });

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState("all");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const defaultForm = {
    store_name: "", total_amount: "", expense_type: "", description: "", 
    eco_score: 50, is_local_business: false, items: [] as any[], color: "#10b981",
    payment_method: "",
    created_at: "",
    image_urls: [] as string[]
  };
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { 
    setMounted(true);
    const init = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (authUser && !error) {
        setCurrentUserId(authUser.id);
        fetchHistory(); 
        fetchProfile(authUser.id);
        fetchFriendsData(authUser.id);
        fetchMessages(authUser.id);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    let frameId: number;
    const animate = () => {
      // Smooth interpolation (lerp)
      const easing = 0.06; // Adjust for smoothness (lower = slower/smoother)
      blobPos.current.x += (mousePos.current.x - blobPos.current.x) * easing;
      blobPos.current.y += (mousePos.current.y - blobPos.current.y) * easing;
      
      blob2Pos.current.x += (mousePos.current.x - blob2Pos.current.x) * (easing * 0.5);
      blob2Pos.current.y += (mousePos.current.y - blob2Pos.current.y) * (easing * 0.5);

      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${blobPos.current.x - 250}px, ${blobPos.current.y - 250}px)`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate(${blob2Pos.current.x - 150}px, ${blob2Pos.current.y - 150}px)`;
      }

      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [mounted]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    };
  }, [notification]);

  // --- Financial Calculations (Moved up to fix initialization ReferenceError) ---
  const totalSpent = history.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const remainingBudget = profile.monthly_income - profile.scheduled_expenses - profile.saving_goal - totalSpent;

  const avgEcoScore = history.length > 0 
    ? Math.round(history.reduce((sum, r) => sum + (r.eco_score || 0), 0) / history.length) 
    : 0;

  // Update user's own competition stats in the profile
  useEffect(() => {
    if (!mounted || history.length === 0 || !currentUserId) return;
    
    const syncStats = async () => {
      await supabase.from("profiles").update({
        avg_eco_score: avgEcoScore,
        total_spent_current_month: totalSpent
      }).eq("id", currentUserId);
    };
    
    syncStats();
  }, [history, avgEcoScore, totalSpent, currentUserId]);

  const fetchHistory = async () => {
    const { data } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
    setHistory(data || []);
  };

  const fetchProfile = async (userId?: string | any) => {
    const id = typeof userId === 'string' ? userId : currentUserId;
    if (!id) return;

    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (data && !error) {
      setProfile(data);
      
      // Sync theme preference with next-themes on mount
      if (data.theme && data.theme !== "custom") {
        setTheme(data.theme);
      }

      if (data.last_analysis_text) setAiAdvice(JSON.parse(data.last_analysis_text));
      
      // Automatically request analysis every day
      const lastDate = data.last_analysis_date ? new Date(data.last_analysis_date).toDateString() : "";
      if (lastDate !== new Date().toDateString()) {
        requestAiAdvice(data);
      }
    }
  };

  // --- Appearance & Theme Handling ---
  useEffect(() => {
    if (!mounted) return;
    
    // Only manage the 'custom' class manually. 
    // next-themes handles light/dark/system automatically via RootLayout.
    const root = document.documentElement;
    if (profile.theme === "custom") root.classList.add("custom");
    else root.classList.remove("custom");

    // Apply Font Size
    const sizes: Record<string, string> = { sm: "14px", base: "16px", lg: "18px", xl: "20px" };
    root.style.fontSize = sizes[profile.font_size] || "16px";
  }, [profile.theme, profile.font_size, mounted]);

  // Helper to build gradient string
  const getGradientStyle = () => {
    if (profile.theme !== "custom") return undefined;
    const stops = [...profile.gradient_stops]
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');
    
    if (profile.gradient_direction === 'radial') {
      return `radial-gradient(circle at center, ${stops})`;
    }
    return `linear-gradient(${profile.gradient_direction}, ${stops})`;
  };

  const fetchMessages = async (userId: string) => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, created_at, sender:sender_id(id, username, avatar_url)")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setReceivedMessages(data || []);
    }
  };

  const fetchFriendsData = async (userId?: string | any) => {
    const id = typeof userId === 'string' ? userId : (currentUserId || null);
    if (!id || typeof id !== 'string') {
      console.warn("fetchFriendsData: No valid User ID found");
      return;
    }

    // 1. Get IDs of all confirmed friends
    const { data: friends, error: friendsErr } = await supabase
      .from("friends")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${id},user2_id.eq.${id}`);

    if (friendsErr) {
      console.error("Error fetching friends list:", friendsErr);
      return;
    }

    if (friends) {
      // Map to get the ID of the 'other' person in each friendship
      const friendIds = friends
        .map((f: any) => f.user1_id === id ? f.user2_id : f.user1_id)
        .filter((fid: any) => typeof fid === 'string' && fid.length > 0);
      
      const uniqueIds = Array.from(new Set([id, ...friendIds]));

      // 2. Fetch profiles for self and friends for leaderboard
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, avg_eco_score, total_spent_current_month")
        .in("id", uniqueIds);

      if (profilesErr) {
        console.error("Error fetching friend profiles:", JSON.stringify(profilesErr, null, 2));
      } else if (profiles) {
        const mapped = profiles.map(p => ({
            ...p,
            isSelf: p.id === id,
            score: p.avg_eco_score || 0
          }));
        // Sort by eco score descending
        const sorted = [...mapped].sort((a, b) => b.score - a.score);
        setFriendsData(sorted);
      }
    }
  };

  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedFriend) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedFriend.id,
      content: messageContent
    });

    if (error) {
      console.error("Message send error:", error);
      setNotification({ message: `Failed to send message: ${error.message}`, type: "error" });
    } else {
      setNotification({ message: `Encouragement sent to ${selectedFriend.username}!`, type: "success" });
      setMessageContent("");
      setIsMessageModalOpen(false);
    }
  };

  // Calculate Budget Progress Percentage
  let budgetProgressPercentage: number | string = 0;
  let isBudgetProgressOver = false;
  let displayBudgetProgress = "0%";

  if (mounted) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDayOfMonth = now.getDate(); // 1-31
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Total days in current month

    const monthlyNetIncome = profile.monthly_income - profile.scheduled_expenses;

    if (monthlyNetIncome > 0 && daysInMonth > 0) {
      const proportionalBudget = monthlyNetIncome * (currentDayOfMonth / daysInMonth);
      if (proportionalBudget > 0) {
        budgetProgressPercentage = (totalSpent / proportionalBudget) * 100;
      } else if (totalSpent > 0) {
        budgetProgressPercentage = "Over Budget"; // Spent money but no proportional budget
      }
    } else if (totalSpent > 0) {
      budgetProgressPercentage = "Over Budget"; // No positive net income, but there are expenses
    }

    displayBudgetProgress = typeof budgetProgressPercentage === 'number' ? `${budgetProgressPercentage.toFixed(0)}%` : budgetProgressPercentage;
    isBudgetProgressOver = typeof budgetProgressPercentage === 'number' ? budgetProgressPercentage > 100 : budgetProgressPercentage === "Over Budget";
  }

  // Prepare Line Chart Data (Expenses vs Proportional Budget)
  const getLineChartData = () => {
    if (!mounted) return [];
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyNetIncome = profile.monthly_income - profile.scheduled_expenses;
    const dailyBudget = monthlyNetIncome / daysInMonth;
    
    const data = [];
    let cumulativeSpent = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const dayExpenses = history.filter(r => {
        const d = new Date(r.created_at);
        return d.getDate() === day && d.getMonth() === now.getMonth();
      });
      
      cumulativeSpent += dayExpenses.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      
      data.push({
        day: dayStr,
        spent: cumulativeSpent,
        budget: dailyBudget * day
      });
    }
    return data;
  };
  
  const expenseTypeData = Object.values(history.reduce((acc: any, curr) => {
    const type = curr.expense_type || "Uncategorized";
    if (!acc[type]) acc[type] = { name: type, value: 0, color: curr.color || "#10b981" };
    acc[type].value += curr.total_amount;
    return acc;
  }, {}));

  const paymentMethodData = Object.values(history.reduce((acc: any, curr) => {
    const method = curr.payment_method || "Unspecified";
    if (!acc[method]) acc[method] = { name: method, value: 0 };
    acc[method].value += curr.total_amount;
    return acc;
  }, {}));

  const colorTagData = Object.values(history.reduce((acc: any, curr) => {
    const color = curr.color || "#10b981";
    if (!acc[color]) acc[color] = { name: "Tag Group", value: 0, color: color };
    acc[color].value += curr.total_amount;
    return acc;
  }, {}));

  // Aggregation helper for items
  const getAggregatedItems = (items: any[] = []) => {
    const grouped = items.reduce((acc: any, item: any) => {
      const name = item.name || "Unknown";
      if (!acc[name]) acc[name] = { ...item, quantity: item.quantity || 1, totalPrice: item.price || 0 };
      else {
        acc[name].quantity += (item.quantity || 1);
        acc[name].totalPrice += (item.price || 0);
      }
      return acc;
    }, {});
    return Object.values(grouped);
  };

  const filteredHistory = history.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    switch (searchScope) {
      case "store": return r.store_name?.toLowerCase().includes(term);
      case "category": return r.expense_type?.toLowerCase().includes(term);
      case "item": return r.items?.some((i: any) => i.name?.toLowerCase().includes(term));
      case "price": return r.total_amount?.toString().includes(term);
      case "payment": return r.payment_method?.toLowerCase().includes(term);
      case "description": return r.description?.toLowerCase().includes(term);
      case "tag": return r.color?.toLowerCase().includes(term);
      default: // "all"
        return (
          r.store_name?.toLowerCase().includes(term) || 
          r.expense_type?.toLowerCase().includes(term) ||
          r.items?.some((i: any) => i.name?.toLowerCase().includes(term)) ||
          r.description?.toLowerCase().includes(term) ||
          r.payment_method?.toLowerCase().includes(term)
        );
    }
  });

  const exportToCSV = () => {
    const headers = ["Date,Store,Amount,Category,Eco Score\n"];
    const rows = history.map(r => `${new Date(r.created_at).toLocaleDateString()},"${r.store_name}",${r.total_amount},"${r.expense_type}",${r.eco_score}`);
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eco-budget-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const analyzeImage = async (base64: string) => {
    setScanError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        setNotification({ message: "Invalid server response. Please check your Gemini API key in settings.", type: "error" });
        return;
      }

      if (!res.ok) {
        const message = result?.error || "Receipt analysis failed. Please check your Gemini API key.";
        setNotification({ message, type: "error" });
        setScanError(message);
        return;
      }
      setData(result);

      // Save result to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: saveError } = await supabase.from("receipts").insert({
          user_id: user.id,
          store_name: result.storeName || "Unknown Store",
          total_amount: result.totalAmount || 0,
          expense_type: result.category || "Scanned",
          is_local_business: result.isLocalBusiness || false,
          description: result.ecoTip || "",
          items: result.items || [],
          eco_score: result.ecoScore ?? 50,
          color: "#10b981",
        });
        if (saveError) console.error("Error saving scan to history:", saveError);
      }

      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setScanError(err?.message || "Receipt analysis failed.");
    } finally {
      setLoading(false);
      setIsCameraActive(false);
      setCapturedImage(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await analyzeImage(base64);
    };
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setShowScanOptions(false);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setScanError("Cannot access camera. Please allow camera permissions and try again.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      
      // Stop camera stream after capturing
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleAdditionalImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    try {
      const uploadedUrls = [...(formData.image_urls || [])];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `manual-entries/${fileName}`;

        // Note: Ensure a bucket named 'receipts' exists in your Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("receipts").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
      setFormData({ ...formData, image_urls: uploadedUrls });
    } catch (err) {
      console.error("Error uploading images:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeManualExpense = async (e?: React.MouseEvent) => {
    console.log("AI Score button clicked", { formData });
    if (e) e.preventDefault();
    if (!formData.store_name && !formData.description) {
      console.log("Missing store_name and description, aborting");
      return;
    }
    setLoading(true);
    try {
      const payload = { 
        storeName: formData.store_name,
        totalAmount: parseFloat(formData.total_amount as string) || 0,
        description: formData.description,
        items: formData.items
      };
      console.log("Sending to /public/analyze:", payload);
      
      const res = await fetch("/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        setNotification({ message: "Invalid AI response. Please check your Gemini API key in settings.", type: "error" });
        return;
      }

      console.log("AI Analysis response:", result, "Status:", res.status);
      
      if (res.ok && result.ecoScore !== undefined) {
        console.log("Successfully got ecoScore:", result.ecoScore);
        setFormData(prev => {
          const updated = {
            ...prev,
            eco_score: result.ecoScore,
            expense_type: result.category || prev.expense_type,
            description: result.ecoTip ? (prev.description ? `${prev.description}\n\nTip: ${result.ecoTip}` : result.ecoTip) : prev.description
          };
          return updated;
        });
      } else {
        console.error("AI Analysis failed or missing ecoScore:", result);
        setNotification({ message: result.error || "Failed to generate eco-score", type: "error" });
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setNotification({ message: "Error analyzing expense", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const requestAiAdvice = async (p = profile) => {
    setLoading(true);
    try {
      const res = await fetch("/public/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "spending_summary",
          history: history.slice(0, 20), // Top 20 for context
          budgetInfo: { 
            income: p.monthly_income, 
            expenses: p.scheduled_expenses, 
            goal: p.saving_goal 
          }
        }),
      });

      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        setNotification({ message: "Could not parse AI advice. Check your Gemini API key.", type: "error" });
        return;
      }

      if (res.ok) {
        setAiAdvice(result);
      } else {
        setNotification({ message: result?.error || "Could not get AI advice.", type: "error" });
      }
    } catch (err) {
      console.error("Advice request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      className="relative min-h-screen p-4 md:p-8 pb-24 transition-all duration-500 bg-background overflow-hidden"
      style={{ background: profile.theme === "custom" ? getGradientStyle() : undefined }}
    >
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500 group">
          <div className={`glass px-6 py-3 rounded-2xl flex items-center gap-3 border-l-4 shadow-2xl ${notification.type === 'error' ? 'border-destructive' : 'border-emerald-500'}`}>
            {notification.type === 'error' ? <X className="w-4 h-4 text-destructive" /> : <Check className="w-4 h-4 text-emerald-500" />}
            <p className="text-sm font-bold">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-layered Tahoe Ambient Shapes */}
      <div 
        ref={blobRef}
        className="fixed top-0 left-0 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none z-0 will-change-transform animate-pulse"
        style={{ 
          opacity: mounted ? 1 : 0,
          transition: 'opacity 2s ease',
          animationDuration: '8s'
        }}
      />
      <div 
        ref={blob2Ref}
        className="fixed top-0 left-0 w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-[80px] pointer-events-none z-0 will-change-transform"
        style={{ 
          opacity: mounted ? 1 : 0,
          transition: 'opacity 3s ease',
          animation: 'spin 12s linear infinite'
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Eco-Budgeter</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-2 mr-4">
              <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>Dashboard</Button>
              <Button variant={activeTab === "scanner" ? "default" : "outline"} onClick={() => setActiveTab("scanner")}>Scanner</Button>
              <Button variant={activeTab === "friends" ? "default" : "outline"} onClick={() => setActiveTab("friends")}>Friends</Button>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold leading-none">{profile.username || (currentUserId ? "Set Username" : "Guest User")}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {currentUserId ? `Avg Score: ${avgEcoScore}` : "Sign in to compete"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border bg-muted overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 py-1 animate-in fade-in zoom-in-95">
                  {currentUserId && (
                    <Link href={`/settings${tid ? `?tid=${tid}` : ""}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full transition-colors">
                      <Settings className="w-4 h-4" /> Edit Profile
                    </Link>
                  )}
                  <Link href="/auth/login" target="_blank" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full transition-colors">
                    <UserPlus className="w-4 h-4" /> {currentUserId ? "Switch Account" : "Log In"}
                  </Link>
                  {currentUserId && (
                    <button 
                      onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === "dashboard" ? (
          <div key="dashboard" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both">
            {/* Budget Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Net Income", val: profile.monthly_income - profile.scheduled_expenses, prefix: "$" },
                { label: "Total Spent", val: totalSpent, prefix: "$", color: "text-red-500" },
                { label: "Savings Goal", val: profile.saving_goal, prefix: "$", color: "text-blue-500" },
                { label: "Budget Left", val: remainingBudget, prefix: "$", color: remainingBudget < 0 ? "text-red-500" : "text-green-500" },
                { label: "Budget Progress", val: typeof budgetProgressPercentage === 'number' ? budgetProgressPercentage : 0, suffix: "%", color: isBudgetProgressOver ? "text-red-500" : "text-green-500", decimals: 0 },
                { label: "Avg Eco-Score", val: avgEcoScore, suffix: "/100", color: "text-emerald-700 dark:text-emerald-400", decimals: 0, bg: "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10" }
              ].map((stat, i) => (
                <Card key={i} className={`glass rounded-2xl cursor-default ${stat.bg || ""} animate-in fade-in slide-in-from-bottom-4 duration-700`} style={{ animationDelay: `${i * 100}ms` }}>
                  <CardContent className="p-5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color || ""}`}>
                      <AnimatedNumber value={stat.val} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <div className="flex justify-between items-center mb-6">
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Spending vs. Budget Timeline</CardTitle>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getLineChartData()}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="day" fontSize={12} tickMargin={10} />
                    <YAxis fontSize={12} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="spent" 
                      name="Total Spent" 
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="budget" 
                      name="Ideal Budget" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 glass rounded-3xl overflow-hidden animate-in fade-in slide-in-from-left-8 duration-1000 delay-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" /> AI Insights & Advice
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => requestAiAdvice()} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {aiAdvice ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="text-center">
                        <p className="text-xs font-bold text-primary uppercase mb-1">Financial Status</p>
                        <p className="text-2xl font-bold text-primary">{aiAdvice.status}</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{aiAdvice.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {aiAdvice.recommendations?.map((rec: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 text-xs border-l-4 border-primary">
                            {rec}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                        <p className="text-xs font-bold text-primary uppercase">Estimated Savings Potential</p>
                        <p className="text-lg font-bold">{aiAdvice.savingPotential}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      Click refresh to generate your daily financial insight.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass rounded-3xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Category</CardTitle></CardHeader>
                <CardContent className="h-48">
                  {expenseTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                          {expenseTypeData.map((entry: any, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass rounded-3xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Payment Method</CardTitle></CardHeader>
                <CardContent className="h-48">
                  {paymentMethodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                          {paymentMethodData.map((entry: any, index) => (
                            <Cell key={index} fill={["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"][index % 5]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      No data yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass rounded-3xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Color Tags</CardTitle></CardHeader>
                <CardContent className="h-48">
                  {colorTagData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={colorTagData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                          {colorTagData.map((entry: any, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      No data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-1">
              <Card className="bg-primary text-primary-foreground flex flex-col justify-center p-8 rounded-3xl shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none">
                 <Settings2 className="w-8 h-8 mb-4" />
                 <h3 className="text-xl font-bold mb-2">Budget Settings</h3>
                 <p className="text-sm opacity-80 mb-4">Adjust your income and saving goals to keep your budget accurate.</p>
                 <Button variant="secondary" onClick={() => setIsSettingsOpen(true)}>Update Profile</Button>
              </Card>
            </div>
          </div>
        ) : activeTab === "friends" ? (
          <div key="friends" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" /> Eco-Leaderboard
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsNudgesModalOpen(true)} className="relative h-9 rounded-xl hover:bg-primary/10 transition-colors">
                  <MessageSquare className="w-4 h-4 mr-2" /> Nudges
                  {receivedMessages.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center animate-pulse border-2 border-background font-bold">
                      {receivedMessages.length}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-xl hover:bg-primary/10 transition-colors" onClick={() => { fetchFriendsData(); if (currentUserId) fetchMessages(currentUserId); }}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Sync
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {friendsData.length > 0 ? (
                friendsData.map((friend, i) => (
                  <Card key={friend.id} className={`glass rounded-2xl overflow-hidden border-none transition-all duration-300 ${friend.isSelf ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-muted-foreground">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </div>
                        <div className="w-10 h-10 rounded-full border bg-muted overflow-hidden">
                          {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{friend.username} {friend.isSelf && "(You)"}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Month Spend: ${friend.total_spent_current_month?.toFixed(0) || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Eco Score</p>
                          <p className={`text-xl font-black ${friend.score > 80 ? 'text-emerald-500' : 'text-primary'}`}>{friend.score}</p>
                        </div>
                        {!friend.isSelf && (
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setSelectedFriend(friend); setIsMessageModalOpen(true); }}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">Add friends in Settings to start competing!</p>
                  <Link href={`/settings${tid ? `?tid=${tid}` : ""}`} className="text-primary text-sm font-bold hover:underline mt-2 inline-block">Go to Settings</Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div key="scanner" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
            {/* Scanner Upload Section */}
            <Card className={`glass border-dashed border-2 relative overflow-hidden transition-all duration-500 ${isCameraActive ? 'py-6 min-h-[500px]' : 'py-10 min-h-[160px]'} flex flex-col items-center justify-center`}>
              {isCameraActive ? (
                <div className="w-full h-full flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300 px-4">
                  <div className="relative w-full max-w-xs aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-background">
                    {!capturedImage ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
                    )}
                  </div>
                  <div className="flex gap-4">
                    {!capturedImage ? (
                      <>
                        <Button variant="outline" onClick={stopCamera}>Cancel</Button>
                        <Button onClick={capturePhoto} className="px-8"><Camera className="w-4 h-4 mr-2" /> Capture</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={startCamera}><RotateCcw className="w-4 h-4 mr-2" /> Retake</Button>
                        <Button onClick={() => analyzeImage(capturedImage.split(",")[1])} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                          <Check className="w-4 h-4 mr-2" /> Use Image
                        </Button>
                      </>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : !showScanOptions ? (
                <div className="cursor-pointer flex flex-col items-center group" onClick={() => setShowScanOptions(true)}>
                  {loading ? <Loader2 className="animate-spin text-primary" /> : <Upload className="group-hover:scale-110 transition-transform text-primary" />}
                  <p className="mt-2 font-bold uppercase text-xs tracking-widest text-primary">Scan Receipt</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full max-w-[220px] animate-in fade-in zoom-in-95 duration-200 px-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Source</p>
                    <X className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" onClick={() => setShowScanOptions(false)} />
                  </div>
                  
                  <Button variant="outline" className="flex items-center gap-3 justify-start h-12 w-full hover:border-primary/50" onClick={() => (document.getElementById('up-file') as HTMLInputElement)?.click()}>
                    <ImageIcon className="w-4 h-4 text-primary" /> Upload Image
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-3 justify-start h-12 w-full hover:border-primary/50" onClick={startCamera}>
                    <Camera className="w-4 h-4 text-primary" /> Use Camera
                  </Button>
                  
                  <input type="file" id="up-file" accept="image/*" className="hidden" onChange={(e) => { handleUpload(e); setShowScanOptions(false); }} />
                </div>
              )}
            </Card>

            {scanError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {scanError}
              </div>
            )}

            {data && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Scan Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <p><span className="font-semibold">Store:</span> {data.storeName}</p>
                    <p><span className="font-semibold">Total:</span> ${data.totalAmount?.toFixed(2)}</p>
                    <p><span className="font-semibold">Eco Score:</span> {data.ecoScore}/100</p>
                    <p><span className="font-semibold">Eco tip:</span> {data.ecoTip}</p>
                  </div>
                  {data.items?.length > 0 && (
                    <div className="space-y-3">
                      <p className="font-semibold">Items</p>
                      <div className="grid gap-2">
                        {data.items.map((item: any, idx: number) => (
                          <div key={idx} className="rounded-md border p-3">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            <p className="text-sm text-muted-foreground">Price: ${item.price?.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* History List */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">History</h2>
                {history.length > 0 && (
                  <div className="hidden sm:flex px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold items-center gap-1 border border-emerald-200">
                    <Leaf className="w-3 h-3" /> {avgEcoScore} Avg Score
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={history.length === 0}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
                <Button onClick={() => { 
                  setEditingId(null); 
                  setFormData({ ...defaultForm, created_at: new Date().toISOString() }); 
                  setIsModalOpen(true); 
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Manual Entry
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder={`Search by ${searchScope === 'all' ? 'any field' : searchScope}...`} 
                  className="pl-10 glass border-none" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative flex items-center group sm:w-48">
                <Filter className="absolute left-3 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors z-10" />
                <select 
                  className="w-full pl-9 pr-10 py-2 glass border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none rounded-xl outline-none"
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value)}
                >
                  <option value="all" className="bg-background text-foreground">All Fields</option>
                  <option value="store" className="bg-background text-foreground">Store Name</option>
                  <option value="category" className="bg-background text-foreground">Category</option>
                  <option value="item" className="bg-background text-foreground">Item Name</option>
                  <option value="price" className="bg-background text-foreground">Total Price</option>
                  <option value="payment" className="bg-background text-foreground">Payment Method</option>
                  <option value="description" className="bg-background text-foreground">Description</option>
                  <option value="tag" className="bg-background text-foreground">Tag Color</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-3">
              {filteredHistory.map((r, i) => (
                <Card key={r.id} className="glass overflow-hidden rounded-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ borderLeft: `6px solid ${r.color}`, animationDelay: `${i * 50}ms` }}>
                  <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">{r.eco_score}</div>
                      <div className="transition-transform duration-200 group-hover:translate-x-1">
                        <p className="font-bold">{r.store_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{r.expense_type || "No category"}</p>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                          <p className="text-[10px] text-muted-foreground/60">
                            {new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="font-mono font-bold">${r.total_amount?.toFixed(2)}</p>
                  </div>
                  <div className={`grid transition-all duration-300 ease-in-out ${expandedId === r.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                    <CardContent className="border-t p-4 bg-muted/20">
                      <div className="space-y-2">
                        {getAggregatedItems(r.items).map((item: any, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span><span className="text-emerald-600 font-bold">{item.quantity}x</span> {item.name}</span>
                            <span>${item.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {r.image_urls && r.image_urls.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Attached Photos</p>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {r.image_urls.map((url: string, i: number) => (
                              <img 
                                key={i} 
                                src={url} 
                                alt={`Attachment ${i + 1}`} 
                                className="h-24 w-24 object-cover rounded-md border bg-background flex-shrink-0 hover:scale-105 transition-transform cursor-pointer" 
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => { 
                          setEditingId(r.id); 
                          setFormData({
                            store_name: r.store_name || "",
                            total_amount: r.total_amount?.toString() || "",
                            expense_type: r.expense_type || "",
                            description: r.description || "",
                            eco_score: r.eco_score || 50,
                            is_local_business: r.is_local_business || false,
                            items: r.items || [],
                            color: r.color || "#10b981",
                            payment_method: r.payment_method || "",
                            created_at: r.created_at,
                            image_urls: r.image_urls || []
                          }); 
                          setIsModalOpen(true); 
                        }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setItemToDeleteId(r.id)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Modal with Advanced Options */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
          <Card className="w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Manual Expense</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)}><X /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Store Name" value={formData.store_name || ""} onChange={e => setFormData({...formData, store_name: e.target.value})} />
              <Input placeholder="Amount" type="number" value={formData.total_amount || ""} onChange={e => setFormData({...formData, total_amount: e.target.value})} />
              <Input placeholder="Payment Method (e.g. Card, Cash)" value={formData.payment_method || ""} onChange={e => setFormData({...formData, payment_method: e.target.value})} />
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.created_at ? new Date(new Date(formData.created_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} 
                  onChange={e => setFormData({...formData, created_at: new Date(e.target.value).toISOString()})} 
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Eco Score</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button"
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-[10px] text-primary font-bold hover:bg-primary/10 flex items-center gap-1"
                      onClick={(e) => analyzeManualExpense(e)}
                      disabled={loading || (!formData.store_name && !formData.description)}
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                      AI Score
                    </Button>
                    <span className="text-xs font-bold text-emerald-600">{formData.eco_score}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-10 h-10 border-0" />
                <Label>Tag Color</Label>
              </div>
              <Button variant="ghost" className="w-full border" onClick={() => setIsAdvanced(!isAdvanced)}>
                {isAdvanced ? "Hide" : "Show"} Advanced (Details & Items)
              </Button>
              {/* Inside the Manual Entry Modal, replace the isAdvanced block with this: */}
              {isAdvanced && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Category & Description</Label>
                    <Input 
                      placeholder="Category (e.g. Food)" 
                      value={formData.expense_type || ""} 
                      onChange={e => setFormData({...formData, expense_type: e.target.value})} 
                    />
                    <Textarea 
                      placeholder="Description" 
                      value={formData.description || ""} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-primary font-bold">Item Breakdown</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setFormData({
                          ...formData, 
                          items: [...(formData.items || []), { name: "", price: 0, quantity: 1 }]
                        })}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Item
                      </Button>
                    </div>
                    
                    {/* THIS IS THE FIX: Mapping through items to allow editing */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {formData.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center bg-muted/40 p-2 rounded-md">
                          <Input 
                            placeholder="Item name" 
                            className="flex-1 h-8 text-xs"
                            value={item.name} 
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[idx].name = e.target.value;
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                          <Input 
                            type="number" 
                            placeholder="Qty" 
                            className="w-16 h-8 text-xs"
                            value={item.quantity} 
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                          <Input 
                            type="number" 
                            placeholder="$" 
                            className="w-20 h-8 text-xs"
                            value={item.price} 
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[idx].price = Number(e.target.value);
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              const newItems = formData.items.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, items: newItems });
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-primary font-bold">Additional Photos</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {formData.image_urls?.map((url: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="absolute top-1 right-1 h-5 w-5 rounded-sm"
                            onClick={() => setFormData({
                              ...formData, 
                              image_urls: formData.image_urls.filter((_, i) => i !== idx)
                            })}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Label className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Add</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleAdditionalImages} />
                      </Label>
                    </div>
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const payload = { ...formData, user_id: user.id, total_amount: parseFloat(formData.total_amount as string) };
                if (editingId) await supabase.from("receipts").update(payload).eq("id", editingId);
                else await supabase.from("receipts").insert(payload);
                setIsModalOpen(false);
                fetchHistory();
              }}>Save Expense</Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Budget Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
          <Card className="w-full max-w-sm animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Budget Settings</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}><X/></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monthly Income</Label>
                <Input type="number" value={profile.monthly_income ?? 0} onChange={e => setProfile({...profile, monthly_income: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Fixed Expenses (Rent, etc.)</Label>
                <Input type="number" value={profile.scheduled_expenses ?? 0} onChange={e => setProfile({...profile, scheduled_expenses: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Savings Goal</Label>
                <Input type="number" value={profile.saving_goal ?? 0} onChange={e => setProfile({...profile, saving_goal: Number(e.target.value)})} />
              </div>
              <Button className="w-full" onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("profiles").upsert({ id: user.id, ...profile });
                  setIsSettingsOpen(false);
                }
              }}>Save Settings</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messaging Modal */}
      {isMessageModalOpen && selectedFriend && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
          <Card className="w-full max-w-sm animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border overflow-hidden">
                    {selectedFriend.avatar_url ? <img src={selectedFriend.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-sm">Nudge {selectedFriend.username}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMessageModalOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Textarea 
                placeholder="Send some encouragement or an eco-tip..." 
                className="min-h-[100px] glass border-none"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
              <Button className="w-full" onClick={sendMessage} disabled={!messageContent.trim()}>
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Received Nudges Modal */}
      {isNudgesModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
          <Card className="w-full max-w-md animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Recent Nudges
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => {
                setIsNudgesModalOpen(false);
                setSelectedFriend(null);
              }}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 max-h-[60vh] overflow-y-auto space-y-4">
              {receivedMessages.length > 0 ? (
                receivedMessages.map((msg) => (
                  <div key={msg.id} className="glass p-4 rounded-2xl flex items-start gap-3 border-none bg-primary/5 animate-in slide-in-from-left-2">
                    <div className="w-10 h-10 rounded-full border bg-background overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {msg.sender?.avatar_url ? (
                        <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-primary mb-1">{msg.sender?.username || "Someone"}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full -mt-1 -mr-2 hover:bg-primary/20"
                          onClick={() => {
                            if (msg.sender) {
                              setSelectedFriend({ id: msg.sender.id, username: msg.sender.username, avatar_url: msg.sender.avatar_url });
                            }
                          }}
                        >
                          <Send className="w-3 h-3 -rotate-45" />
                        </Button>
                      </div>
                      <p className="text-sm italic leading-relaxed text-foreground">"{msg.content}"</p>
                      <p className="text-[9px] text-muted-foreground mt-2 font-medium">
                        {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-5" />
                  <p className="text-sm">No nudges yet. Your friends are quiet today!</p>
                </div>
              )}
            </CardContent>
            <CardHeader className="pt-4 border-t bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Send a Nudge</p>
                {selectedFriend && (
                  <button 
                    onClick={() => setSelectedFriend(null)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-2 h-2" /> Clear recipient
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {!selectedFriend ? (
                  <select 
                    className="w-full p-2 text-xs glass border-none rounded-lg bg-background/50 outline-none appearance-none cursor-pointer"
                    onChange={(e) => {
                      const friend = friendsData.find(f => f.id === e.target.value);
                      if (friend) setSelectedFriend(friend);
                    }}
                    value=""
                  >
                    <option value="" disabled className="bg-background">Choose a friend to nudge...</option>
                    {friendsData.filter(f => !f.isSelf).map(f => (
                      <option key={f.id} value={f.id} className="bg-background">{f.username}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg border border-primary/20 animate-in slide-in-from-top-1">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-background bg-background">
                       {selectedFriend.avatar_url ? <img src={selectedFriend.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1 text-muted-foreground" />}
                    </div>
                    <span className="text-xs font-bold text-primary">To: {selectedFriend.username}</span>
                  </div>
                )}
                
                <div className="relative">
                  <Textarea 
                    placeholder={selectedFriend ? `Message ${selectedFriend.username}...` : "Select a friend above to nudge"}
                    className="min-h-[80px] text-xs glass border-none pr-10 focus-visible:ring-1 focus-visible:ring-primary/20"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                    onClick={sendMessage}
                    disabled={!messageContent.trim() || !selectedFriend}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {itemToDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
          <Card className="w-full max-w-sm animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 overflow-hidden border-destructive/20 shadow-2xl">
            <CardHeader className="bg-destructive/5 flex flex-row items-center justify-between pb-4 border-b border-destructive/10">
              <CardTitle className="text-lg text-destructive">Delete Expense?</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setItemToDeleteId(null)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="pt-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="font-bold">Remove this record?</p>
                <p className="text-sm text-muted-foreground px-6">
                  This will permanently delete this expense from your history.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button 
                  variant="destructive" 
                  className="w-full h-11 font-bold" 
                  onClick={async () => {
                    await supabase.from("receipts").delete().eq("id", itemToDeleteId);
                    setItemToDeleteId(null);
                    fetchHistory();
                    setNotification({ message: "Expense deleted", type: "success" });
                  }}
                >
                  Delete
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setItemToDeleteId(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
