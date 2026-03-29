// app/(tabs)/statistics.tsx
// No SVG dependency — pure React Native charts
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../src/authcontext";
import { useTheme } from "../../src/themecontext";
import { supabase } from "../../components/lib/supabase";
import {
  Plus, Trash2, X, ChevronDown,
  Droplets, Leaf, FlaskConical,
  ChevronLeft, ChevronRight, Cpu,
} from "lucide-react-native";

// ─── Constants ────────────────────────────────────────────
const ANIMAL_TYPES = [
  { label: "Poulets",  emoji: "🐔", food_per_day: 0.12 },
  { label: "Moutons",  emoji: "🐑", food_per_day: 1.5  },
  { label: "Vaches",   emoji: "🐄", food_per_day: 12   },
  { label: "Chèvres",  emoji: "🐐", food_per_day: 1.2  },
  { label: "Lapins",   emoji: "🐇", food_per_day: 0.15 },
  { label: "Dindons",  emoji: "🦃", food_per_day: 0.2  },
  { label: "Canards",  emoji: "🦆", food_per_day: 0.18 },
  { label: "Chevaux",  emoji: "🐴", food_per_day: 8    },
  { label: "Ânes",     emoji: "🫏", food_per_day: 5    },
  { label: "Porcs",    emoji: "🐷", food_per_day: 2    },
  { label: "Autre",    emoji: "🐾", food_per_day: 1    },
];

const CULTURE_TYPES = [
  { label: "Tomate",         emoji: "🍅", type: "légume"  },
  { label: "Pomme de terre", emoji: "🥔", type: "légume"  },
  { label: "Oignon",         emoji: "🧅", type: "légume"  },
  { label: "Carotte",        emoji: "🥕", type: "légume"  },
  { label: "Courgette",      emoji: "🥒", type: "légume"  },
  { label: "Poivron",        emoji: "🫑", type: "légume"  },
  { label: "Aubergine",      emoji: "🍆", type: "légume"  },
  { label: "Chou",           emoji: "🥬", type: "légume"  },
  { label: "Ail",            emoji: "🧄", type: "légume"  },
  { label: "Épinard",        emoji: "🥬", type: "légume"  },
  { label: "Olivier",        emoji: "🫒", type: "fruit"   },
  { label: "Figuier",        emoji: "🪴", type: "fruit"   },
  { label: "Orangers",       emoji: "🍊", type: "fruit"   },
  { label: "Citronnier",     emoji: "🍋", type: "fruit"   },
  { label: "Vigne",          emoji: "🍇", type: "fruit"   },
  { label: "Abricotier",     emoji: "🍑", type: "fruit"   },
  { label: "Pêcher",         emoji: "🍑", type: "fruit"   },
  { label: "Pommier",        emoji: "🍎", type: "fruit"   },
  { label: "Grenadier",      emoji: "🍈", type: "fruit"   },
  { label: "Pastèque",       emoji: "🍉", type: "fruit"   },
  { label: "Blé",            emoji: "🌾", type: "céréale" },
  { label: "Orge",           emoji: "🌾", type: "céréale" },
  { label: "Maïs",           emoji: "🌽", type: "céréale" },
  { label: "Lentilles",      emoji: "🫘", type: "céréale" },
  { label: "Pois chiche",    emoji: "🫘", type: "céréale" },
  { label: "Tournesol",      emoji: "🌻", type: "céréale" },
];

const UNITES_SURFACE = ["hectare", "are", "m²", "donum"];
const COLORS = ["#16a34a","#2563eb","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#a855f7"];

// ─── Types ────────────────────────────────────────────────
interface Animal  { id: string; type: string; nombre: number; prix_nourriture: number; unite_nourriture: string; }
interface Parcelle{ id: string; nom: string; superficie: number; unite_superficie: string; type_culture: string; }
interface CalEvent{ id: string; date: string; commentaire: string; }

