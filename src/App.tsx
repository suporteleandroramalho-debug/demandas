import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, ChevronRight, ChevronDown, ChevronUp, X, AlertTriangle,
  CheckCircle2, Clock, CircleDashed, Ban, Bell, Siren, CalendarClock,
  Download, Expand, Minimize2, ArrowUpDown, ArrowUp, ArrowDown,
  CalendarDays, Filter, Check, Trash2, Sparkles, Zap, Target, Pencil,
  BarChart2, GanttChart
} from 'lucide-react';

// ============================================================================
// CONFIG
// ============================================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbya1KpcTtyAXqoMekfZU_VK7OiWWKcHK6od59GTQCoamDxyjYje06oUUYzLRfmBnD_o/exec';

// Ordem exibida no dropdown de status (v2: Concluído, Em andamento, Não iniciado, Cancelado)
const STATUS_OPTIONS = ['Concluído', 'Em andamento', 'Não iniciado', 'Cancelado'];
const PRIORIDADE_OPTIONS = ['Normal', 'Alta'];

const STATUS_STYLE = {
  'Não iniciado': {
    bg: 'bg-amber-50', bgDeep: 'bg-amber-100', bgHover: 'hover:bg-amber-100',
    border: 'border-l-amber-400', text: 'text-amber-900',
    chip: 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900 ring-amber-300',
    dot: 'bg-amber-400', dotColor: '#f59e0b', icon: Clock, label: 'Não iniciado', short: 'Não iniciado',
    iconColor: 'text-amber-500',
  },
  'Em andamento': {
    bg: 'bg-sky-50', bgDeep: 'bg-sky-100', bgHover: 'hover:bg-sky-100',
    border: 'border-l-sky-500', text: 'text-sky-900',
    chip: 'bg-gradient-to-r from-sky-200 to-sky-100 text-sky-900 ring-sky-300',
    dot: 'bg-sky-500', dotColor: '#0ea5e9', icon: CircleDashed, label: 'Em andamento', short: 'Andamento',
    iconColor: 'text-sky-500',
  },
  'Concluído': {
    bg: 'bg-emerald-50', bgDeep: 'bg-emerald-100', bgHover: 'hover:bg-emerald-100',
    border: 'border-l-emerald-500', text: 'text-emerald-900',
    chip: 'bg-gradient-to-r from-emerald-200 to-emerald-100 text-emerald-900 ring-emerald-300',
    dot: 'bg-emerald-500', dotColor: '#10b981', icon: CheckCircle2, label: 'Concluído', short: 'Concluído',
    iconColor: 'text-emerald-500',
  },
  'Cancelado': {
    bg: 'bg-neutral-100', bgDeep: 'bg-neutral-200', bgHover: 'hover:bg-neutral-200',
    border: 'border-l-neutral-400', text: 'text-neutral-600',
    chip: 'bg-gradient-to-r from-neutral-200 to-neutral-100 text-neutral-600 ring-neutral-300',
    dot: 'bg-neutral-400', dotColor: '#9ca3af', icon: Ban, label: 'Cancelado', short: 'Cancelado',
    iconColor: 'text-neutral-400',
  },
  // Legado — mapeado internamente
  'Pendente': {
    bg: 'bg-amber-50', bgDeep: 'bg-amber-100', bgHover: 'hover:bg-amber-100',
    border: 'border-l-amber-400', text: 'text-amber-900',
    chip: 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900 ring-amber-300',
    dot: 'bg-amber-400', dotColor: '#f59e0b', icon: Clock, label: 'Não iniciado', short: 'Não iniciado',
    iconColor: 'text-amber-500',
  },
};

// Normaliza status legado
const normalizeStatus = (s) => {
  if (s === 'Pendente') return 'Não iniciado';
  if (s === 'Andamento') return 'Em andamento';
  return s || 'Não iniciado';
};

const AVATAR_PALETTE = [
  { bg: 'bg-rose-500', ring: 'ring-rose-200' },
  { bg: 'bg-orange-500', ring: 'ring-orange-200' },
  { bg: 'bg-amber-500', ring: 'ring-amber-200' },
  { bg: 'bg-lime-500', ring: 'ring-lime-200' },
  { bg: 'bg-emerald-500', ring: 'ring-emerald-200' },
  { bg: 'bg-teal-500', ring: 'ring-teal-200' },
  { bg: 'bg-cyan-500', ring: 'ring-cyan-200' },
  { bg: 'bg-sky-500', ring: 'ring-sky-200' },
  { bg: 'bg-indigo-500', ring: 'ring-indigo-200' },
  { bg: 'bg-violet-500', ring: 'ring-violet-200' },
  { bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-200' },
  { bg: 'bg-pink-500', ring: 'ring-pink-200' },
];

const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const avatarFor = (name) => {
  if (!name) return { bg: 'bg-stone-300', ring: 'ring-stone-200', initial: '?' };
  const clean = name.replace(/[()]/g, '').trim();
  const color = AVATAR_PALETTE[hashCode(clean) % AVATAR_PALETTE.length];
  const initial = clean.charAt(0).toUpperCase();
  return { ...color, initial };
};

// ============================================================================
// HELPERS
// ============================================================================
const cleanDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string') {
    if (v.includes('T')) return v.substring(0, 10);
    return v;
  }
  return '';
};

