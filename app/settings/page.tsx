"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea for bio
import { ArrowLeft, User, Key, Mail, Lock, Loader2, Save, Upload, Sun, Moon, Monitor, Palette, MoveRight, MoveDownRight, MoveDown, MoveDownLeft, CircleDot, Plus, Trash2, UserPlus, UserCheck, UserX, Users, Check, X } from "lucide-react";
import Link from "next/link";

function SettingsContent() {
  const supabase = createClient();
  const { setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tid = searchParams.get("tid");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const gradientTrackRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    gemini_api_key: "",
    avatar_url: "",
    email: "",
    password: "", // Only for update, not display
    theme: "system",
    font_size: "base",
    gradient_type: "linear",
    gradient_direction: "to bottom right",
    gradient_stops: [{ color: "#ffffff", position: 0 }, { color: "#f3f4f6", position: 100 }] as {color: string, position: number}[]
  });

  // Friend management states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const getInitialData = async () => {
      setMounted(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push(`/${tid ? `?tid=${tid}` : ""}`);
      setUser(authUser);
      
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (profile) {
        setFormData(prev => ({
          ...prev,
          username: profile.username || "",
          bio: profile.bio || "",
          gemini_api_key: profile.gemini_api_key || "",
          avatar_url: profile.avatar_url || "",
          email: authUser.email || "",
          theme: profile.theme || "system",
          font_size: profile.font_size || "base",
          gradient_type: profile.gradient_type || "linear",
          gradient_direction: profile.gradient_direction || "to bottom right",
          gradient_stops: profile.gradient_stops || [{ color: "#ffffff", position: 0 }, { color: "#f3f4f6", position: 100 }]
        }));

        // Sync stored theme with next-themes on load
        if (profile.theme && profile.theme !== "custom") {
          setTheme(profile.theme);
        }
        
        // Fetch friend data using the confirmed ID
        fetchFriendData(authUser.id);
      }
    };
    getInitialData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Immediate theme preview
  useEffect(() => {
    if (!formData.theme) return;
    const root = document.documentElement;
    if (formData.theme === "custom") root.classList.add("custom");
    else root.classList.remove("custom");
  }, [formData.theme]);

  // Immediate font size preview
  useEffect(() => {
    if (!mounted) return;
    const sizes: Record<string, string> = { sm: "14px", base: "16px", lg: "18px", xl: "20px" };
    document.documentElement.style.fontSize = sizes[formData.font_size] || "16px";
  }, [formData.font_size, mounted]);

  // Handle dragging of gradient stops
  useEffect(() => {
    if (draggingIdx === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gradientTrackRef.current) return;
      
      const rect = gradientTrackRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, Math.round((offsetX / rect.width) * 100)));
      
      setFormData(prev => {
        const newStops = [...prev.gradient_stops];
        newStops[draggingIdx] = { ...newStops[draggingIdx], position: percentage };
        return { ...prev, gradient_stops: newStops };
      });
    };

    const handleMouseUp = () => setDraggingIdx(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingIdx]);

  // Function to add a gradient stop
  const addStop = () => {
    const newStops = [...formData.gradient_stops, { color: "#cccccc", position: 50 }];
    setFormData({ ...formData, gradient_stops: newStops });
  };

  // Function to remove a stop (minimum 2)
  const removeStop = (index: number) => {
    if (formData.gradient_stops.length <= 2) return;
    const newStops = formData.gradient_stops.filter((_, i) => i !== index);
    setFormData({ ...formData, gradient_stops: newStops });
  };

  // Update stop color or position
  const updateStop = (index: number, updates: Partial<{color: string, position: number}>) => {
    const newStops = [...formData.gradient_stops];
    newStops[index] = { ...newStops[index], ...updates };
    setFormData({ ...formData, gradient_stops: newStops });
  };

  const getPreviewGradient = () => {
    const stops = [...formData.gradient_stops]
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');
    
    if (formData.gradient_direction === 'radial') return `radial-gradient(circle at center, ${stops})`;
    return `linear-gradient(${formData.gradient_direction}, ${stops})`;
  };

  // Friend Management Functions
  const fetchFriendData = async (userId?: string | any) => {
    const id = typeof userId === 'string' ? userId : user?.id;
    if (!id || typeof id !== 'string') return;

    // Incoming requests
    const { data: incoming, error: incomingErr } = await supabase
      .from("friend_requests")
      .select("*, sender:sender_id(username, avatar_url)")
      .eq("receiver_id", id)
      .eq("status", "pending");
    if (incomingErr) console.error("Error fetching incoming requests:", JSON.stringify(incomingErr, null, 2));
    else setIncomingRequests(incoming || []);

    // Outgoing requests
    const { data: outgoing, error: outgoingErr } = await supabase
      .from("friend_requests")
      .select("*, receiver:receiver_id(username, avatar_url)")
      .eq("sender_id", id)
      .eq("status", "pending");
    if (outgoingErr) console.error("Error fetching outgoing requests:", JSON.stringify(outgoingErr, null, 2));
    else setOutgoingRequests(outgoing || []);

    // Friends list
    const { data: friends, error: friendsErr } = await supabase
      .from("friends")
      .select("*, user1:user1_id(username, avatar_url), user2:user2_id(username, avatar_url)");
    if (friendsErr) console.error("Error fetching friends:", JSON.stringify(friendsErr, null, 2));
    else {
      // Map to a consistent friend object (the other user)
      const mappedFriends = friends?.map(f => {
        if (f.user1_id === id) return { id: f.user2_id, username: f.user2?.username, avatar_url: f.user2?.avatar_url };
        return { id: f.user1_id, username: f.user1?.username, avatar_url: f.user1?.avatar_url };
      });
      setFriendsList(mappedFriends || []);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .ilike("username", `%${searchQuery}%`)
      .neq("id", user.id) // Don't show self
      .limit(5);

    if (error) console.error("Error searching users:", error);
    else setSearchResults(data || []);
  };

  const sendFriendRequest = async (receiverId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending"
    });
    if (error) setNotification({ message: "Error sending request: " + error.message, type: "error" });
    else {
      setNotification({ message: "Friend request sent!", type: "success" });
      setSearchQuery("");
      setSearchResults([]);
      fetchFriendData();
    }
  };

  const handleRequestAction = async (requestId: string, action: "accept" | "decline") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: request, error: fetchError } = await supabase.from("friend_requests").select("*").eq("id", requestId).single();
    if (fetchError || !request) { console.error("Request not found:", fetchError); return; }

    if (action === "accept") {
      // Create friendship
      const { error: friendError } = await supabase.from("friends").insert({
        user1_id: request.sender_id < request.receiver_id ? request.sender_id : request.receiver_id,
        user2_id: request.sender_id < request.receiver_id ? request.receiver_id : request.sender_id,
      });
      if (friendError) { setNotification({ message: "Error creating friendship: " + friendError.message, type: "error" }); return; }
    }

    // Update request status
    const { error: updateError } = await supabase.from("friend_requests").update({ status: action === "accept" ? "accepted" : "declined" }).eq("id", requestId);
    if (updateError) setNotification({ message: `Error ${action}ing request: ` + updateError.message, type: "error" });
    else fetchFriendData(); // Refresh lists
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Update Profile Metadata
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        username: formData.username,
        bio: formData.bio,
        gemini_api_key: formData.gemini_api_key,
        avatar_url: formData.avatar_url,
        theme: formData.theme,
        font_size: formData.font_size,
        gradient_type: formData.gradient_direction === 'radial' ? 'radial' : 'linear',
        gradient_direction: formData.gradient_direction,
        gradient_stops: formData.gradient_stops,
        updated_at: new Date().toISOString()
      });
      if (profileError) throw profileError;
      setNotification({ message: "Profile updated successfully!", type: "success" });

      // Update Auth Details (Email/Password) if changed
      if (formData.email !== user.email || formData.password) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email !== user.email ? formData.email : undefined,
          password: formData.password || undefined
        });
        if (authError) throw authError;
      }
    } catch (err: any) {
      setNotification({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // Delete the profile entry. Cascading deletes handle related data in the public schema.
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);
      if (error) throw error;
      
      await supabase.auth.signOut();
      router.push(`/${tid ? `?tid=${tid}` : ""}`);
    } catch (err: any) {
      setNotification({ message: "Failed to delete account: " + err.message, type: "error" });
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileName = `${user.id}-avatar.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(`avatars/${fileName}`, file, { upsert: true });
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from("receipts").getPublicUrl(`avatars/${fileName}`);
      setFormData({ ...formData, avatar_url: data.publicUrl });
    } catch (err: any) {
      setNotification({ message: "Upload failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      className="relative min-h-screen p-4 md:p-8 transition-all duration-700 bg-background overflow-hidden"
      style={{ background: formData.theme === "custom" ? getPreviewGradient() : undefined }}
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

      {/* Ambient Tahoe Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/${tid ? `?tid=${tid}` : ""}`}>
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card className="glass rounded-3xl border-none animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
            <CardDescription>Public information that identifies you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                {formData.avatar_url ? <img src={formData.avatar_url} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-muted-foreground" />}
              </div>
              <Label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200">
                <Upload className="w-4 h-4 inline mr-2" /> Upload Avatar
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </Label>
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Choose a public name" />
            </div>
            <div className="grid gap-2">
              <Label>Bio</Label>
              <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about your eco-journey" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl border-none animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Appearance</CardTitle>
            <CardDescription>Customize the theme and background of your app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "light", icon: Sun, label: "Light" },
                  { id: "dark", icon: Moon, label: "Dark" },
                  { id: "system", icon: Monitor, label: "System" },
                  { id: "custom", icon: Palette, label: "Gradient" }
                ].map((t) => (
                  <Button
                    key={t.id}
                    variant={formData.theme === t.id ? "default" : "outline"}
                    className="flex flex-col h-20 gap-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => {
                      setFormData({ ...formData, theme: t.id });
                      if (t.id !== "custom") setTheme(t.id);
                    }}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-xs">{t.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {formData.theme === "custom" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Gradient Directions</Label>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Flow</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: "to bottom right", icon: MoveDownRight },
                      { id: "to bottom left", icon: MoveDownLeft },
                      { id: "to bottom", icon: MoveDown },
                      { id: "to right", icon: MoveRight },
                      { id: "radial", icon: CircleDot }
                    ].map((dir) => (
                      <Button
                        key={dir.id}
                        size="icon"
                        variant={formData.gradient_direction === dir.id ? "default" : "outline"}
                        onClick={() => setFormData({ ...formData, gradient_direction: dir.id })}
                      >
                        <dir.icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Color Stops</Label>
                    <Button variant="ghost" size="sm" onClick={addStop} className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add Stop
                    </Button>
                  </div>
                  
                  <div 
                    ref={gradientTrackRef}
                    className="relative h-6 w-full rounded-full border shadow-inner mb-8 select-none" 
                    style={{ background: getPreviewGradient() }}
                  >
                    {formData.gradient_stops.map((stop, idx) => (
                      <div 
                        key={idx} 
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-10"
                        style={{ left: `${stop.position}%`, cursor: draggingIdx === idx ? 'grabbing' : 'grab' }}
                        onMouseDown={(e) => { e.preventDefault(); setDraggingIdx(idx); }}
                      >
                        <input 
                          type="color" 
                          value={stop.color} 
                          onChange={(e) => updateStop(idx, { color: e.target.value })}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer block p-0 overflow-hidden"
                        />
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded p-1 flex items-center gap-1 z-20">
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeStop(idx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t">
              <Label>Font Size</Label>
              <div className="grid grid-cols-4 gap-2">
                {["sm", "base", "lg", "xl"].map((size) => (
                  <Button
                    key={size}
                    variant={formData.font_size === size ? "default" : "outline"}
                    className="capitalize h-10"
                    onClick={() => setFormData({ ...formData, font_size: size })}
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Scaling Preference</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl border-none animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Friends & Sharing</CardTitle>
            <CardDescription>Connect with friends and share your eco-budget journey.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Find Friends</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search by username" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={!searchQuery}>Search</Button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(result => (
                    <div key={result.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded-md transition-colors flex-1"
                        onClick={() => {
                          setSelectedProfile(result);
                          setIsProfileModalOpen(true);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-background overflow-hidden flex items-center justify-center">
                          {result.avatar_url ? <img src={result.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <span>{result.username}</span>
                      </div>
                      <Button size="sm" onClick={() => sendFriendRequest(result.id)} disabled={outgoingRequests.some(req => req.receiver_id === result.id) || friendsList.some(f => f.id === result.id)}>
                        {outgoingRequests.some(req => req.receiver_id === result.id) ? "Pending" : "Add Friend"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {incomingRequests.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Incoming Requests</Label>
                <div className="space-y-2">
                  {incomingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-background overflow-hidden flex items-center justify-center">
                          {request.sender.avatar_url ? <img src={request.sender.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <span>{request.sender.username}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, "decline")}>
                          <UserX className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleRequestAction(request.id, "accept")}>
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Sent Requests</Label>
                <div className="space-y-2">
                  {outgoingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-background overflow-hidden flex items-center justify-center">
                          {request.receiver.avatar_url ? <img src={request.receiver.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <span>{request.receiver.username}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {friendsList.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Your Friends</Label>
                <div className="space-y-2">
                  {friendsList.map(friend => (
                    <div key={friend.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-background overflow-hidden flex items-center justify-center">
                        {friend.avatar_url ? <img src={friend.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <span>{friend.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile View Modal */}
        {isProfileModalOpen && selectedProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
            <Card className="w-full max-w-sm animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
              <CardHeader className="bg-primary/5 flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">User Profile</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsProfileModalOpen(false)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                  {selectedProfile.avatar_url ? (
                    <img src={selectedProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedProfile.username}</h3>
                  <p className="text-sm text-muted-foreground mt-2 px-4 italic">
                    {selectedProfile.bio || "No bio provided yet."}
                  </p>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => {
                    sendFriendRequest(selectedProfile.id);
                    setIsProfileModalOpen(false);
                  }}
                  disabled={outgoingRequests.some(req => req.receiver_id === selectedProfile.id) || friendsList.some(f => f.id === selectedProfile.id)}
                >
                  {outgoingRequests.some(req => req.receiver_id === selectedProfile.id) ? "Request Pending" : 
                   friendsList.some(f => f.id === selectedProfile.id) ? "Already Friends" : "Add Friend"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
            <Card className="w-full max-w-sm animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 overflow-hidden border-destructive/20 shadow-2xl">
              <CardHeader className="bg-destructive/5 flex flex-row items-center justify-between pb-4 border-b border-destructive/10">
                <CardTitle className="text-lg text-destructive">Delete Account?</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsDeleteModalOpen(false)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="pt-8 space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold">Are you absolutely sure?</p>
                  <p className="text-sm text-muted-foreground px-6">
                    This action will permanently delete your profile and budget history. This cannot be undone.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full h-11 font-bold" 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Yes, Delete Everything"}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="glass rounded-3xl border-none animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> AI Configuration</CardTitle>
            <CardDescription>Enter your Gemini API key to enable receipt scanning and AI eco-tips.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Google Gemini API Key</Label>
              <Input type="password" value={formData.gemini_api_key} onChange={e => setFormData({...formData, gemini_api_key: e.target.value})} placeholder="Paste your key here" />
              <p className="text-[10px] text-muted-foreground">Keys are stored securely and used only for analysis.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl border-none border-destructive/20 bg-destructive/5 animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive font-bold"><Trash2 className="w-5 h-5" /> Danger Zone</CardTitle>
            <CardDescription>Actions that cannot be reversed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-bold">Delete Account</p>
                <p className="text-xs text-muted-foreground">Clear all data and remove your account from the app.</p>
              </div>
              <Button variant="destructive" size="sm" className="rounded-xl px-6" onClick={() => setIsDeleteModalOpen(true)}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full h-12" onClick={handleUpdateProfile} disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}