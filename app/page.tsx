//AI assisted code
"use client";

import { useState, useEffect } from "react";
import { 
  Upload, Leaf, MapPin, Receipt, Loader2, History, Plus, Edit2, 
  Trash2, X, ChevronDown, ChevronUp, Save, BarChart3, Settings2, 
  PieChart as PieChartIcon, BrainCircuit, User, LogOut, Settings,
  TrendingUp, Lightbulb, LineChart as LineChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

export default function Home() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner">("scanner");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Data States
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState({ monthly_income: 0, saving_goal: 0, scheduled_expenses: 0, username: "", avatar_url: "", last_analysis_date: "", last_analysis_text: "", theme: "system", gradient_start: "", gradient_end: "" });
  const [data, setData] = useState<any>(null); // Last scan result
  const [scanError, setScanError] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
    fetchHistory(); 
    fetchProfile();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
    setHistory(data || []);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
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
    
    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme(profile.theme || "system");
  }, [profile.theme, mounted]);

  // --- Financial Calculations ---
  const totalSpent = history.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const remainingBudget = profile.monthly_income - profile.scheduled_expenses - profile.saving_goal - totalSpent;

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

  const avgEcoScore = history.length > 0 
    ? Math.round(history.reduce((sum, r) => sum + (r.eco_score || 0), 0) / history.length) 
    : 0;

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    setData(null);
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/public/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const result = await res.json();
        if (!res.ok) {
          const message = result?.error || "Receipt analysis failed.";
          setScanError(message);
          console.error("API Response error:", result);
          return;
        }
        console.log("API Response result:", result);
        setData(result);

        // Save the scanned results to Supabase history
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
            color: "#10b981", // Default color for scanned entries
          });
          if (saveError) console.error("Error saving scan to history:", saveError);
        }

        fetchHistory();
      } catch (err: any) {
        console.error(err);
        setScanError(err?.message || "Receipt analysis failed.");
      } finally {
        setLoading(false);
      }
    };
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
      const result = await res.json();
      console.log("AI Analysis response:", result, "Status:", res.status);
      
      if (res.ok && result.ecoScore !== undefined) {
        console.log("Successfully got ecoScore:", result.ecoScore);
        setFormData(prev => {
          const updated = { 
            ...prev, 
            eco_score: result.ecoScore,
            is_local_business: result.isLocalBusiness ?? prev.is_local_business,
            expense_type: result.category || prev.expense_type,
            description: result.ecoTip ? (prev.description ? `${prev.description}\n\nTip: ${result.ecoTip}` : result.ecoTip) : prev.description
          };
          console.log("Updated formData:", updated);
          return updated;
        });
      } else {
        console.error("AI Analysis failed or missing ecoScore:", result);
        alert(`Error: ${result.error || "Failed to generate eco-score"}`);
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert("Error analyzing expense");
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
      const result = await res.json();
      if (res.ok) {
        setAiAdvice(result);
      }
    } catch (err) {
      console.error("Advice request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen p-4 md:p-8 pb-24 transition-all duration-500 bg-background"
      style={{ 
        background: profile.gradient_start && profile.gradient_end 
          ? `linear-gradient(to bottom right, ${profile.gradient_start}, ${profile.gradient_end})`
          : undefined 
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Eco-Budgeter</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-2 mr-4">
              <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>Dashboard</Button>
              <Button variant={activeTab === "scanner" ? "default" : "outline"} onClick={() => setActiveTab("scanner")}>Scanner</Button>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold leading-none">{profile.username || "Set Username"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Avg Score: {avgEcoScore}</p>
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
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full transition-colors">
                    <Settings className="w-4 h-4" /> Edit Profile
                  </Link>
                  <button 
                    onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === "dashboard" ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Budget Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Net Income</p><p className="text-2xl font-bold">${profile.monthly_income - profile.scheduled_expenses}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Spent</p><p className="text-2xl font-bold text-red-500">${totalSpent.toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Savings Goal</p><p className="text-2xl font-bold text-blue-500">${profile.saving_goal}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Budget Left</p><p className={`text-2xl font-bold ${remainingBudget < 0 ? "text-red-500" : "text-green-500"}`}>${remainingBudget.toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Budget Progress</p><p className={`text-2xl font-bold ${isBudgetProgressOver ? "text-red-500" : "text-green-500"}`}>{displayBudgetProgress}</p></CardContent></Card>
              <Card className="bg-emerald-50 border-emerald-200"><CardContent className="p-4"><p className="text-sm text-emerald-700 font-medium">Avg Eco-Score</p><p className="text-2xl font-bold text-emerald-900">{avgEcoScore}/100</p></CardContent></Card>
            </div>

            <Card className="p-6">
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
              <Card className="md:col-span-2">
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

              <Card>
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

              <Card>
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

              <Card>
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
              <Card className="bg-primary text-primary-foreground flex flex-col justify-center p-6">
                 <Settings2 className="w-8 h-8 mb-4" />
                 <h3 className="text-xl font-bold mb-2">Budget Settings</h3>
                 <p className="text-sm opacity-80 mb-4">Adjust your income and saving goals to keep your budget accurate.</p>
                 <Button variant="secondary" onClick={() => setIsSettingsOpen(true)}>Update Profile</Button>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            {/* Scanner Upload Section */}
            <Card className="border-dashed border-2 bg-muted/50 py-10 flex flex-col items-center">
              <input type="file" id="up" className="hidden" onChange={handleUpload} />
              <Label htmlFor="up" className="cursor-pointer flex flex-col items-center">
                {loading ? <Loader2 className="animate-spin" /> : <Upload />}
                <p className="mt-2 font-medium">Scan Receipt</p>
              </Label>
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
              <Button onClick={() => { 
                setEditingId(null); 
                setFormData({ ...defaultForm, created_at: new Date().toISOString() }); 
                setIsModalOpen(true); 
              }}>
                <Plus className="w-4 h-4 mr-2" /> Manual Entry
              </Button>
            </div>

            <div className="space-y-3">
              {history.map((r) => (
                <Card key={r.id} className="overflow-hidden" style={{ borderLeft: `6px solid ${r.color}` }}>
                  <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">{r.eco_score}</div>
                      <div>
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
                  {expandedId === r.id && (
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
                        <Button size="sm" variant="destructive" onClick={async () => {
                          if (confirm("Delete this expense?")) {
                            await supabase.from("receipts").delete().eq("id", r.id);
                            fetchHistory();
                          }
                        }}>Delete</Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Modal with Advanced Options */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg overflow-y-auto max-h-[90vh]">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
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
    </main>
  );
}