const fmtDate = (iso) => {
  const clean = cleanDate(iso);
  if (!clean) return '—';
  const parts = clean.split('-');
  if (parts.length !== 3) return '—';
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysUntil = (iso) => {
  const clean = cleanDate(iso);
  if (!clean) return null;
  const target = new Date(clean + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const diff = target - today();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const getSituacao = (item) => {
  if (!cleanDate(item.dataPrazo)) return null;
  if (item.status === 'Concluído' || item.status === 'Cancelado') return null;
  const d = daysUntil(item.dataPrazo);
  if (d === null) return null;
  if (d < 0) return { kind: 'atrasada', days: d };
  if (d === 0) return { kind: 'hoje', days: 0 };
  return { kind: 'no-prazo', days: d };
};

const parseId = (id) => {
  const parts = String(id).split('.');
  return { main: parseInt(parts[0], 10) || 0, sub: parts[1] ? parseInt(parts[1], 10) : 0 };
};

// Nível do ID: "7" = 0, "7.1" = 1, "7.1.1" = 2
const idLevel = (id) => String(id).split('.').length - 1;

const sortWithHierarchy = (items, sortKey, sortDir) => {
  const tarefas = items.filter(i => idLevel(i.id) === 0);
  const subsByParent = {};
  items.filter(i => idLevel(i.id) >= 1).forEach(s => {
    const parentId = String(s.id).split('.').slice(0, -1).join('.');
    if (!subsByParent[parentId]) subsByParent[parentId] = [];
    subsByParent[parentId].push(s);
  });

  const sortFn = (a, b) => {
    let cmp = 0;
    if (sortKey === 'id') {
      cmp = parseId(a.id).main - parseId(b.id).main;
    } else if (sortKey === 'descricao') {
      cmp = a.descricao.localeCompare(b.descricao, 'pt-BR');
    } else if (sortKey === 'prioridade') {
      // Blank (concluído/cancelado) sempre no final
      const isDoneA = a.status === 'Concluído' || a.status === 'Cancelado';
      const isDoneB = b.status === 'Concluído' || b.status === 'Cancelado';
      if (isDoneA && !isDoneB) return 1;
      if (!isDoneA && isDoneB) return -1;
      cmp = (a.prioridade === 'Alta' ? 0 : 1) - (b.prioridade === 'Alta' ? 0 : 1);
    } else if (sortKey === 'status') {
      // Ordem alfabética: Andamento, Cancelado, Concluído, Não iniciado
      const statusLabel = (s) => {
        const st = STATUS_STYLE[normalizeStatus(s)];
        return st ? st.label : s;
      };
      cmp = statusLabel(a.status).localeCompare(statusLabel(b.status), 'pt-BR');
    } else if (sortKey === 'dataSolic') {
      cmp = (cleanDate(a.dataSolic) || '9999').localeCompare(cleanDate(b.dataSolic) || '9999');
    } else if (sortKey === 'dataPrazo') {
      // Datas em branco sempre no final, independente da direção
      const da = cleanDate(a.dataPrazo), db = cleanDate(b.dataPrazo);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      cmp = da.localeCompare(db);
    } else if (sortKey === 'solicitante') {
      cmp = (a.solicitante || 'zzz').localeCompare(b.solicitante || 'zzz', 'pt-BR');
    } else if (sortKey === 'diasRestantes') {
      const da = daysUntil(a.dataPrazo);
      const db = daysUntil(b.dataPrazo);
      // Sem data sempre no final, independente da direção
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      cmp = da - db;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  };

  const sorted = [...tarefas].sort(sortFn);

  // Recursivamente insere filhos em ordem
  const insertChildren = (result, parentId) => {
    const children = (subsByParent[parentId] || []).sort((a, b) => {
      const pa = parseId(a.id), pb = parseId(b.id);
      return pa.sub - pb.sub;
    });
    children.forEach(child => {
      result.push(child);
      insertChildren(result, String(child.id));
    });
  };

  const result = [];
  sorted.forEach(t => {
    result.push(t);
    insertChildren(result, String(t.id));
  });

  // Órfãs
  const handled = new Set(result.map(i => i.id));
  items.filter(i => !handled.has(i.id)).forEach(o => result.push(o));

  return result;
};

const nextMainId = (items) => {
  const ids = items.filter(i => idLevel(i.id) === 0).map(i => parseInt(i.id, 10)).filter(n => !isNaN(n));
  return String(ids.length ? Math.max(...ids) + 1 : 1);
};

const nextSubId = (items, idPrincipal) => {
  const directSubs = items.filter(i => {
    const parts = String(i.id).split('.');
    const parentParts = String(idPrincipal).split('.');
    return parts.length === parentParts.length + 1 && String(i.id).startsWith(idPrincipal + '.');
  }).map(i => {
    const parts = String(i.id).split('.');
    return parseInt(parts[parts.length - 1], 10);
  }).filter(n => !isNaN(n));
  const next = directSubs.length ? Math.max(...directSubs) + 1 : 1;
  return `${idPrincipal}.${next}`;
};

// API
const api = {
  async list() {
    if (!API_URL) return null;
    const r = await fetch(`${API_URL}?action=list`);
    if (!r.ok) throw new Error('Falha ao listar');
    return r.json();
  },
  async create(item) {
    if (!API_URL) return item;
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'create', item }) });
    return r.json();
  },
  async update(item) {
    if (!API_URL) return item;
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update', item }) });
    return r.json();
  },
  async remove(id) {
    if (!API_URL) return { ok: true };
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
    return r.json();
  },
};