// ─── Pure RN Donut Chart ──────────────────────────────────
// Uses layered arc segments built from View + borderRadius tricks
// Each segment = a View rotated to its start angle, clipped to show only its slice
function DonutChart({ data, theme }: { data: { label: string; value: number; color: string }[]; theme: any }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  // Build percentage bars instead of real donut (100% compatible, no SVG)
  return (
    <View>
      {/* Horizontal stacked bar */}
      <View style={{ height: 24, borderRadius: 12, overflow: "hidden", flexDirection: "row", marginBottom: 16 }}>
        {data.map((d, i) => (
          <View
            key={i}
            style={{ flex: d.value / total, backgroundColor: d.color }}
          />
        ))}
      </View>

      {/* Big number */}
      <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text, textAlign: "center", marginBottom: 8 }}>
        {total} <Text style={{ fontSize: 14, color: theme.muted, fontWeight: "400" }}>au total</Text>
      </Text>

      {/* Legend with percentages */}
      <View style={{ gap: 8 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: d.color }} />
            <Text style={{ flex: 1, fontSize: 13, color: theme.text, fontWeight: "500" }}>{d.label}</Text>
            <View style={{ flex: 2, height: 8, backgroundColor: theme.bg, borderRadius: 4, overflow: "hidden" }}>
              <View style={{ width: `${(d.value / total) * 100}%`, height: "100%", backgroundColor: d.color, borderRadius: 4 }} />
            </View>
            <Text style={{ fontSize: 12, color: theme.muted, width: 40, textAlign: "right" }}>
              {((d.value / total) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Bar Chart ────────────────────────────────────────────
function BarChart({ data, theme, unit = "" }: {
  data: { label: string; value: number; color: string }[]; theme: any; unit?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 140 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <Text style={{ fontSize: 9, color: theme.muted, marginBottom: 3, textAlign: "center" }}>
            {d.value > 0 ? `${d.value.toFixed(0)}${unit}` : ""}
          </Text>
          <View style={{
            width: "75%",
            height: Math.max((d.value / max) * 100, 4),
            backgroundColor: d.color,
            borderRadius: 6,
          }} />
          <Text style={{ fontSize: 9, color: theme.muted, marginTop: 5, textAlign: "center" }} numberOfLines={2}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Mini Calendar ────────────────────────────────────────
function MiniCalendar({ events, onAddEvent, onDeleteEvent, theme }: {
  events: CalEvent[];
  onAddEvent: (date: string, comment: string) => void;
  onDeleteEvent: (id: string) => void;
  theme: any;
}) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment]   = useState("");

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const monthNames  = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const dayNames    = ["L","M","M","J","V","S","D"];
  const todayStr    = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const eventDates  = new Set(events.map(e => e.date));

  const selectDate = (day: number) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelected(prev => prev === d ? null : d);
    setComment("");
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  const selectedEvents = selected ? events.filter(e => e.date === selected) : [];

  return (
    <View>
      {/* Nav */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
          <ChevronLeft width={20} height={20} color={theme.muted} />
        </TouchableOpacity>
        <Text style={{ fontWeight: "700", color: theme.text, fontSize: 15 }}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
          <ChevronRight width={20} height={20} color={theme.muted} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {dayNames.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: theme.muted }}>{d}</Text>
        ))}
      </View>

      {/* Days */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Array(firstDay).fill(null).map((_, i) => (
          <View key={`b${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />
        ))}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday    = dateStr === todayStr;
          const hasEvent   = eventDates.has(dateStr);
          const isSel      = selected === dateStr;
          return (
            <TouchableOpacity
              key={day}
              style={{ width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" }}
              onPress={() => selectDate(day)}
              activeOpacity={0.7}
            >
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                alignItems: "center", justifyContent: "center",
                backgroundColor: isSel ? "#16a34a" : isToday ? "#dcfce7" : "transparent",
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: isToday || isSel ? "700" : "400",
                  color: isSel ? "#fff" : isToday ? "#16a34a" : theme.text,
                }}>{day}</Text>
              </View>
              {hasEvent && (
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#f59e0b", position: "absolute", bottom: 2 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day panel */}
      {selected && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: theme.muted }}>📅 {selected}</Text>

          {selectedEvents.map(ev => (
            <View key={ev.id} style={{
              flexDirection: "row", alignItems: "flex-start", gap: 8,
              backgroundColor: theme.bg, borderRadius: 10, padding: 10,
              borderWidth: 1, borderColor: theme.border,
            }}>
              <Text style={{ flex: 1, fontSize: 13, color: theme.text, lineHeight: 18 }}>{ev.commentaire}</Text>
              <TouchableOpacity onPress={() => onDeleteEvent(ev.id)}>
                <Trash2 width={14} height={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[s.input, {
                flex: 1, backgroundColor: theme.bg,
                borderColor: theme.border, color: theme.text,
              }]}
              placeholder="Écrire une note..."
              placeholderTextColor={theme.muted}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={{ backgroundColor: "#16a34a", borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" }}
              onPress={() => {
                if (!comment.trim()) return;
                onAddEvent(selected, comment.trim());
                setComment("");
              }}
            >
              <Plus width={18} height={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Picker Sheet ─────────────────────────────────────────
function PickerSheet({ visible, options, onSelect, onClose, theme, title }: {
  visible: boolean;
  options: { label: string; value: string; emoji?: string }[];
  onSelect: (v: string) => void;
  onClose: () => void;
  theme: any;
  title: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "65%", paddingBottom: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><X width={22} height={22} color={theme.muted} /></TouchableOpacity>
          </View>
          <ScrollView>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.divider }}
                onPress={() => { onSelect(opt.value); onClose(); }}
                activeOpacity={0.7}
              >
                {opt.emoji && <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>}
                <Text style={{ fontSize: 15, color: theme.text }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Card ─────────────────────────────────────────────────
function Card({ children, theme, style }: { children: React.ReactNode; theme: any; style?: any }) {
  return (
    <View style={[{
      backgroundColor: theme.card, borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: theme.border,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    }, style]}>
      {children}
    </View>
  );
}

function SH({ title, emoji, theme }: { title: string; emoji: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }}>{title}</Text>
    </View>
  );
}

// ═════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════
export default function StatisticsScreen() {
  const { user }        = useAuth();
  const { theme }       = useTheme();
  const [tab, setTab]   = useState<"animaux"|"sol">("animaux");

  // Animals state
  const [animals, setAnimals]               = useState<Animal[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [showAddAnimal, setShowAddAnimal]   = useState(false);
  const [animalType, setAnimalType]         = useState("");
  const [animalNombre, setAnimalNombre]     = useState("");
  const [animalPrix, setAnimalPrix]         = useState("");
  const [animalUnite, setAnimalUnite]       = useState("kg");
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [showUnitePicker2, setShowUnitePicker2] = useState(false);
  const [aiAnimalResult, setAiAnimalResult] = useState("");
  const [aiAnimalLoading, setAiAnimalLoading] = useState(false);

  // Sol state
  const [parcelles, setParcelles]             = useState<Parcelle[]>([]);
  const [loadingParcelles, setLoadingParcelles] = useState(true);
  const [showAddParcelle, setShowAddParcelle] = useState(false);
  const [parcelleNom, setParcelleNom]         = useState("");
  const [parcelleSurface, setParcelleSurface] = useState("");
  const [parcelleUnite, setParcelleUnite]     = useState("hectare");
  const [parcelleCulture, setParcelleCulture] = useState("");
  const [showCulturePicker, setShowCulturePicker] = useState(false);
  const [showUnitePicker, setShowUnitePicker]     = useState(false);
  const [aiSolResult, setAiSolResult]         = useState("");
  const [aiSolLoading, setAiSolLoading]       = useState(false);

  // Calendars
  const [calAnimaux, setCalAnimaux] = useState<CalEvent[]>([]);
  const [calSol, setCalSol]         = useState<CalEvent[]>([]);

  // ── Fetch ─────────────────────────────────────────────
  const fetchAnimals = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("animals").select("*").eq("user_id", user.id).order("created_at");
    if (data) setAnimals(data);
    setLoadingAnimals(false);
  }, [user?.id]);

  const fetchParcelles = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("parcelles").select("*").eq("user_id", user.id).order("created_at");
    if (data) setParcelles(data);
    setLoadingParcelles(false);
  }, [user?.id]);

  const fetchCalAnimaux = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("calendrier_animaux").select("*").eq("user_id", user.id).order("date");
    if (data) setCalAnimaux(data);
  }, [user?.id]);

  const fetchCalSol = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("calendrier_sol").select("*").eq("user_id", user.id).order("date");
    if (data) setCalSol(data);
  }, [user?.id]);

  useEffect(() => {
    fetchAnimals(); fetchParcelles(); fetchCalAnimaux(); fetchCalSol();
  }, [fetchAnimals, fetchParcelles, fetchCalAnimaux, fetchCalSol]);

  // ── Add / Delete Animal ───────────────────────────────
  const handleAddAnimal = async () => {
    if (!animalType)  { Alert.alert("Type requis"); return; }
    if (!animalNombre || isNaN(Number(animalNombre))) { Alert.alert("Nombre invalide"); return; }
    if (!animalPrix   || isNaN(Number(animalPrix)))   { Alert.alert("Prix invalide"); return; }
    const { data, error } = await supabase.from("animals").insert({
      user_id: user!.id, type: animalType,
      nombre: Number(animalNombre), prix_nourriture: Number(animalPrix), unite_nourriture: animalUnite,
    }).select().single();
    if (error) { Alert.alert("Erreur", error.message); return; }
    setAnimals(prev => [...prev, data]);
    setAnimalType(""); setAnimalNombre(""); setAnimalPrix("");
    setShowAddAnimal(false); setAiAnimalResult("");
  };

  const handleDeleteAnimal = (id: string) => {
    Alert.alert("Supprimer ?", "", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        await supabase.from("animals").delete().eq("id", id);
        setAnimals(prev => prev.filter(a => a.id !== id));
        setAiAnimalResult("");
      }},
    ]);
  };

  // ── Add / Delete Parcelle ────────────────────────────
  const handleAddParcelle = async () => {
    if (!parcelleNom.trim()) { Alert.alert("Nom requis"); return; }
    if (!parcelleSurface || isNaN(Number(parcelleSurface))) { Alert.alert("Surface invalide"); return; }
    if (!parcelleCulture) { Alert.alert("Culture requise"); return; }
    const { data, error } = await supabase.from("parcelles").insert({
      user_id: user!.id, nom: parcelleNom.trim(),
      superficie: Number(parcelleSurface), unite_superficie: parcelleUnite, type_culture: parcelleCulture,
    }).select().single();
    if (error) { Alert.alert("Erreur", error.message); return; }
    setParcelles(prev => [...prev, data]);
    setParcelleNom(""); setParcelleSurface(""); setParcelleCulture("");
    setShowAddParcelle(false); setAiSolResult("");
  };

  const handleDeleteParcelle = (id: string) => {
    Alert.alert("Supprimer ?", "", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        await supabase.from("parcelles").delete().eq("id", id);
        setParcelles(prev => prev.filter(p => p.id !== id));
        setAiSolResult("");
      }},
    ]);
  };

  // ── Calendar ──────────────────────────────────────────
  const addCal = async (table: "calendrier_animaux"|"calendrier_sol", date: string, commentaire: string) => {
    const { data, error } = await supabase.from(table).insert({ user_id: user!.id, date, commentaire }).select().single();
    if (error) { Alert.alert("Erreur", error.message); return; }
    if (table === "calendrier_animaux") setCalAnimaux(p => [...p, data]);
    else setCalSol(p => [...p, data]);
  };

  const deleteCal = async (table: "calendrier_animaux"|"calendrier_sol", id: string) => {
    await supabase.from(table).delete().eq("id", id);
    if (table === "calendrier_animaux") setCalAnimaux(p => p.filter(e => e.id !== id));
    else setCalSol(p => p.filter(e => e.id !== id));
  };

  // ── AI Animals ────────────────────────────────────────
  const handleAIAnimals = async () => {
    if (animals.length === 0) { Alert.alert("Ajoutez des animaux d'abord."); return; }
    setAiAnimalLoading(true);
    try {
      const summary = animals.map(a =>
        `${a.nombre} ${a.type} (prix nourriture: ${a.prix_nourriture} DA/${a.unite_nourriture})`
      ).join(", ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content:
            `Tu es un expert en élevage agricole algérien. Voici les animaux: ${summary}.
Pour CHAQUE type d'animal, calcule et explique:
1. Quantité de nourriture/jour et /mois
2. Coût total mensuel estimé
3. Conseils nutritionnels pratiques
4. Signes de bonne santé à surveiller
Réponds en français, structuré, concis, avec emojis.`
          }],
        }),
      });
      const d = await res.json();
      setAiAnimalResult(d.content?.find((c: any) => c.type === "text")?.text || "Pas de résultat.");
    } catch { Alert.alert("Erreur IA"); }
    finally { setAiAnimalLoading(false); }
  };

  // ── AI Sol ────────────────────────────────────────────
  const handleAISol = async () => {
    if (parcelles.length === 0) { Alert.alert("Ajoutez des parcelles d'abord."); return; }
    setAiSolLoading(true);
    try {
      const summary = parcelles.map(p =>
        `${p.nom}: ${p.superficie} ${p.unite_superficie} de ${p.type_culture}`
      ).join(", ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content:
            `Tu es un expert agronome algérien. Voici les parcelles: ${summary}.
Pour CHAQUE culture, donne:
1. Besoins en eau (L/m²/semaine), meilleure heure d'irrigation
2. Engrais recommandés (NPK, compost) et fréquence
3. Risques pH, phosphore, azote, potassium
4. Période de récolte en Algérie
5. Maladies courantes à prévenir
Réponds en français, structuré par culture, avec emojis.`
          }],
        }),
      });
      const d = await res.json();
      setAiSolResult(d.content?.find((c: any) => c.type === "text")?.text || "Pas de résultat.");
    } catch { Alert.alert("Erreur IA"); }
    finally { setAiSolLoading(false); }
  };

  // ── Chart data ────────────────────────────────────────
  const animalChartData = animals.map((a, i) => ({
    label: a.type, value: a.nombre, color: COLORS[i % COLORS.length],
  }));

  const animalCostData = animals.map((a, i) => {
    const info = ANIMAL_TYPES.find(t => t.label === a.type);
    const kg = (info?.food_per_day ?? 1) * a.nombre * 30;
    return { label: a.type, value: Math.round(kg * a.prix_nourriture), color: COLORS[i % COLORS.length] };
  });

  const solChartData = parcelles.map((p, i) => ({
    label: p.type_culture, value: p.superficie, color: COLORS[i % COLORS.length],
  }));

  // ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.headerBg }}>
      {/* Header */}
      <View style={{ backgroundColor: theme.headerBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>📊 Statistiques</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        {(["animaux", "sol"] as const).map(t => (
          <TouchableOpacity
            key={t} onPress={() => setTab(t)} activeOpacity={0.8}
            style={{ flex: 1, paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: tab === t ? "#16a34a" : theme.muted }}>
              {t === "animaux" ? "🐄 Animaux" : "🌱 Sol"}
            </Text>
            {tab === t && (
              <View style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, backgroundColor: "#16a34a", borderRadius: 2 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ════ ANIMAUX ════ */}
        {tab === "animaux" && (
          <>
            {/* Add button */}
            <TouchableOpacity
              style={[ss.addBtn, { backgroundColor: "#16a34a" }]}
              onPress={() => setShowAddAnimal(v => !v)} activeOpacity={0.85}
            >
              <Plus width={18} height={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {showAddAnimal ? "Annuler" : "Ajouter un animal"}
              </Text>
            </TouchableOpacity>

            {/* Add form */}
            {showAddAnimal && (
              <Card theme={theme}>
                <SH title="Nouvel animal" emoji="🐾" theme={theme} />

                <Text style={[s.label, { color: theme.muted }]}>Type d'animal *</Text>
                <TouchableOpacity
                  style={[s.selector, { backgroundColor: theme.bg, borderColor: theme.border }]}
                  onPress={() => setShowAnimalPicker(true)}
                >
                  <Text style={{ color: animalType ? theme.text : theme.muted, fontSize: 14 }}>
                    {animalType
                      ? `${ANIMAL_TYPES.find(a => a.label === animalType)?.emoji} ${animalType}`
                      : "Choisir le type..."}
                  </Text>
                  <ChevronDown width={16} height={16} color={theme.muted} />
                </TouchableOpacity>

                <Text style={[s.label, { color: theme.muted, marginTop: 12 }]}>Nombre *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: 50" placeholderTextColor={theme.muted}
                  keyboardType="numeric" value={animalNombre} onChangeText={setAnimalNombre}
                />

                <Text style={[s.label, { color: theme.muted, marginTop: 12 }]}>Prix nourriture / unité (DA) *</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[s.input, { flex: 1, backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Ex: 45" placeholderTextColor={theme.muted}
                    keyboardType="numeric" value={animalPrix} onChangeText={setAnimalPrix}
                  />
                  <TouchableOpacity
                    style={[s.selector, { backgroundColor: theme.bg, borderColor: theme.border, minWidth: 80 }]}
                    onPress={() => setShowUnitePicker2(true)}
                  >
                    <Text style={{ color: theme.text, fontSize: 13 }}>/ {animalUnite}</Text>
                    <ChevronDown width={13} height={13} color={theme.muted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[ss.submit, { marginTop: 16 }]} onPress={handleAddAnimal}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Enregistrer</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* Content */}
            {loadingAnimals ? (
              <ActivityIndicator color="#16a34a" size="large" style={{ marginTop: 20 }} />
            ) : animals.length === 0 ? (
              <Card theme={theme}>
                <Text style={{ textAlign: "center", color: theme.muted, fontSize: 14, lineHeight: 22 }}>
                  🐾 Aucun animal enregistré.{"\n"}Ajoutez votre premier animal !
                </Text>
              </Card>
            ) : (
              <>
                <Card theme={theme}>
                  <SH title="Répartition" emoji="📊" theme={theme} />
                  <DonutChart data={animalChartData} theme={theme} />
                </Card>

                <Card theme={theme}>
                  <SH title="Coût nourriture / mois" emoji="💰" theme={theme} />
                  <BarChart data={animalCostData} theme={theme} unit="DA" />
                </Card>

                <Card theme={theme}>
                  <SH title="Mes animaux" emoji="🐾" theme={theme} />
                  <View style={{ gap: 10 }}>
                    {animals.map((a, i) => {
                      const info = ANIMAL_TYPES.find(t => t.label === a.type);
                      const monthlyKg = (info?.food_per_day ?? 1) * a.nombre * 30;
                      const cost = monthlyKg * a.prix_nourriture;
                      return (
                        <View key={a.id} style={[ss.row, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                          <View style={[ss.emojiBox, { backgroundColor: COLORS[i % COLORS.length] + "22" }]}>
                            <Text style={{ fontSize: 24 }}>{ANIMAL_TYPES.find(t => t.label === a.type)?.emoji ?? "🐾"}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>{a.type}</Text>
                            <Text style={{ color: theme.muted, fontSize: 12 }}>× {a.nombre} animaux</Text>
                            <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                              {monthlyKg.toFixed(0)} {a.unite_nourriture}/mois · {cost.toLocaleString()} DA
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteAnimal(a.id)}>
                            <Trash2 width={18} height={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </Card>

                {/* AI button */}
                <TouchableOpacity
                  style={[ss.aiBtn, aiAnimalLoading && { opacity: 0.7 }]}
                  onPress={handleAIAnimals} disabled={aiAnimalLoading} activeOpacity={0.85}
                >
                  {aiAnimalLoading
                    ? <ActivityIndicator color="#fff" />
                    : <><Cpu width={18} height={18} color="#fff" /><Text style={ss.aiBtnText}>Analyse IA — Alimentation</Text></>
                  }
                </TouchableOpacity>

                {aiAnimalResult !== "" && (
                  <Card theme={theme}>
                    <SH title="Recommandations IA" emoji="🤖" theme={theme} />
                    <Text style={{ fontSize: 13, color: theme.text, lineHeight: 22 }}>{aiAnimalResult}</Text>
                  </Card>
                )}
              </>
            )}

            {/* Calendar */}
            <Card theme={theme}>
              <SH title="Calendrier Animaux" emoji="📅" theme={theme} />
              <MiniCalendar
                events={calAnimaux}
                onAddEvent={(d, c) => addCal("calendrier_animaux", d, c)}
                onDeleteEvent={(id) => deleteCal("calendrier_animaux", id)}
                theme={theme}
              />
            </Card>
          </>
        )}

        {/* ════ SOL ════ */}
        {tab === "sol" && (
          <>
            <TouchableOpacity
              style={[ss.addBtn, { backgroundColor: "#2563eb" }]}
              onPress={() => setShowAddParcelle(v => !v)} activeOpacity={0.85}
            >
              <Plus width={18} height={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {showAddParcelle ? "Annuler" : "Ajouter une parcelle"}
              </Text>
            </TouchableOpacity>

            {showAddParcelle && (
              <Card theme={theme}>
                <SH title="Nouvelle parcelle" emoji="🌍" theme={theme} />

                <Text style={[s.label, { color: theme.muted }]}>Nom de la parcelle *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ex: Parcelle Nord" placeholderTextColor={theme.muted}
                  value={parcelleNom} onChangeText={setParcelleNom}
                />

                <Text style={[s.label, { color: theme.muted, marginTop: 12 }]}>Superficie *</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[s.input, { flex: 1, backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Ex: 2.5" placeholderTextColor={theme.muted}
                    keyboardType="decimal-pad" value={parcelleSurface} onChangeText={setParcelleSurface}
                  />
                  <TouchableOpacity
                    style={[s.selector, { backgroundColor: theme.bg, borderColor: theme.border, minWidth: 100 }]}
                    onPress={() => setShowUnitePicker(true)}
                  >
                    <Text style={{ color: theme.text, fontSize: 13 }}>{parcelleUnite}</Text>
                    <ChevronDown width={14} height={14} color={theme.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={[s.label, { color: theme.muted, marginTop: 12 }]}>Type de culture *</Text>
                <TouchableOpacity
                  style={[s.selector, { backgroundColor: theme.bg, borderColor: theme.border }]}
                  onPress={() => setShowCulturePicker(true)}
                >
                  <Text style={{ color: parcelleCulture ? theme.text : theme.muted, fontSize: 14 }}>
                    {parcelleCulture
                      ? `${CULTURE_TYPES.find(c => c.label === parcelleCulture)?.emoji} ${parcelleCulture}`
                      : "Choisir la culture..."}
                  </Text>
                  <ChevronDown width={16} height={16} color={theme.muted} />
                </TouchableOpacity>

                <TouchableOpacity style={[ss.submit, { marginTop: 16, backgroundColor: "#2563eb" }]} onPress={handleAddParcelle}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Enregistrer</Text>
                </TouchableOpacity>
              </Card>
            )}

            {loadingParcelles ? (
              <ActivityIndicator color="#16a34a" size="large" style={{ marginTop: 20 }} />
            ) : parcelles.length === 0 ? (
              <Card theme={theme}>
                <Text style={{ textAlign: "center", color: theme.muted, fontSize: 14, lineHeight: 22 }}>
                  🌱 Aucune parcelle enregistrée.{"\n"}Ajoutez votre première parcelle !
                </Text>
              </Card>
            ) : (
              <>
                <Card theme={theme}>
                  <SH title="Répartition des surfaces" emoji="📊" theme={theme} />
                  <DonutChart data={solChartData} theme={theme} />
                </Card>

                <Card theme={theme}>
                  <SH title="Mes parcelles" emoji="🌍" theme={theme} />
                  <View style={{ gap: 10 }}>
                    {parcelles.map((p, i) => {
                      const culture = CULTURE_TYPES.find(c => c.label === p.type_culture);
                      return (
                        <View key={p.id} style={[ss.row, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                          <View style={[ss.emojiBox, { backgroundColor: COLORS[i % COLORS.length] + "22" }]}>
                            <Text style={{ fontSize: 24 }}>{culture?.emoji ?? "🌱"}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>{p.nom}</Text>
                            <Text style={{ color: theme.muted, fontSize: 12 }}>{p.type_culture}</Text>
                            <Text style={{ color: "#2563eb", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                              {p.superficie} {p.unite_superficie}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteParcelle(p.id)}>
                            <Trash2 width={18} height={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </Card>

                <TouchableOpacity
                  style={[ss.aiBtn, { backgroundColor: "#2563eb" }, aiSolLoading && { opacity: 0.7 }]}
                  onPress={handleAISol} disabled={aiSolLoading} activeOpacity={0.85}
                >
                  {aiSolLoading
                    ? <ActivityIndicator color="#fff" />
                    : <><FlaskConical width={18} height={18} color="#fff" /><Text style={ss.aiBtnText}>Analyse IA — Sol & Irrigation</Text></>
                  }
                </TouchableOpacity>

                {aiSolResult !== "" && (
                  <Card theme={theme}>
                    <SH title="Recommandations IA" emoji="🤖" theme={theme} />
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {[
                        { icon: <Droplets width={12} height={12} color="#2563eb" />, label: "Irrigation", bg: "#dbeafe", col: "#2563eb" },
                        { icon: <Leaf width={12} height={12} color="#16a34a" />,     label: "Engrais",    bg: "#dcfce7", col: "#16a34a" },
                        { icon: <FlaskConical width={12} height={12} color="#ca8a04" />, label: "pH & Minéraux", bg: "#fef9c3", col: "#ca8a04" },
                      ].map(pill => (
                        <View key={pill.label} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: pill.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
                          {pill.icon}
                          <Text style={{ fontSize: 11, color: pill.col, fontWeight: "600" }}>{pill.label}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={{ fontSize: 13, color: theme.text, lineHeight: 22 }}>{aiSolResult}</Text>
                  </Card>
                )}
              </>
            )}

            <Card theme={theme}>
              <SH title="Calendrier Sol" emoji="📅" theme={theme} />
              <MiniCalendar
                events={calSol}
                onAddEvent={(d, c) => addCal("calendrier_sol", d, c)}
                onDeleteEvent={(id) => deleteCal("calendrier_sol", id)}
                theme={theme}
              />
            </Card>
          </>
        )}
      </ScrollView>

      {/* Pickers */}
      <PickerSheet visible={showAnimalPicker} title="Type d'animal"
        options={ANIMAL_TYPES.map(a => ({ label: a.label, value: a.label, emoji: a.emoji }))}
        onSelect={setAnimalType} onClose={() => setShowAnimalPicker(false)} theme={theme} />

      <PickerSheet visible={showUnitePicker2} title="Unité nourriture"
        options={["kg","litre","quintal","sac"].map(u => ({ label: u, value: u }))}
        onSelect={setAnimalUnite} onClose={() => setShowUnitePicker2(false)} theme={theme} />

      <PickerSheet visible={showCulturePicker} title="Type de culture"
        options={CULTURE_TYPES.map(c => ({ label: `${c.label} (${c.type})`, value: c.label, emoji: c.emoji }))}
        onSelect={setParcelleCulture} onClose={() => setShowCulturePicker(false)} theme={theme} />

      <PickerSheet visible={showUnitePicker} title="Unité de surface"
        options={UNITES_SURFACE.map(u => ({ label: u, value: u }))}
        onSelect={setParcelleUnite} onClose={() => setShowUnitePicker(false)} theme={theme} />
    </SafeAreaView>
  );
}

// ─── Shared styles ────────────────────────────────────────
const s = StyleSheet.create({
  label:    { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  selector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
});

const ss = StyleSheet.create({
  addBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  submit:    { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  row:       { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, borderWidth: 1 },
  emojiBox:  { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aiBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: "#7c3aed", shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  aiBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

