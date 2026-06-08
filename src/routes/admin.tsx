import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { TEAMS, FASE_LABEL, FASES_ORDER, flagUrl, teamName } from "@/lib/teams";
import { brInputToIso, fmtDateTime, isoToBrInput } from "@/lib/format";
import { toast } from "sonner";
import { Trash2, Check, X, Plus, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Tab = "participantes" | "jogos" | "fases" | "campeao" | "palpites";

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("participantes");

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Layout><p className="text-center text-muted-foreground mt-10">Acesso restrito.</p></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-extrabold mb-4">Administração</h1>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {(["participantes","jogos","fases","campeao","palpites"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border ${tab===t?"bg-accent text-accent-foreground border-accent":"bg-secondary border-border"}`}>
            {labelTab(t)}
          </button>
        ))}
      </div>

      {tab === "participantes" && <Participantes />}
      {tab === "jogos" && <Jogos />}
      {tab === "fases" && <Fases />}
      {tab === "campeao" && <Campeao />}
      {tab === "palpites" && <Palpites />}
    </Layout>
  );
}
function labelTab(t: Tab) {
  return { participantes: "Participantes", jogos: "Jogos", fases: "Fases", campeao: "Campeão oficial", palpites: "Palpites" }[t];
}

/* ---------- Participantes ---------- */
function Participantes() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: "aprovado" | "rejeitado" | "pendente") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="card-premium rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{r.nome}</div>
            <div className="text-xs text-muted-foreground truncate">{r.email}</div>
            <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded font-bold ${
              r.status === "aprovado" ? "bg-success text-success-foreground" :
              r.status === "pendente" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"
            }`}>{r.status}</span>
          </div>
          <div className="flex gap-1.5">
            {r.status !== "aprovado" && <button onClick={() => setStatus(r.id, "aprovado")} className="p-2 rounded-md bg-success text-success-foreground" title="Aprovar"><Check className="w-4 h-4" /></button>}
            {r.status !== "rejeitado" && <button onClick={() => setStatus(r.id, "rejeitado")} className="p-2 rounded-md bg-destructive text-destructive-foreground" title="Rejeitar"><X className="w-4 h-4" /></button>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Jogos ---------- */
function Jogos() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const load = () => supabase.from("jogos").select("*").order("data_hora").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const novo = () => setEditing({ fase: "grupos", grupo: "", time_a: "br", time_b: "ar", bandeira_a: "br", bandeira_b: "ar", data_hora: new Date().toISOString(), gols_a: null, gols_b: null });

  const salvar = async () => {
    const payload = { ...editing };
    payload.time_a = payload.bandeira_a;
    payload.time_b = payload.bandeira_b;
    payload.grupo = payload.grupo || null;
    payload.gols_a = payload.gols_a === "" || payload.gols_a == null ? null : Number(payload.gols_a);
    payload.gols_b = payload.gols_b === "" || payload.gols_b == null ? null : Number(payload.gols_b);
    const { error } = editing.id
      ? await supabase.from("jogos").update(payload).eq("id", editing.id)
      : await supabase.from("jogos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null); load();
  };

  const remover = async (id: string) => {
    if (!confirm("Excluir jogo?")) return;
    const { error } = await supabase.from("jogos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <button onClick={novo} className="mb-3 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> Novo jogo</button>
      <div className="space-y-2">
        {rows.map((j) => (
          <div key={j.id} className="card-premium rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="font-bold text-accent">{FASE_LABEL[j.fase]}</span>
              {j.grupo && <span>· Grupo {j.grupo}</span>}
              <span className="ml-auto">{fmtDateTime(j.data_hora)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <img src={flagUrl(j.bandeira_a ?? j.time_a, 40)} className="w-7 h-5 rounded" alt="" />
              <span className="font-bold flex-1 truncate">{teamName(j.bandeira_a ?? j.time_a)}</span>
              <span className="font-extrabold text-gold">{j.gols_a ?? "-"} × {j.gols_b ?? "-"}</span>
              <span className="font-bold flex-1 truncate text-right">{teamName(j.bandeira_b ?? j.time_b)}</span>
              <img src={flagUrl(j.bandeira_b ?? j.time_b, 40)} className="w-7 h-5 rounded" alt="" />
            </div>
            <div className="flex gap-1.5 mt-2 justify-end">
              <button onClick={() => setEditing({ ...j, data_hora_local: isoToBrInput(j.data_hora) })} className="p-2 rounded-md bg-secondary"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => remover(j.id)} className="p-2 rounded-md bg-destructive text-destructive-foreground"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="card-premium rounded-2xl p-5 w-full max-w-md max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-3">{editing.id ? "Editar jogo" : "Novo jogo"}</h3>
            <div className="space-y-3 text-sm">
              <Field label="Fase">
                <select value={editing.fase} onChange={(e) => setEditing({ ...editing, fase: e.target.value })} className="select">
                  {FASES_ORDER.map((f) => <option key={f} value={f}>{FASE_LABEL[f]}</option>)}
                </select>
              </Field>
              <Field label="Grupo (apenas fase de grupos)">
                <input value={editing.grupo ?? ""} maxLength={2} onChange={(e) => setEditing({ ...editing, grupo: e.target.value.toUpperCase() })} className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Seleção A">
                  <TeamSelect value={editing.bandeira_a} onChange={(v) => setEditing({ ...editing, bandeira_a: v })} />
                </Field>
                <Field label="Seleção B">
                  <TeamSelect value={editing.bandeira_b} onChange={(v) => setEditing({ ...editing, bandeira_b: v })} />
                </Field>
              </div>
              <Field label="Data e horário (Brasília)">
                <input type="datetime-local" value={editing.data_hora_local ?? isoToBrInput(editing.data_hora)} onChange={(e) => setEditing({ ...editing, data_hora_local: e.target.value, data_hora: brInputToIso(e.target.value) })} className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gols A (resultado)"><input type="number" min={0} value={editing.gols_a ?? ""} onChange={(e) => setEditing({ ...editing, gols_a: e.target.value })} className="input" /></Field>
                <Field label="Gols B (resultado)"><input type="number" min={0} value={editing.gols_b ?? ""} onChange={(e) => setEditing({ ...editing, gols_b: e.target.value })} className="input" /></Field>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-lg bg-secondary font-bold">Cancelar</button>
                <button onClick={salvar} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-extrabold">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input, .select { width: 100%; padding: 0.6rem 0.7rem; border-radius: 0.5rem; background: var(--input); border: 1px solid var(--border); color: var(--foreground); }
        .select { appearance: none; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span><div className="mt-1">{children}</div></label>;
}

function TeamSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {value && <img src={flagUrl(value, 40)} className="w-7 h-5 rounded" alt="" />}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="select">
        {TEAMS.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
      </select>
    </div>
  );
}

/* ---------- Fases ---------- */
function Fases() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("fases").select("*").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const save = async (f: any, ab: string, fc: string) => {
    const { error } = await supabase.from("fases").update({ abertura: brInputToIso(ab), encerramento: brInputToIso(fc) }).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Fase atualizada");
    load();
  };
  return (
    <div className="space-y-3">
      {FASES_ORDER.map((nome) => {
        const f = rows.find((r) => r.nome === nome);
        if (!f) return null;
        return <FaseRow key={f.id} fase={f} onSave={save} />;
      })}
    </div>
  );
}
function FaseRow({ fase, onSave }: { fase: any; onSave: (f: any, a: string, b: string) => void }) {
  const [ab, setAb] = useState(isoToBrInput(fase.abertura));
  const [fc, setFc] = useState(isoToBrInput(fase.encerramento));
  return (
    <div className="card-premium rounded-xl p-3 space-y-2">
      <div className="font-bold text-accent">{FASE_LABEL[fase.nome]}</div>
      <Field label="Abertura"><input type="datetime-local" value={ab} onChange={(e) => setAb(e.target.value)} className="input" /></Field>
      <Field label="Encerramento"><input type="datetime-local" value={fc} onChange={(e) => setFc(e.target.value)} className="input" /></Field>
      <button onClick={() => onSave(fase, ab, fc)} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold">Salvar período</button>
    </div>
  );
}

/* ---------- Campeão Oficial ---------- */
function Campeao() {
  const [val, setVal] = useState("");
  useEffect(() => { supabase.from("config").select("campeao_oficial").eq("id", 1).maybeSingle().then(({ data }) => setVal(data?.campeao_oficial ?? "")); }, []);
  const save = async () => {
    const { error } = await supabase.from("config").update({ campeao_oficial: val || null }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Campeão oficial atualizado · ranking recalculado");
  };
  return (
    <div className="card-premium rounded-2xl p-4">
      <p className="text-sm text-muted-foreground mb-3">Definir o campeão oficial vale +10 pontos para quem acertou.</p>
      <TeamSelect value={val} onChange={setVal} />
      <button onClick={save} className="mt-4 w-full py-2.5 rounded-lg bg-gold text-gold-foreground font-extrabold">Salvar campeão oficial</button>
      <button onClick={() => { setVal(""); save(); }} className="mt-2 w-full py-2 rounded-lg bg-secondary text-sm">Limpar</button>
    </div>
  );
}

/* ---------- Palpites (visualização) ---------- */
function Palpites() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("palpites").select("gols_a,gols_b,profiles(nome,email),jogos(time_a,time_b,bandeira_a,bandeira_b,data_hora,fase)").then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Sem palpites ainda.</p>}
      {rows.map((p, i) => (
        <div key={i} className="card-premium rounded-xl p-3 text-sm">
          <div className="font-bold truncate">{p.profiles?.nome}</div>
          <div className="text-xs text-muted-foreground">{FASE_LABEL[p.jogos?.fase]} · {fmtDateTime(p.jogos?.data_hora)}</div>
          <div className="mt-1 flex items-center gap-2">
            <img src={flagUrl(p.jogos?.bandeira_a ?? p.jogos?.time_a, 40)} className="w-6 h-4 rounded" alt="" />
            <span className="flex-1 truncate">{teamName(p.jogos?.bandeira_a ?? p.jogos?.time_a)}</span>
            <b>{p.gols_a} × {p.gols_b}</b>
            <span className="flex-1 truncate text-right">{teamName(p.jogos?.bandeira_b ?? p.jogos?.time_b)}</span>
            <img src={flagUrl(p.jogos?.bandeira_b ?? p.jogos?.time_b, 40)} className="w-6 h-4 rounded" alt="" />
          </div>
        </div>
      ))}
    </div>
  );
}