// ============================================================================
// APP PRINCIPAL
// ============================================================================
export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(new Set());
  const [filterPrioridade, setFilterPrioridade] = useState(new Set());
  const [filterSolicitante, setFilterSolicitante] = useState(new Set());
  const [filterSituacao, setFilterSituacao] = useState(new Set());
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [collapsed, setCollapsed] = useState(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('table'); // 'table' | 'gantt'

  useEffect(() => {
    if (!API_URL) { setLoading(false); return; }
    api.list()
      .then(data => {
        if (data && Array.isArray(data)) {
          setItems(data.map(i => ({ ...i, status: normalizeStatus(i.status) })));
        }
      })
      .catch(() => showToast('Erro ao conectar. Verifique a API.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const solicitantes = useMemo(() => {
    return [...new Set(items.map(i => i.solicitante).filter(Boolean))].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (it) => {
      if (q && !it.descricao.toLowerCase().includes(q) && !String(it.id).includes(q)) return false;
      if (filterStatus.size > 0 && !filterStatus.has(normalizeStatus(it.status))) return false;
      if (filterPrioridade.size > 0 && !filterPrioridade.has(it.prioridade)) return false;
      if (filterSolicitante.size > 0 && !filterSolicitante.has(it.solicitante || '(sem)')) return false;
      if (filterSituacao.size > 0) {
        const sit = getSituacao(it);
        const kind = sit ? sit.kind : 'sem-prazo';
        if (!filterSituacao.has(kind)) return false;
      }
      return true;
    };
    const keep = new Set();
    items.forEach(it => {
      if (match(it)) {
        keep.add(it.id);
        // sobe pra tarefa principal
        if (idLevel(it.id) >= 1) {
          const parts = String(it.id).split('.');
          for (let l = 1; l < parts.length; l++) {
            keep.add(parts.slice(0, l).join('.'));
          }
        }
        // desce pra subtarefas
        if (idLevel(it.id) === 0) {
          items.filter(s => String(s.id).startsWith(it.id + '.')).forEach(s => keep.add(s.id));
        }
      }
    });
    return items.filter(it => keep.has(it.id));
  }, [items, search, filterStatus, filterPrioridade, filterSolicitante, filterSituacao]);

  const hierarchical = useMemo(() => sortWithHierarchy(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const visibleRows = useMemo(() => {
    return hierarchical.filter(it => {
      const parts = String(it.id).split('.');
      for (let l = 1; l < parts.length; l++) {
        if (collapsed.has(parts.slice(0, l).join('.'))) return false;
      }
      return true;
    });
  }, [hierarchical, collapsed]);

  // Progresso — exclui canceladas da contagem
  const getProgress = useCallback((taskId) => {
    const allSubs = items.filter(i => String(i.id).startsWith(taskId + '.') && idLevel(i.id) === idLevel(taskId) + 1);
    const activeSubs = allSubs.filter(s => normalizeStatus(s.status) !== 'Cancelado');
    if (activeSubs.length === 0) return null;
    const done = activeSubs.filter(s => normalizeStatus(s.status) === 'Concluído').length;
    return { done, total: activeSubs.length, pct: Math.round((done / activeSubs.length) * 100) };
  }, [items]);

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsed(new Set());
      setAllCollapsed(false);
    } else {
      const ids = new Set(items.filter(i => idLevel(i.id) === 0).map(i => i.id));
      setCollapsed(ids);
      setAllCollapsed(true);
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    const updated = { ...item, status: newStatus };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    try { await api.update(updated); showToast(`Status: ${newStatus}`); }
    catch { showToast('Erro ao salvar', 'error'); }
  };

  const handleFieldUpdate = async (item, field, value) => {
    const updated = { ...item, [field]: value };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    setEditing(null);
    try { await api.update(updated); showToast('Campo atualizado'); }
    catch { showToast('Erro ao salvar', 'error'); }
  };

  const handleSave = async (data) => {
    const normalized = { ...data, status: normalizeStatus(data.status) };
    if (modal.mode === 'create') {
      const id = idLevel(data.idPrincipal || '') >= 0 && data.idPrincipal
        ? nextSubId(items, data.idPrincipal)
        : nextMainId(items);
      const novo = { ...normalized, id };
      setItems(prev => [...prev, novo]);
      try { await api.create(novo); showToast('Tarefa criada'); }
      catch { showToast('Erro no servidor', 'error'); }
    } else {
      setItems(prev => prev.map(i => i.id === normalized.id ? normalized : i));
      try { await api.update(normalized); showToast('Salvo'); }
      catch { showToast('Erro no servidor', 'error'); }
    }
    setModal(null);
  };

  const handleDelete = async (item) => {
    const ids = new Set([item.id]);
    items.filter(i => String(i.id).startsWith(item.id + '.')).forEach(s => ids.add(s.id));
    setItems(prev => prev.filter(i => !ids.has(i.id)));
    try { for (const id of ids) await api.remove(id); showToast(`Excluído`); }
    catch { showToast('Erro ao excluir', 'error'); }
    setConfirmDel(null);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Tipo', 'ID Principal', 'Descrição', 'Prioridade', 'Status', 'Data Solic.', 'Data Prazo', 'Dias Restantes', 'Situação', 'Solicitante'];
    const rows = sortWithHierarchy(items, 'id', 'asc').map(i => {
      const sit = getSituacao(i);
      return [
        i.id, i.tipo, i.idPrincipal || '', i.descricao, i.prioridade, i.status,
        cleanDate(i.dataSolic), cleanDate(i.dataPrazo),
        daysUntil(i.dataPrazo) ?? '',
        sit ? sit.kind : '',
        i.solicitante
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `demandas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado');
  };

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'id' ? 'desc' : key === 'diasRestantes' ? 'asc' : 'asc');
    }
  };

  const clearFilters = () => {
    setSearch(''); setFilterStatus(new Set()); setFilterPrioridade(new Set());
    setFilterSolicitante(new Set()); setFilterSituacao(new Set());
  };

  const anyFilter = search || filterStatus.size || filterPrioridade.size || filterSolicitante.size || filterSituacao.size;
  const tarefasPrincipais = items.filter(i => idLevel(i.id) === 0);

  // Abre modal de nova tarefa com foco automático no campo descrição
  const openNewTask = (defaults = { tipo: 'Tarefa' }) => {
    setModal({ mode: 'create', defaults, autoFocus: true });
  };

  return (
    <div className="min-h-screen font-body text-stone-900" style={{
      background: 'radial-gradient(ellipse at top, #fafaf9 0%, #f5f5f4 40%, #e7e5e4 100%)',
      fontFamily: "'Geist', 'Inter', ui-sans-serif, system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
        .font-serif-display { font-family: 'Instrument Serif', 'Georgia', serif; }
        .font-body { font-family: 'Geist', 'Inter', ui-sans-serif, system-ui, sans-serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.5); } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } }
        @keyframes creditShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes creditFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .row-appear { animation: fadeInUp 0.3s ease-out backwards; }
        .shimmer-load { background: linear-gradient(90deg, #f5f5f4 25%, #e7e5e4 50%, #f5f5f4 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        .atrasada-pulse { animation: pulse-ring 2s infinite; }
        .grain { position: relative; }
        .grain::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.015; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .chevron-smooth { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .credit-shine {
          background: linear-gradient(90deg, #94a3b8 0%, #f1f5f9 40%, #cbd5e1 60%, #94a3b8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: creditShine 3s linear infinite, creditFloat 2.5s ease-in-out infinite;
          display: inline-block;
        }
        /* Largura fixa para todos os chips de status */
        .status-chip-fixed { min-width: 116px; display: inline-flex; justify-content: center; white-space: nowrap; }
        /* Dropdown de filtro acima da tabela — posicionado via JS com position:fixed */
      `}</style>

      <Header
        onExport={exportCSV}
        onNew={() => openNewTask()}
        onToggleAll={toggleAll}
        allCollapsed={allCollapsed}
        total={items.length}
        view={view}
        setView={setView}
      />

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <Toolbar
          search={search} setSearch={setSearch}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterPrioridade={filterPrioridade} setFilterPrioridade={setFilterPrioridade}
          filterSolicitante={filterSolicitante} setFilterSolicitante={setFilterSolicitante}
          filterSituacao={filterSituacao} setFilterSituacao={setFilterSituacao}
          solicitantes={solicitantes}
          onClear={clearFilters} anyFilter={anyFilter}
        />

        {view === 'gantt' ? (
          <GanttView items={items} onToggleAll={toggleAll} allCollapsed={allCollapsed} />
        ) : (
          <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm grain">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <TableHeader sortKey={sortKey} sortDir={sortDir} setSort={setSort} />
                <tbody>
                  {loading && <LoadingRows />}
                  {!loading && visibleRows.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-20 text-stone-400">
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles className="w-6 h-6 text-stone-300" />
                        <span className="font-serif-display text-xl italic">Nada por aqui</span>
                        <span className="text-xs">Nenhuma demanda encontrada com os filtros aplicados</span>
                      </div>
                    </td></tr>
                  )}
                  {!loading && visibleRows.map((item, idx) => (
                    <Row
                      key={item.id}
                      item={item}
                      items={items}
                      collapsed={collapsed}
                      onToggle={toggleCollapse}
                      onStatusChange={handleStatusChange}
                      onEdit={() => setModal({ mode: 'edit', item })}
                      onDelete={() => setConfirmDel(item)}
                      onAddSub={() => openNewTask({ tipo: 'Subtarefa', idPrincipal: item.id })}
                      onFieldUpdate={handleFieldUpdate}
                      editing={editing}
                      setEditing={setEditing}
                      solicitantes={solicitantes}
                      getProgress={getProgress}
                      rowIndex={idx}
                      isLast={idx >= visibleRows.length - 3}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-stone-200/80 text-xs text-stone-500 flex items-center justify-between bg-gradient-to-r from-stone-50/80 to-white/80">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {visibleRows.length} de {items.length} {items.length === 1 ? 'item' : 'itens'}
                {anyFilter && <span className="text-stone-400">· filtros ativos</span>}
              </span>
              <span className="text-stone-400 text-[10px] uppercase tracking-widest">
                {API_URL ? 'Sincronizado · Google Sheets' : 'Modo local'}
              </span>
            </div>
          </div>
        )}

        {/* Crédito animado */}
        <div className="mt-8 text-center py-4">
          <span className="credit-shine text-sm font-semibold tracking-wider">
            ✦ Sistema desenvolvido por Leandro Ramalho da Silva ✦
          </span>
        </div>
      </main>

      {modal && (
        <TaskModal
          mode={modal.mode} item={modal.item} defaults={modal.defaults}
          autoFocus={modal.autoFocus}
          tarefasPrincipais={tarefasPrincipais}
          solicitantes={solicitantes}
          onClose={() => setModal(null)} onSave={handleSave}
          onRequestDelete={(it) => setConfirmDel(it)}
        />
      )}

      {confirmDel && (
        <ConfirmDialog item={confirmDel} items={items} onCancel={() => setConfirmDel(null)} onConfirm={() => handleDelete(confirmDel)} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================
function Header({ onExport, onNew, onToggleAll, allCollapsed, total, view, setView }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-stone-200/60">
      <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
              <Target className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-serif-display text-3xl text-slate-900 tracking-tight leading-none">Demandas</h1>
            <p className="text-xs text-stone-500 mt-1 font-medium tracking-wide">
              <span className="tabular-nums">{total}</span> itens · atualizações em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle de visão */}
          <div className="flex items-center bg-stone-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('table')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${view === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-700'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Tabela
            </button>
            <button
              onClick={() => setView('gantt')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${view === 'gantt' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-700'}`}
            >
              <GanttChart className="w-3.5 h-3.5" /> Gantt
            </button>
          </div>

          <button onClick={onToggleAll} className="text-sm text-stone-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-all font-medium" title={allCollapsed ? 'Expandir todas' : 'Recolher todas'}>
            {allCollapsed ? <Expand className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{allCollapsed ? 'Expandir' : 'Recolher'}</span>
          </button>
          <button onClick={onExport} className="text-sm text-stone-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-all font-medium">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Exportar</span>
          </button>
          <button onClick={onNew} className="bg-gradient-to-br from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-slate-900/20 hover:shadow-lg hover:shadow-slate-900/30 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Nova Tarefa
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// TOOLBAR
// ============================================================================
function Toolbar({ search, setSearch, filterStatus, setFilterStatus, filterPrioridade, setFilterPrioridade, filterSolicitante, setFilterSolicitante, filterSituacao, setFilterSituacao, solicitantes, onClear, anyFilter }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2 shadow-sm">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por descrição ou ID..."
          className="w-full pl-10 pr-3 py-2.5 text-sm border border-stone-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-stone-50/80 placeholder:text-stone-400"
        />
      </div>

      <MultiSelectFilter icon={CircleDashed} label="Status" values={filterStatus} setValues={setFilterStatus}
        options={STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_STYLE[s]?.short || s }))} />
      <MultiSelectFilter icon={Siren} label="Prioridade" values={filterPrioridade} setValues={setFilterPrioridade}
        options={PRIORIDADE_OPTIONS.map(p => ({ value: p, label: p }))} />
      <MultiSelectFilter icon={CalendarClock} label="Situação" values={filterSituacao} setValues={setFilterSituacao}
        options={[
          { value: 'no-prazo', label: 'No prazo' },
          { value: 'hoje', label: 'Vence hoje' },
          { value: 'atrasada', label: 'Atrasada' },
          { value: 'sem-prazo', label: 'Sem prazo' },
        ]} />
      {solicitantes.length > 0 && (
        <MultiSelectFilter icon={Filter} label="Solicitante" values={filterSolicitante} setValues={setFilterSolicitante}
          options={solicitantes.map(s => ({ value: s, label: s }))} />
      )}

      {anyFilter && (
        <button onClick={onClear} className="text-xs text-stone-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors font-medium">
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function MultiSelectFilter({ icon: Icon, label, values, setValues, options }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  // Calcula posição do dropdown baseado no botão (position: fixed sai do stacking context da tabela)
  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    const h = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = (v) => {
    setValues(prev => {
      const n = new Set(prev);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  };

  const count = values.size;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`text-sm border rounded-xl px-3 py-2.5 bg-white/80 hover:bg-white flex items-center gap-2 transition-all font-medium ${count > 0 ? 'border-slate-900 text-slate-900' : 'border-stone-200 text-stone-600'}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
        {count > 0 && <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">{count}</span>}
        <ChevronDown className={`w-3.5 h-3.5 chevron-smooth ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 99999 }}
          className="bg-white border border-stone-200 rounded-xl shadow-2xl min-w-[200px] overflow-hidden"
        >
          <div className="p-1.5">
            {options.map(opt => {
              const active = values.has(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`w-full text-left px-2.5 py-2 text-sm flex items-center gap-2.5 rounded-lg transition-colors ${active ? 'bg-slate-100 text-slate-900 font-medium' : 'hover:bg-stone-50 text-stone-700'}`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${active ? 'bg-slate-900 border-slate-900' : 'border-stone-300'}`}>
                    {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  {opt.label}
                </button>
              );
            })}
          </div>
          {count > 0 && (
            <div className="border-t border-stone-100 p-1.5">
              <button onClick={() => setValues(new Set())} className="w-full text-left px-2.5 py-1.5 text-xs text-stone-500 hover:bg-stone-50 rounded-md">
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TABLE HEADER
// ============================================================================
function TableHeader({ sortKey, sortDir, setSort }) {
  const H = ({ k, children, className = '' }) => {
    const active = sortKey === k;
    const Arrow = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th className={`text-left py-3.5 px-3 font-semibold text-[11px] uppercase tracking-wider ${className}`}>
        <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors ${active ? 'text-slate-900' : 'text-stone-500'}`}>
          {children}
          <Arrow className="w-3 h-3" strokeWidth={active ? 2.5 : 2} />
        </button>
      </th>
    );
  };
  return (
    <thead>
      <tr className="bg-gradient-to-b from-stone-100/80 to-stone-50/80 border-b border-stone-200/80 backdrop-blur-sm">
        <th className="w-10"></th>
        <H k="id" className="w-24">ID</H>
        <H k="descricao">Descrição</H>
        <H k="prioridade" className="w-28">Prioridade</H>
        <H k="status" className="w-36">Status</H>
        <H k="dataSolic" className="w-24">Solic.</H>
        <H k="dataPrazo" className="w-24">Prazo</H>
        <H k="diasRestantes" className="w-24">Dias</H>
        <H k="solicitante" className="w-32">Solicitante</H>
        <th className="w-24 py-3.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 text-center">Ações</th>
      </tr>
    </thead>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================
function LoadingRows() {
  return (
    <>{[0, 1, 2, 3, 4].map(i => (
      <tr key={i} className="border-b border-stone-100">
        <td colSpan={10} className="p-3">
          <div className="shimmer-load h-6 rounded"></div>
        </td>
      </tr>
    ))}</>
  );
}

// ============================================================================
// LINHA DA TABELA
// ============================================================================
function Row({ item, items, collapsed, onToggle, onStatusChange, onEdit, onDelete, onAddSub, onFieldUpdate, editing, setEditing, solicitantes, getProgress, rowIndex, isLast }) {
  const level = idLevel(item.id);
  const isSub = level >= 1;
  const statusNorm = normalizeStatus(item.status);
  const style = STATUS_STYLE[statusNorm] || STATUS_STYLE['Não iniciado'];
  const hasSubs = items.some(i => String(i.id).startsWith(item.id + '.') && idLevel(i.id) === level + 1);
  const isCollapsed = collapsed.has(item.id);
  const situacao = getSituacao({ ...item, status: statusNorm });
  const isAtrasada = situacao?.kind === 'atrasada';
  const isDone = statusNorm === 'Concluído' || statusNorm === 'Cancelado';
  const days = daysUntil(item.dataPrazo);
  const progress = !isSub ? getProgress(item.id) : null;
  const avatar = avatarFor(item.solicitante);

  let rowBg, borderLeft;
  if (isAtrasada && !isSub) {
    rowBg = 'bg-gradient-to-r from-red-50 to-rose-50/60 hover:from-red-100/80 hover:to-rose-100/60';
    borderLeft = 'border-l-4 border-l-red-500';
  } else if (isAtrasada && isSub) {
    rowBg = 'bg-red-50/40 hover:bg-red-50/70';
    borderLeft = 'border-l-2 border-l-red-300';
  } else if (isSub) {
    rowBg = level === 1 ? 'bg-white/60 hover:bg-stone-50/80' : 'bg-stone-50/40 hover:bg-stone-50/70';
    borderLeft = level === 1 ? 'border-l-2 border-l-stone-200' : 'border-l-2 border-l-stone-100 ml-4';
  } else {
    rowBg = `${style.bg}/60 ${style.bgHover}/80`;
    borderLeft = `border-l-4 ${style.border}`;
  }

  // Fundo amarelo mais forte para Não iniciado
  if (!isSub && statusNorm === 'Não iniciado' && !isAtrasada) {
    rowBg = 'bg-amber-100/70 hover:bg-amber-100/90';
  }

  const isEditing = (field) => editing?.id === item.id && editing?.field === field;

  const indentPx = level * 24;

  // Cor vermelha para textos em tarefas atrasadas (exceto status)
  const redText = isAtrasada ? 'text-red-800' : '';

  return (
    <tr className={`${rowBg} ${borderLeft} border-b border-stone-200/60 transition-all group row-appear`} style={{ animationDelay: `${Math.min(rowIndex * 20, 400)}ms` }}>
      {/* Toggle */}
      <td className="py-3 px-3 align-top">
        {hasSubs && (
          <button onClick={() => onToggle(item.id)} className="w-6 h-6 rounded-md hover:bg-white/80 flex items-center justify-center text-stone-500 transition-all">
            <ChevronDown className={`w-4 h-4 chevron-smooth ${isCollapsed ? '-rotate-90' : ''}`} />
          </button>
        )}
      </td>

      {/* ID — ícone de alerta à DIREITA do ID (v2 fix) */}
      <td className="py-3 px-3 align-top">
        <div className="flex items-center gap-1" style={{ paddingLeft: `${indentPx}px` }}>
          {isSub && <div className="w-3 h-px bg-stone-300 flex-shrink-0"></div>}
          <span className={`tabular-nums text-xs font-bold ${isAtrasada ? 'text-red-700' : isSub ? 'text-stone-500' : 'text-slate-900'}`}>
            {item.id}
          </span>
          {/* ícone de alerta à direita do ID, sem quebrar linha */}
          {isAtrasada && !isSub && (
            <div className="atrasada-pulse rounded-full flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 fill-red-100" strokeWidth={2.5} />
            </div>
          )}
        </div>
      </td>

      {/* Descrição */}
      <td className="py-3 px-3 align-top max-w-md">
        {isEditing('descricao') ? (
          <InlineTextarea initial={item.descricao} onCommit={(v) => onFieldUpdate(item, 'descricao', v)} onCancel={() => setEditing(null)} />
        ) : (
          <div
            onDoubleClick={() => setEditing({ id: item.id, field: 'descricao' })}
            className={`leading-snug cursor-text hover:bg-white/60 rounded px-1 -mx-1 py-0.5 transition-colors ${isSub ? 'text-[13px]' : 'font-medium text-sm'} ${isAtrasada ? 'text-red-900 font-semibold' : isSub ? 'text-stone-700' : 'text-slate-900'}`}
            title="Duplo clique para editar"
          >
            {item.descricao}
          </div>
        )}
        {progress && !isSub && progress.total > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-stone-200/60 rounded-full overflow-hidden max-w-[120px]">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" style={{ width: `${progress.pct}%` }} />
            </div>
            <span className="text-[10px] text-stone-500 tabular-nums font-medium">{progress.done}/{progress.total}</span>
          </div>
        )}
        {item.observacoes && (
          <div
            onDoubleClick={() => setEditing({ id: item.id, field: 'observacoes' })}
            className={`text-xs text-stone-500 mt-1 italic line-clamp-2 cursor-text hover:bg-white/60 rounded ${isAtrasada ? 'text-red-700' : ''}`}
            title="Duplo clique para editar observações"
          >
            {item.observacoes}
          </div>
        )}
        {isEditing('observacoes') && (
          <InlineTextarea initial={item.observacoes || ''} onCommit={(v) => onFieldUpdate(item, 'observacoes', v)} onCancel={() => setEditing(null)} />
        )}
      </td>

      {/* Prioridade — duplo clique habilitado (v2 fix) */}
      <td className="py-3 px-3 align-top">
        {isDone ? (
          <span className="text-stone-300 text-xs">—</span>
        ) : isEditing('prioridade') ? (
          <InlinePrioridade
            initial={item.prioridade}
            onCommit={(v) => onFieldUpdate(item, 'prioridade', v)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div onDoubleClick={() => setEditing({ id: item.id, field: 'prioridade' })} title="Duplo clique para editar" className="cursor-text">
            {item.prioridade === 'Alta' ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-md ring-1 bg-gradient-to-r from-red-200 to-red-100 ring-red-300 shadow-sm ${isAtrasada ? 'text-red-900' : 'text-red-900'}`}>
                <Siren className="w-3 h-3" strokeWidth={2.5} /> Alta
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${isAtrasada ? 'text-red-700' : 'text-stone-500'}`}>
                <Bell className="w-3 h-3" /> Normal
              </span>
            )}
          </div>
        )}
      </td>

      {/* Status dropdown */}
      <td className="py-3 px-3 align-top">
        <StatusDropdown value={statusNorm} onChange={(v) => onStatusChange(item, v)} openUpward={isLast} />
      </td>

      {/* Data Solic */}
      <td className="py-3 px-3 align-top text-xs tabular-nums">
        {isEditing('dataSolic') ? (
          <InlineDate initial={cleanDate(item.dataSolic)} onCommit={(v) => onFieldUpdate(item, 'dataSolic', v)} onCancel={() => setEditing(null)} />
        ) : (
          <span onDoubleClick={() => setEditing({ id: item.id, field: 'dataSolic' })} className={`cursor-text hover:bg-white/60 rounded px-1 -mx-1 py-0.5 ${isAtrasada ? 'text-red-700' : 'text-stone-600'}`} title="Duplo clique para editar">
            {fmtDate(item.dataSolic)}
          </span>
        )}
      </td>

      {/* Data Prazo */}
      <td className="py-3 px-3 align-top text-xs tabular-nums">
        {isEditing('dataPrazo') ? (
          <InlineDate initial={cleanDate(item.dataPrazo)} onCommit={(v) => onFieldUpdate(item, 'dataPrazo', v)} onCancel={() => setEditing(null)} />
        ) : (
          <span onDoubleClick={() => setEditing({ id: item.id, field: 'dataPrazo' })} className={`cursor-text hover:bg-white/60 rounded px-1 -mx-1 py-0.5 ${isAtrasada ? 'text-red-700 font-bold' : 'text-stone-600'}`} title="Duplo clique para editar">
            {fmtDate(item.dataPrazo)}
          </span>
        )}
      </td>

      {/* Dias — chip em linha (v2 fix: sem quebra) */}
      <td className="py-3 px-3 align-top">
        {isDone || !cleanDate(item.dataPrazo) ? (
          <span className="text-stone-300 text-xs">—</span>
        ) : (
          <DaysChip days={days} situacao={situacao} />
        )}
      </td>

      {/* Solicitante */}
      <td className="py-3 px-3 align-top">
        {isEditing('solicitante') ? (
          <InlineText initial={item.solicitante || ''} onCommit={(v) => onFieldUpdate(item, 'solicitante', v)} onCancel={() => setEditing(null)} list={solicitantes} />
        ) : item.solicitante ? (
          <div onDoubleClick={() => setEditing({ id: item.id, field: 'solicitante' })} className="inline-flex items-center gap-2 cursor-text hover:bg-white/60 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors" title="Duplo clique para editar">
            <div className={`w-6 h-6 rounded-full ${avatar.bg} ring-2 ${avatar.ring} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
              {avatar.initial}
            </div>
            <span className={`text-xs font-medium truncate max-w-[100px] ${isAtrasada ? 'text-red-800' : 'text-stone-700'}`}>{item.solicitante}</span>
          </div>
        ) : (
          <span onDoubleClick={() => setEditing({ id: item.id, field: 'solicitante' })} className="text-stone-300 text-xs cursor-text">—</span>
        )}
      </td>

      {/* Ações (v2: 3 botões — +, lápis, lixeira) */}
      <td className="py-3 px-3 align-top">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isSub && (
            <button
              onClick={onAddSub}
              title="Adicionar subtarefa"
              className="w-7 h-7 rounded-lg hover:bg-sky-100 text-stone-400 hover:text-sky-600 flex items-center justify-center transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={onEdit}
            title="Editar"
            className="w-7 h-7 rounded-lg hover:bg-amber-100 text-stone-400 hover:text-amber-700 flex items-center justify-center transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            title="Excluir"
            className="w-7 h-7 rounded-lg hover:bg-red-100 text-stone-400 hover:text-red-600 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// DIAS CHIP — tudo numa linha (v2 fix)
// ============================================================================
function DaysChip({ days, situacao }) {
  if (days === null) return <span className="text-stone-300 text-xs">—</span>;
  if (situacao?.kind === 'atrasada') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-red-100 text-red-800 ring-1 ring-red-300 whitespace-nowrap">
        <AlertTriangle className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
        {Math.abs(days)}d atraso
      </span>
    );
  }
  if (situacao?.kind === 'hoje') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-900 ring-1 ring-amber-300 whitespace-nowrap">
        <Zap className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
        Hoje
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 whitespace-nowrap">
      {days}d
    </span>
  );
}

// ============================================================================
// STATUS DROPDOWN — largura fixa + ícones coloridos na seleção (v2)
// ============================================================================
function StatusDropdown({ value, onChange, openUpward }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLE[value] || STATUS_STYLE['Não iniciado'];
  const Icon = style.icon;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={`status-chip-fixed inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 whitespace-nowrap ${style.chip} hover:shadow-md transition-all`}
      >
        <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
        <span className="flex-1 text-center">{style.short}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 chevron-smooth flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className={`absolute ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 bg-white border border-stone-200 rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden p-1`}>
            {STATUS_OPTIONS.map(s => {
              const st = STATUS_STYLE[s];
              const SIcon = st.icon;
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); }}
                  className={`w-full text-left px-2.5 py-2 text-xs flex items-center gap-2 rounded-lg transition-colors ${s === value ? 'bg-stone-100 font-semibold' : 'hover:bg-stone-50'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`}></span>
                  {/* ícone colorido (v2: mesma cor da bolinha) */}
                  <SIcon className={`w-3.5 h-3.5 flex-shrink-0 ${st.iconColor}`} />
                  <span>{st.short}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EDIÇÃO INLINE
// ============================================================================
function InlineTextarea({ initial, onCommit, onCancel }) {
  const [v, setV] = useState(initial);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <textarea
      ref={ref}
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => onCommit(v)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onCommit(v); }
        if (e.key === 'Escape') onCancel();
      }}
      rows={2}
      className="w-full text-sm border-2 border-slate-400 rounded-lg p-2 focus:outline-none focus:border-slate-900 resize-none bg-white shadow-lg"
    />
  );
}

function InlineText({ initial, onCommit, onCancel, list }) {
  const [v, setV] = useState(initial);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const dataListId = `dl-${Math.random().toString(36).slice(2)}`;
  return (
    <>
      <input ref={ref} type="text" value={v} onChange={e => setV(e.target.value)}
        onBlur={() => onCommit(v)}
        onKeyDown={e => { if (e.key === 'Enter') onCommit(v); if (e.key === 'Escape') onCancel(); }}
        list={list ? dataListId : undefined}
        className="w-full text-xs border-2 border-slate-400 rounded-md px-2 py-1 focus:outline-none focus:border-slate-900 bg-white shadow-md"
      />
      {list && <datalist id={dataListId}>{list.map(o => <option key={o} value={o} />)}</datalist>}
    </>
  );
}

function InlineDate({ initial, onCommit, onCancel }) {
  const [v, setV] = useState(initial);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <input ref={ref} type="date" value={v} onChange={e => setV(e.target.value)}
      onBlur={() => onCommit(v)}
      onKeyDown={e => { if (e.key === 'Enter') onCommit(v); if (e.key === 'Escape') onCancel(); }}
      className="w-full text-xs border-2 border-slate-400 rounded-md px-1.5 py-1 focus:outline-none focus:border-slate-900 bg-white shadow-md"
    />
  );
}

// Edição inline de prioridade (v2 fix)
function InlinePrioridade({ initial, onCommit, onCancel }) {
  return (
    <div className="flex gap-1">
      {['Normal', 'Alta'].map(p => (
        <button
          key={p}
          onClick={() => onCommit(p)}
          className={`px-2 py-1 text-xs font-semibold rounded-md border transition-all ${initial === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-stone-600 border-stone-200 hover:border-slate-400'}`}
        >
          {p}
        </button>
      ))}
      <button onClick={onCancel} className="p-1 text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>
    </div>
  );
}

// ============================================================================
// MODAL — autoFocus no campo descrição (v2 fix)
// ============================================================================
function TaskModal({ mode, item, defaults, autoFocus, tarefasPrincipais, solicitantes, onClose, onSave, onRequestDelete }) {
  const [form, setForm] = useState(() => ({
    descricao: item?.descricao || '',
    prioridade: item?.prioridade || 'Normal',
    status: normalizeStatus(item?.status) || 'Não iniciado',
    dataSolic: cleanDate(item?.dataSolic) || new Date().toISOString().slice(0, 10),
    dataPrazo: cleanDate(item?.dataPrazo) || '',
    solicitante: item?.solicitante || '',
    tipo: item?.tipo || defaults?.tipo || 'Tarefa',
    idPrincipal: item?.idPrincipal || defaults?.idPrincipal || null,
    observacoes: item?.observacoes || '',
    id: item?.id,
  }));
  const [errors, setErrors] = useState({});
  const descRef = useRef(null);

  // autoFocus no campo descrição (v2: Enter cria a tarefa)
  useEffect(() => {
    if (autoFocus && descRef.current) {
      setTimeout(() => descRef.current?.focus(), 80);
    }
  }, [autoFocus]);

  const validate = () => {
    const e = {};
    if (!form.descricao.trim()) e.descricao = 'Descrição obrigatória';
    if (!form.dataSolic) e.dataSolic = 'Data obrigatória';
    if (form.dataPrazo && form.dataSolic && form.dataPrazo < form.dataSolic) e.dataPrazo = 'Prazo deve ser posterior';
    if (form.tipo === 'Subtarefa' && !form.idPrincipal) e.idPrincipal = 'Selecione tarefa principal';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSave(form); };
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Enter no campo descrição cria a tarefa (v2)
  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-start justify-center pt-12 px-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: 'fadeInUp 0.2s ease-out' }}>
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-gradient-to-br from-stone-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
              {mode === 'create' ? <Plus className="w-4 h-4" strokeWidth={2.5} /> : <Sparkles className="w-4 h-4" />}
            </div>
            <h2 className="font-serif-display text-2xl text-slate-900">
              {mode === 'create' ? (form.tipo === 'Subtarefa' ? 'Nova Subtarefa' : 'Nova Tarefa') : `Editar ${item.tipo}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {mode === 'create' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                  {['Tarefa', 'Subtarefa'].map(t => (
                    <button key={t} onClick={() => update('tipo', t)} className={`flex-1 py-2 text-sm font-semibold transition-all ${form.tipo === t ? 'bg-slate-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}>{t}</button>
                  ))}
                </div>
              </Field>
              {form.tipo === 'Subtarefa' && (
                <Field label="Tarefa Principal" error={errors.idPrincipal}>
                  <select value={form.idPrincipal || ''} onChange={e => update('idPrincipal', e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
                    <option value="">Selecione...</option>
                    {tarefasPrincipais.map(t => (<option key={t.id} value={t.id}>{t.id} — {t.descricao.slice(0, 55)}{t.descricao.length > 55 ? '…' : ''}</option>))}
                  </select>
                </Field>
              )}
            </div>
          )}

          <Field label="Descrição *" error={errors.descricao}>
            <textarea
              ref={descRef}
              value={form.descricao}
              onChange={e => update('descricao', e.target.value)}
              onKeyDown={handleDescKeyDown}
              rows={3}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
              placeholder={autoFocus ? "Digite a descrição e pressione Enter para criar..." : "Descreva a demanda..."}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridade">
              <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                <button onClick={() => update('prioridade', 'Normal')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${form.prioridade === 'Normal' ? 'bg-stone-100 text-slate-900' : 'bg-white text-stone-500 hover:bg-stone-50'}`}><Bell className="w-3.5 h-3.5" /> Normal</button>
                <button onClick={() => update('prioridade', 'Alta')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${form.prioridade === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-white text-stone-500 hover:bg-stone-50'}`}><Siren className="w-3.5 h-3.5" /> Alta</button>
              </div>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => update('status', e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_STYLE[s]?.short || s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de Solicitação *" error={errors.dataSolic}>
              <input type="date" value={form.dataSolic} onChange={e => update('dataSolic', e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
            </Field>
            <Field label="Data de Prazo" error={errors.dataPrazo}>
              <input type="date" value={form.dataPrazo} onChange={e => update('dataPrazo', e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
            </Field>
          </div>

          <Field label="Solicitante">
            <input type="text" list="list-solic" value={form.solicitante} onChange={e => update('solicitante', e.target.value)} placeholder="Ex.: Manu, Perdigão..." className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
            <datalist id="list-solic">{solicitantes.map(s => <option key={s} value={s} />)}</datalist>
          </Field>

          <Field label="Observações">
            <textarea value={form.observacoes} onChange={e => update('observacoes', e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none" placeholder="Informações adicionais..." />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-stone-200 bg-gradient-to-r from-stone-50 to-white flex justify-between gap-2">
          {mode === 'edit' && (
            <button onClick={() => { onClose(); onRequestDelete(item); }} className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg">Cancelar</button>
            <button onClick={handleSubmit} className="px-5 py-2 text-sm font-semibold bg-gradient-to-br from-slate-900 to-slate-800 hover:from-slate-800 text-white rounded-lg shadow-md">{mode === 'create' ? 'Criar' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

// ============================================================================
// GANTT VIEW
// ============================================================================
function GanttView({ items }) {
  const [ganttMode, setGanttMode] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
  const [collapsedGantt, setCollapsedGantt] = useState(new Set());
  const today_d = today();

  // Só tarefas com datas
  const mainTasks = useMemo(() => {
    return items.filter(i => idLevel(i.id) === 0 && (cleanDate(i.dataSolic) || cleanDate(i.dataPrazo)));
  }, [items]);

  const subsByParent = useMemo(() => {
    const map = {};
    items.filter(i => idLevel(i.id) === 1).forEach(s => {
      if (!map[s.idPrincipal]) map[s.idPrincipal] = [];
      map[s.idPrincipal].push(s);
    });
    return map;
  }, [items]);

  // Calcular período do Gantt
  const { minDate, maxDate, days: totalDays } = useMemo(() => {
    const allDates = [];
    items.forEach(i => {
      if (cleanDate(i.dataSolic)) allDates.push(new Date(cleanDate(i.dataSolic) + 'T00:00:00'));
      if (cleanDate(i.dataPrazo)) allDates.push(new Date(cleanDate(i.dataPrazo) + 'T00:00:00'));
    });
    allDates.push(today_d);
    const minD = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxD = new Date(Math.max(...allDates.map(d => d.getTime())));
    // Padding
    minD.setDate(minD.getDate() - 3);
    maxD.setDate(maxD.getDate() + 7);
    const diff = Math.round((maxD - minD) / (1000 * 60 * 60 * 24));
    return { minDate: minD, maxDate: maxD, days: diff };
  }, [items]);

  const colWidth = ganttMode === 'monthly' ? 40 : ganttMode === 'weekly' ? 24 : 20;
  const ganttWidth = totalDays * colWidth;

  const dateToX = (iso) => {
    const d = new Date(cleanDate(iso) + 'T00:00:00');
    const diff = Math.round((d - minDate) / (1000 * 60 * 60 * 24));
    return diff * colWidth;
  };

  const todayX = dateToX(today_d.toISOString().slice(0, 10));

  const getBarColor = (item) => {
    const s = normalizeStatus(item.status);
    if (s === 'Concluído') return 'bg-emerald-500';
    if (s === 'Cancelado') return 'bg-neutral-300';
    if (s === 'Em andamento') return 'bg-sky-400';
    const sit = getSituacao(item);
    if (sit?.kind === 'atrasada') return 'bg-red-500';
    return 'bg-amber-400';
  };

  const getBarStyle = (item) => {
    const start = cleanDate(item.dataSolic) || cleanDate(item.dataPrazo);
    const end = cleanDate(item.dataPrazo) || cleanDate(item.dataSolic);
    if (!start || !end) return null;
    const x = dateToX(start);
    const endX = dateToX(end) + colWidth;
    const width = Math.max(endX - x, colWidth);

    // Se atrasada, a parte em vermelho é só no período de atraso
    const s = normalizeStatus(item.status);
    const sit = getSituacao(item);
    const isAtrasada = sit?.kind === 'atrasada';

    return { x, width, isAtrasada, start, end };
  };

  // Gerar labels do header
  const headerLabels = useMemo(() => {
    const labels = [];
    if (ganttMode === 'monthly') {
      let cur = new Date(minDate);
      while (cur <= maxDate) {
        const x = Math.round((cur - minDate) / (1000 * 60 * 60 * 24)) * colWidth;
        labels.push({ x, label: `${cur.getMonth() + 1}/${cur.getFullYear().toString().slice(2)}` });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    } else if (ganttMode === 'weekly') {
      let cur = new Date(minDate);
      // Ir para segunda-feira mais próxima
      const day = cur.getDay();
      if (day !== 1) cur.setDate(cur.getDate() + (day === 0 ? 1 : 8 - day));
      while (cur <= maxDate) {
        const x = Math.round((cur - minDate) / (1000 * 60 * 60 * 24)) * colWidth;
        labels.push({ x, label: `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}` });
        cur.setDate(cur.getDate() + 7);
      }
    } else {
      let cur = new Date(minDate);
      while (cur <= maxDate) {
        const x = Math.round((cur - minDate) / (1000 * 60 * 60 * 24)) * colWidth;
        const dayOfWeek = cur.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (!isWeekend) {
          labels.push({ x, label: `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}` });
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return labels;
  }, [minDate, maxDate, ganttMode, colWidth]);

  const ROW_H = 40;

  // Build rows
  const rows = [];
  mainTasks.forEach(task => {
    rows.push({ ...task, isMain: true });
    if (!collapsedGantt.has(task.id)) {
      (subsByParent[task.id] || []).forEach(sub => rows.push({ ...sub, isMain: false }));
    }
  });

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Gantt controls */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-200/80 bg-gradient-to-r from-stone-50/80 to-white/80">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Visualização</span>
        <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
          {[['daily', 'Diário'], ['weekly', 'Semanal'], ['monthly', 'Mensal']].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setGanttMode(k)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${ganttMode === k ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-700'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-400 ml-auto">Clique ▶ para expandir/recolher subtarefas</span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex">
          {/* Coluna de labels */}
          <div className="flex-shrink-0 w-56 border-r border-stone-200/80">
            <div className="h-10 border-b border-stone-200/80 bg-stone-50/80 flex items-center px-3">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Tarefa</span>
            </div>
            {rows.map((row, i) => {
              const hasSubs = !!(subsByParent[row.id]?.length);
              return (
                <div
                  key={row.id}
                  className={`flex items-center gap-2 px-3 border-b border-stone-100 ${row.isMain ? 'bg-stone-50/60' : 'bg-white/40'}`}
                  style={{ height: ROW_H }}
                >
                  {row.isMain && hasSubs && (
                    <button
                      onClick={() => setCollapsedGantt(prev => {
                        const n = new Set(prev);
                        n.has(row.id) ? n.delete(row.id) : n.add(row.id);
                        return n;
                      })}
                      className="w-4 h-4 flex items-center justify-center text-stone-400 hover:text-slate-700 flex-shrink-0"
                    >
                      <ChevronDown className={`w-3 h-3 chevron-smooth ${collapsedGantt.has(row.id) ? '-rotate-90' : ''}`} />
                    </button>
                  )}
                  {(!row.isMain || !hasSubs) && <div className="w-4 flex-shrink-0" />}
                  <span className={`text-xs truncate ${row.isMain ? 'font-semibold text-slate-800' : 'text-stone-500 pl-3'}`} title={row.descricao}>
                    <span className="text-stone-400 mr-1">{row.id}</span>{row.descricao}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Área do Gantt */}
          <div className="overflow-x-auto flex-1">
            <div style={{ width: ganttWidth, minWidth: '100%', position: 'relative' }}>
              {/* Header de datas */}
              <div className="h-10 border-b border-stone-200/80 bg-stone-50/80 relative" style={{ width: ganttWidth }}>
                {headerLabels.map((lbl, i) => (
                  <div key={i} className="absolute top-0 flex flex-col items-start justify-center h-full" style={{ left: lbl.x }}>
                    <div className="absolute top-0 bottom-0 border-l border-stone-200/60" style={{ left: 0 }}></div>
                    <span className="text-[10px] text-stone-500 font-medium pl-1 select-none">{lbl.label}</span>
                  </div>
                ))}
                {/* Linha de hoje */}
                <div className="absolute top-0 bottom-0 border-l-2 border-red-400" style={{ left: todayX }}>
                  <span className="absolute top-1 left-1 text-[9px] font-bold text-red-500 whitespace-nowrap">Hoje</span>
                </div>
              </div>

              {/* Linhas das tarefas */}
              {rows.map((row, i) => {
                const barInfo = getBarStyle(row);
                const s = normalizeStatus(row.status);
                const sit = getSituacao({ ...row, status: s });
                return (
                  <div key={row.id} className={`relative border-b border-stone-100 ${row.isMain ? 'bg-stone-50/30' : 'bg-white/20'}`} style={{ height: ROW_H, width: ganttWidth }}>
                    {/* Hoje marker */}
                    <div className="absolute top-0 bottom-0 border-l border-red-200" style={{ left: todayX }}></div>

                    {barInfo && (
                      <>
                        {/* Barra principal */}
                        <div
                          className={`absolute rounded-md ${getBarColor(row)} opacity-80 hover:opacity-100 transition-opacity cursor-default`}
                          style={{
                            left: barInfo.x,
                            width: barInfo.width,
                            top: row.isMain ? 8 : 12,
                            height: row.isMain ? 22 : 16,
                          }}
                          title={`${row.id} — ${row.descricao}: ${fmtDate(barInfo.start)} → ${fmtDate(barInfo.end)}`}
                        >
                          {/* Parte de atraso em vermelho */}
                          {sit?.kind === 'atrasada' && s !== 'Concluído' && s !== 'Cancelado' && (() => {
                            const todayX2 = dateToX(today_d.toISOString().slice(0, 10));
                            const endX = barInfo.x + barInfo.width;
                            const delayStart = Math.max(barInfo.x, todayX2);
                            const delayWidth = endX - delayStart;
                            if (delayWidth <= 0) return null;
                            return (
                              <div
                                className="absolute top-0 bottom-0 rounded-r-md bg-red-600"
                                style={{ left: delayStart - barInfo.x, width: delayWidth }}
                              />
                            );
                          })()}
                          <span className="absolute inset-0 flex items-center px-1.5 overflow-hidden">
                            <span className="text-white text-[10px] font-semibold truncate drop-shadow">{row.id}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="px-5 py-3 border-t border-stone-200/80 bg-gradient-to-r from-stone-50/80 to-white/80 flex items-center gap-4 flex-wrap">
        {[
          { color: 'bg-emerald-500', label: 'Concluído' },
          { color: 'bg-sky-400', label: 'Em andamento' },
          { color: 'bg-amber-400', label: 'Não iniciado' },
          { color: 'bg-red-500', label: 'Atrasado' },
          { color: 'bg-neutral-300', label: 'Cancelado' },
          { color: 'bg-red-600', label: 'Período de atraso' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`}></div>
            <span className="text-[11px] text-stone-500">{label}</span>
          </div>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-stone-400">
          <div className="w-px h-4 border-l-2 border-red-400"></div> Hoje
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG & TOAST
// ============================================================================
function ConfirmDialog({ item, items, onCancel, onConfirm }) {
  const subCount = items.filter(i => String(i.id).startsWith(item.id + '.')).length;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()} style={{ animation: 'fadeInUp 0.2s ease-out' }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center flex-shrink-0 ring-1 ring-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-serif-display text-xl text-slate-900">Confirmar exclusão</h3>
            <p className="text-sm text-stone-600 mt-1">Excluir <strong className="text-slate-900">{item.id}</strong> — {item.descricao.slice(0, 80)}{item.descricao.length > 80 ? '…' : ''}?</p>
            {subCount > 0 && <p className="text-sm text-red-700 mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5 font-medium">⚠️ <strong>{subCount} subtarefa{subCount > 1 ? 's' : ''}</strong> também será{subCount > 1 ? 'ão' : ''} excluída{subCount > 1 ? 's' : ''}.</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 text-white rounded-lg shadow-md">Excluir</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold z-50 flex items-center gap-2 ${type === 'error' ? 'bg-gradient-to-br from-red-600 to-red-700 text-white' : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white'}`} style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      {msg}
    </div>
  );
}
