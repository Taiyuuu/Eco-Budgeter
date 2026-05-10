"use client";

import { useState, useEffect } from "react";
import { 
  Upload, Leaf, MapPin, Receipt, Loader2, History, Plus, Edit2, 
  Trash2, X, ChevronDown, ChevronUp, Save, BarChart3, Settings2, 
  PieChart as PieChartIcon, BrainCircuit 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export default function Home() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner">("scanner");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Data States
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState({ monthly_income: 0, saving_goal: 0, scheduled_expenses: 0 });
  const [data, setData] = useState<any>(null); // Last scan result
  const [scanError, setScanError] = useState<string | null>(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultForm = {
    store_name: "", total_amount: "", expense_type: "", description: "", 
    eco_score: 50, is_local_business: false, items: [] as any[], color: "#10b981",
    payment_method: "",
    created_at: new Date().toISOString()
  };
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { 
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
    if (data) setProfile(data);
  };

  // --- Financial Calculations ---
  const totalSpent = history.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const remainingBudget = profile.monthly_income - profile.scheduled_expenses - profile.saving_goal - totalSpent;

  const pieData = Object.values(history.reduce((acc: any, curr) => {
    const type = curr.expense_type || "Uncategorized";
    if (!acc[type]) acc[type] = { name: type, value: 0, color: curr.color || "#10b981" };
    acc[type].value += curr.total_amount;
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
            eco_score: result.ecoScore || 50,
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

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Eco-Budgeter</h1>
          </div>
          <div className="flex gap-2">
            <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>
              Dashboard
            </Button>
            <Button variant={activeTab === "scanner" ? "default" : "outline"} onClick={() => setActiveTab("scanner")}>
              Scanner
            </Button>
          </div>
        </header>

        {activeTab === "dashboard" ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Budget Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Income</p><p className="text-2xl font-bold">${profile.monthly_income}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expenses</p><p className="text-2xl font-bold text-red-500">-${profile.scheduled_expenses}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Goal</p><p className="text-2xl font-bold text-blue-500">${profile.saving_goal}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Left</p><p className={`text-2xl font-bold ${remainingBudget < 0 ? "text-red-500" : "text-green-500"}`}>${remainingBudget.toFixed(2)}</p></CardContent></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                          {pieData.map((entry: any, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No spending data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
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
              <h2 className="text-2xl font-bold">History</h2>
              <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setIsModalOpen(true); }}>
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
                            created_at: r.created_at
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