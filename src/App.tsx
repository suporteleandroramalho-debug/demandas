import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDashed,
  Ban,
  Calendar,
  User,
  UserCheck,
  LayoutGrid,
  List,
  Download,
  Upload,
  MoreHorizontal,
  ArrowUpDown,
  Bell,
  Siren,
  Settings,
  TrendingUp,
  CalendarClock,
} from 'lucide-react';

// ============================================================================
// CONFIGURAÇÃO — Apontar para o Web App do Apps Script após deploy
// ============================================================================
const API_URL =
  'https://script.google.com/macros/s/AKfycbya1KpcTtyAXqoMekfZU_VK7OiWWKcHK6od59GTQCoamDxyjYje06oUUYzLRfmBnD_o/exec'; // ex.: 'https://script.google.com/macros/s/XXXX/exec'

// ============================================================================
// DADOS INICIAIS (espelham a planilha original)
// ============================================================================
const SEED_DATA = [
  {
    id: '1',
    descricao:
      'Power BI Budget/Forecast | Entregar 1a versão do dashboard Procurement Expenses',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-02-09',
    dataPrazo: '2026-02-26',
    solicitante: 'Manu',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '2',
    descricao: 'Realized Saves - Trazer itens faltantes com compradores',
    prioridade: 'Normal',
    status: 'Em andamento',
    dataSolic: '2026-02-12',
    dataPrazo: '',
    solicitante: 'Davi',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '3',
    descricao: 'Implementar melhoria do mix na calculadora',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-02-19',
    dataPrazo: '2026-02-20',
    solicitante: 'Adriana',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '4',
    descricao:
      'Price Forecast - 1a Versão | Entregar 1ª versão do dashboard Price Forecast',
    prioridade: 'Alta',
    status: 'Em andamento',
    dataSolic: '2026-03-18',
    dataPrazo: '2026-04-30',
    solicitante: 'Pereira',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '5',
    descricao:
      'One Pager BI - Entregar 1a Versão | Entregar 1a versão do dashboard One Pager',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-01',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '6',
    descricao:
      'Inserir filtros no Procurement Expenses | Melhorias de botões no dashboard Procurement Expenses',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-02',
    dataPrazo: '2026-04-02',
    solicitante: 'Manu',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '7',
    descricao:
      'Versão Local Currency PBI Procurement Expenses | Entregar 2ª versão do dashboard Procurement Expenses',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '2026-04-07',
    dataPrazo: '2026-04-08',
    solicitante: 'Manu',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '7.1',
    descricao: 'Inserir aba LOCAL',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '2026-04-07',
    dataPrazo: '',
    solicitante: '',
    planner: 'Sim',
    tipo: 'Subtarefa',
    idPrincipal: '7',
    observacoes: '',
  },
  {
    id: '7.2',
    descricao: 'Arrumar botão da página 2 que "limpa" tudo',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '2026-04-07',
    dataPrazo: '',
    solicitante: '',
    planner: 'Sim',
    tipo: 'Subtarefa',
    idPrincipal: '7',
    observacoes: '',
  },
  {
    id: '7.3',
    descricao: 'Ajustar proporção do gráfico de cascata',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '2026-04-07',
    dataPrazo: '',
    solicitante: '',
    planner: 'Sim',
    tipo: 'Subtarefa',
    idPrincipal: '7',
    observacoes: '',
  },
  {
    id: '7.4',
    descricao: 'Verificar palavra "mudança" se é possível remover',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '2026-04-07',
    dataPrazo: '',
    solicitante: '',
    planner: 'Sim',
    tipo: 'Subtarefa',
    idPrincipal: '7',
    observacoes: '',
  },
  {
    id: '8',
    descricao:
      'Criar planilha comparativa de saving | Sourcing Plan vs Consolidado',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '9',
    descricao: 'Criar planilha trazendo coluna repetida de "Initiatives"',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '10',
    descricao: 'Ajustar nosso relatório de Processes Portifolio com mudanças',
    prioridade: 'Alta',
    status: 'Pendente',
    dataSolic: '2026-04-15',
    dataPrazo: '2026-04-15',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '10.1',
    descricao:
      'Ajustar somas dos sites de 99% - arredondar sites prioritários para mais. Brasil: Salobo, Sossego, Onça Puma. Canadá: Ontario, VNL, Manitoba.',
    prioridade: 'Alta',
    status: 'Pendente',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '10',
    observacoes: '',
  },
  {
    id: '11',
    descricao: 'Atualizar One Pager com dados de Cristina',
    prioridade: 'Alta',
    status: 'Concluído',
    dataSolic: '2026-04-15',
    dataPrazo: '2026-04-15',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '12',
    descricao:
      'Adicionar férias/days off no calendário | Preencher planilha de férias',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-07',
    dataPrazo: '2026-04-10',
    solicitante: 'Manu',
    planner: 'Sim',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '13',
    descricao:
      'Realizar análise Sourcing Plan, identificando o número do ID_PRJ',
    prioridade: 'Alta',
    status: 'Concluído',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '14',
    descricao: 'Realizar análise de (%) competitividade para o Tom',
    prioridade: 'Alta',
    status: 'Cancelado',
    dataSolic: '2026-04-14',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '14.1',
    descricao:
      'Meta de 40% para Não Competitivo; Competitivo tem que ser 60%; Fazer acompanhamento por líder; Análise inicialmente para o Tom.',
    prioridade: 'Alta',
    status: 'Cancelado',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '14',
    observacoes: '',
  },
  {
    id: '14.2',
    descricao: 'Passar a informação para eles passarem o "porquê"',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '14',
    observacoes: '',
  },
  {
    id: '15',
    descricao: 'Fazer relatório de checkup de pontos divergentes',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '2026-05-15',
    dataPrazo: '',
    solicitante: '(Eu)',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '16',
    descricao: 'Relatório Processes Portifolio - Pontos',
    prioridade: 'Normal',
    status: 'Em andamento',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '16.1',
    descricao: 'Roberto precisa ajustar valores exclusivos do CEO-4',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: 'Perdigão',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '16',
    observacoes: '',
  },
  {
    id: '17',
    descricao: 'Testar acesso ao Datasphere / SAC Planning',
    prioridade: 'Normal',
    status: 'Em andamento',
    dataSolic: '2026-04-15',
    dataPrazo: '',
    solicitante: 'Pereira',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '17.1',
    descricao:
      'Links de acesso: SAC Produção, SAC QAS, Datasphere. É preciso clicar no link do Datasphere antes do SAC funcionar.',
    prioridade: 'Normal',
    status: 'Em andamento',
    dataSolic: '2026-04-13',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '17',
    observacoes: '',
  },
  {
    id: '18',
    descricao: 'Reunião de Equipe',
    prioridade: 'Normal',
    status: 'Em andamento',
    dataSolic: '2026-04-16',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '19',
    descricao: 'SAC Planning',
    prioridade: 'Normal',
    status: 'Em andamento',
    dataSolic: '',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
  {
    id: '19.1',
    descricao: 'Reunião - SAC Planning VBM - Preparação Dados UAT',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '2026-04-17',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '19',
    observacoes: '',
  },
  {
    id: '19.2',
    descricao: 'Reunião - VBM - SAC Planning - Workstream meeting',
    prioridade: 'Normal',
    status: 'Concluído',
    dataSolic: '',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '19',
    observacoes: '',
  },
  {
    id: '19.3',
    descricao: 'Baixar transcrição da reunião 2',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '19',
    observacoes: '',
  },
  {
    id: '19.4',
    descricao: 'Conseguir todos os acessos',
    prioridade: 'Normal',
    status: 'Pendente',
    dataSolic: '',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Subtarefa',
    idPrincipal: '19',
    observacoes: '',
  },
  {
    id: '20',
    descricao: 'Levantamento de Necessidades de Relatórios para Power BI',
    prioridade: 'Alta',
    status: 'Em andamento',
    dataSolic: '2026-04-17',
    dataPrazo: '',
    solicitante: '',
    planner: 'Não',
    tipo: 'Tarefa',
    idPrincipal: null,
    observacoes: '',
  },
];

// ============================================================================
// CONSTANTES
// ============================================================================
const STATUS_OPTIONS = ['Pendente', 'Em andamento', 'Concluído', 'Cancelado'];
const PRIORIDADE_OPTIONS = ['Normal', 'Alta'];

const STATUS_STYLE = {
  Pendente: {
    bg: 'bg-amber-50',
    bgHover: 'hover:bg-amber-100/70',
    border: 'border-l-amber-400',
    chip: 'bg-amber-100 text-amber-900 ring-amber-200',
    icon: Clock,
    label: 'Pendente',
  },
  'Em andamento': {
    bg: 'bg-sky-50',
    bgHover: 'hover:bg-sky-100/70',
    border: 'border-l-sky-400',
    chip: 'bg-sky-100 text-sky-900 ring-sky-200',
    icon: CircleDashed,
    label: 'Em andamento',
  },
  Concluído: {
    bg: 'bg-emerald-50',
    bgHover: 'hover:bg-emerald-100/70',
    border: 'border-l-emerald-400',
    chip: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
    icon: CheckCircle2,
    label: 'Concluído',
  },
  Cancelado: {
    bg: 'bg-neutral-100',
    bgHover: 'hover:bg-neutral-200/70',
    border: 'border-l-neutral-400',
    chip: 'bg-neutral-200 text-neutral-700 ring-neutral-300',
    icon: Ban,
    label: 'Cancelado',
  },
};

// ============================================================================
// HELPERS
// ============================================================================
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

const isAtrasada = (item) => {
  if (!item.dataPrazo) return false;
  if (item.status === 'Concluído' || item.status === 'Cancelado') return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(item.dataPrazo);
  return prazo < hoje;
};

const sortTasks = (items) => {
  const parseId = (id) => {
    const [main, sub] = String(id).split('.');
    return { main: parseInt(main, 10), sub: sub ? parseInt(sub, 10) : 0 };
  };
  return [...items].sort((a, b) => {
    const pa = parseId(a.id),
      pb = parseId(b.id);
    if (pa.main !== pb.main) return pa.main - pb.main;
    return pa.sub - pb.sub;
  });
};

const groupHierarchy = (items) => {
  const sorted = sortTasks(items);
  const result = [];
  const tarefas = sorted.filter((i) => i.tipo === 'Tarefa');
  tarefas.forEach((t) => {
    result.push(t);
    const subs = sorted.filter(
      (s) => s.tipo === 'Subtarefa' && s.idPrincipal === t.id
    );
    result.push(...subs);
  });
  // Subtarefas órfãs (sem tarefa principal existente) ao final
  const tarefaIds = new Set(tarefas.map((t) => t.id));
  sorted
    .filter((i) => i.tipo === 'Subtarefa' && !tarefaIds.has(i.idPrincipal))
    .forEach((o) => result.push(o));
  return result;
};

const nextMainId = (items) => {
  const ids = items
    .filter((i) => i.tipo === 'Tarefa')
    .map((i) => parseInt(i.id, 10))
    .filter((n) => !isNaN(n));
  return String(ids.length ? Math.max(...ids) + 1 : 1);
};

const nextSubId = (items, idPrincipal) => {
  const subs = items
    .filter((i) => i.idPrincipal === idPrincipal)
    .map((i) => {
      const parts = String(i.id).split('.');
      return parseInt(parts[1], 10);
    })
    .filter((n) => !isNaN(n));
  const next = subs.length ? Math.max(...subs) + 1 : 1;
  return `${idPrincipal}.${next}`;
};

// ============================================================================
// API CLIENT (Apps Script)
// ============================================================================
const api = {
  async list() {
    if (!API_URL) return null;
    const r = await fetch(`${API_URL}?action=list`);
    if (!r.ok) throw new Error('Falha ao listar');
    return r.json();
  },
  async create(item) {
    if (!API_URL) return item;
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'create', item }),
    });
    return r.json();
  },
  async update(item) {
    if (!API_URL) return item;
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', item }),
    });
    return r.json();
  },
  async remove(id) {
    if (!API_URL) return { ok: true };
    const r = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
    return r.json();
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function App() {
  const [items, setItems] = useState(SEED_DATA);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPrioridade, setFilterPrioridade] = useState('Todas');
  const [filterResponsavel, setFilterResponsavel] = useState('Todos');
  const [filterSolicitante, setFilterSolicitante] = useState('Todos');
  const [collapsed, setCollapsed] = useState(new Set());
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', item, defaults }
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar da API se configurada
  useEffect(() => {
    if (!API_URL) return;
    setLoading(true);
    api
      .list()
      .then((data) => {
        if (data) setItems(data);
      })
      .catch(() => showToast('Erro ao carregar. Usando dados locais.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ===== Listas únicas para filtros
  const responsaveis = useMemo(() => {
    const s = new Set(items.map((i) => i.planner).filter(Boolean));
    return ['Todos', ...s];
  }, [items]);
  const solicitantes = useMemo(() => {
    const s = new Set(items.map((i) => i.solicitante).filter(Boolean));
    return ['Todos', ...s];
  }, [items]);

  // ===== Itens filtrados (mantém hierarquia: se tarefa passa filtro, subtarefas aparecem; se subtarefa passa, tarefa-mãe aparece)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (it) => {
      if (
        q &&
        !it.descricao.toLowerCase().includes(q) &&
        !String(it.id).includes(q)
      )
        return false;
      if (filterStatus !== 'Todos' && it.status !== filterStatus) return false;
      if (filterPrioridade !== 'Todas' && it.prioridade !== filterPrioridade)
        return false;
      if (filterResponsavel !== 'Todos' && it.planner !== filterResponsavel)
        return false;
      if (filterSolicitante !== 'Todos' && it.solicitante !== filterSolicitante)
        return false;
      return true;
    };
    const keep = new Set();
    items.forEach((it) => {
      if (match(it)) {
        keep.add(it.id);
        if (it.tipo === 'Subtarefa' && it.idPrincipal) keep.add(it.idPrincipal);
        if (it.tipo === 'Tarefa') {
          items
            .filter((s) => s.idPrincipal === it.id)
            .forEach((s) => keep.add(s.id));
        }
      }
    });
    return items.filter((it) => keep.has(it.id));
  }, [
    items,
    search,
    filterStatus,
    filterPrioridade,
    filterResponsavel,
    filterSolicitante,
  ]);

  const hierarchical = useMemo(() => groupHierarchy(filtered), [filtered]);

  const visibleRows = useMemo(() => {
    return hierarchical.filter((it) => {
      if (it.tipo === 'Subtarefa' && collapsed.has(it.idPrincipal))
        return false;
      return true;
    });
  }, [hierarchical, collapsed]);

  // ===== Métricas do dashboard
  const metrics = useMemo(() => {
    const total = items.length;
    const pendente = items.filter((i) => i.status === 'Pendente').length;
    const andamento = items.filter((i) => i.status === 'Em andamento').length;
    const concluido = items.filter((i) => i.status === 'Concluído').length;
    const cancelado = items.filter((i) => i.status === 'Cancelado').length;
    const alta = items.filter(
      (i) =>
        i.prioridade === 'Alta' &&
        i.status !== 'Concluído' &&
        i.status !== 'Cancelado'
    ).length;
    const atrasadas = items.filter(isAtrasada).length;
    return {
      total,
      pendente,
      andamento,
      concluido,
      cancelado,
      alta,
      atrasadas,
    };
  }, [items]);

  // ===== Ações
  const toggleCollapse = (id) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleStatusChange = async (item, newStatus) => {
    const updated = { ...item, status: newStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    try {
      await api.update(updated);
      showToast(`Status atualizado para "${newStatus}"`);
    } catch {
      showToast('Erro ao salvar no servidor', 'error');
    }
  };

  const handleSave = async (data) => {
    if (modal.mode === 'create') {
      const id =
        data.tipo === 'Subtarefa'
          ? nextSubId(items, data.idPrincipal)
          : nextMainId(items);
      const novo = { ...data, id };
      setItems((prev) => [...prev, novo]);
      try {
        await api.create(novo);
        showToast('Tarefa criada com sucesso');
      } catch {
        showToast('Criada localmente. Erro ao salvar no servidor.', 'error');
      }
    } else {
      setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
      try {
        await api.update(data);
        showToast('Tarefa atualizada');
      } catch {
        showToast('Atualizada localmente. Erro no servidor.', 'error');
      }
    }
    setModal(null);
  };

  const handleDelete = async (item) => {
    const idsParaRemover = new Set([item.id]);
    if (item.tipo === 'Tarefa') {
      items
        .filter((i) => i.idPrincipal === item.id)
        .forEach((s) => idsParaRemover.add(s.id));
    }
    setItems((prev) => prev.filter((i) => !idsParaRemover.has(i.id)));
    try {
      for (const id of idsParaRemover) await api.remove(id);
      showToast(`Excluído${idsParaRemover.size > 1 ? 's' : ''} com sucesso`);
    } catch {
      showToast('Erro ao excluir no servidor', 'error');
    }
    setConfirmDel(null);
  };

  const exportCSV = () => {
    const headers = [
      'ID',
      'Tipo',
      'ID Principal',
      'Descrição',
      'Prioridade',
      'Status',
      'Data Solic.',
      'Data Prazo',
      'Solicitante',
      'Planner',
      'Observações',
    ];
    const rows = sortTasks(items).map((i) =>
      [
        i.id,
        i.tipo,
        i.idPrincipal || '',
        i.descricao,
        i.prioridade,
        i.status,
        i.dataSolic,
        i.dataPrazo,
        i.solicitante,
        i.planner,
        i.observacoes || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demandas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado');
  };

  const tarefasPrincipais = items.filter((i) => i.tipo === 'Tarefa');

  return (
    <div
      className="min-h-screen bg-stone-50"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ==================== HEADER ==================== */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <div>
              <h1
                className="text-lg font-semibold text-slate-900 tracking-tight"
                style={{ fontFamily: "'IBM Plex Serif', serif" }}
              >
                Demandas
              </h1>
              <p className="text-xs text-stone-500">
                Controle de atividades internas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="text-sm text-stone-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-stone-100 flex items-center gap-2 transition-colors"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button
              onClick={() =>
                setModal({ mode: 'create', defaults: { tipo: 'Tarefa' } })
              }
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* ==================== DASHBOARD ==================== */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <MetricCard
            label="Total"
            value={metrics.total}
            icon={LayoutGrid}
            color="slate"
          />
          <MetricCard
            label="Pendentes"
            value={metrics.pendente}
            icon={Clock}
            color="amber"
          />
          <MetricCard
            label="Em andamento"
            value={metrics.andamento}
            icon={CircleDashed}
            color="sky"
          />
          <MetricCard
            label="Concluídas"
            value={metrics.concluido}
            icon={CheckCircle2}
            color="emerald"
          />
          <MetricCard
            label="Canceladas"
            value={metrics.cancelado}
            icon={Ban}
            color="neutral"
          />
          <MetricCard
            label="Alta prioridade"
            value={metrics.alta}
            icon={Siren}
            color="red"
          />
          <MetricCard
            label="Atrasadas"
            value={metrics.atrasadas}
            icon={CalendarClock}
            color="orange"
          />
        </section>

        {/* ==================== TOOLBAR ==================== */}
        <section className="bg-white border border-stone-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição ou ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-stone-50"
            />
          </div>
          <SelectFilter
            value={filterStatus}
            onChange={setFilterStatus}
            options={['Todos', ...STATUS_OPTIONS]}
            label="Status"
          />
          <SelectFilter
            value={filterPrioridade}
            onChange={setFilterPrioridade}
            options={['Todas', ...PRIORIDADE_OPTIONS]}
            label="Prioridade"
          />
          <SelectFilter
            value={filterResponsavel}
            onChange={setFilterResponsavel}
            options={responsaveis}
            label="Planner"
          />
          <SelectFilter
            value={filterSolicitante}
            onChange={setFilterSolicitante}
            options={solicitantes}
            label="Solicitante"
          />
          {(search ||
            filterStatus !== 'Todos' ||
            filterPrioridade !== 'Todas' ||
            filterResponsavel !== 'Todos' ||
            filterSolicitante !== 'Todos') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('Todos');
                setFilterPrioridade('Todas');
                setFilterResponsavel('Todos');
                setFilterSolicitante('Todos');
              }}
              className="text-xs text-stone-500 hover:text-slate-900 px-2 py-1"
            >
              Limpar filtros
            </button>
          )}
        </section>

        {/* ==================== TABELA ==================== */}
        <section className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                  <th className="text-left py-3 px-3 w-10"></th>
                  <th className="text-left py-3 px-3 w-20 font-medium">ID</th>
                  <th className="text-left py-3 px-3 font-medium">Descrição</th>
                  <th className="text-left py-3 px-3 w-32 font-medium">
                    Prioridade
                  </th>
                  <th className="text-left py-3 px-3 w-36 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-3 w-28 font-medium">
                    Solic.
                  </th>
                  <th className="text-left py-3 px-3 w-28 font-medium">
                    Prazo
                  </th>
                  <th className="text-left py-3 px-3 w-32 font-medium">
                    Solicitante
                  </th>
                  <th className="text-left py-3 px-3 w-24 font-medium">
                    Planner
                  </th>
                  <th className="text-right py-3 px-3 w-24 font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-16 text-stone-400"
                    >
                      Nenhuma demanda encontrada com os filtros aplicados.
                    </td>
                  </tr>
                )}
                {visibleRows.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    items={items}
                    collapsed={collapsed}
                    onToggle={toggleCollapse}
                    onStatusChange={handleStatusChange}
                    onEdit={() => setModal({ mode: 'edit', item })}
                    onDelete={() => setConfirmDel(item)}
                    onAddSub={() =>
                      setModal({
                        mode: 'create',
                        defaults: { tipo: 'Subtarefa', idPrincipal: item.id },
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between bg-stone-50">
            <span>
              {visibleRows.length} de {items.length}{' '}
              {items.length === 1 ? 'item' : 'itens'}
            </span>
            {loading && (
              <span className="text-stone-400">Sincronizando...</span>
            )}
          </div>
        </section>

        <p className="text-xs text-stone-400 mt-4 text-center">
          {API_URL
            ? 'Conectado ao Google Sheets'
            : 'Modo demonstração — configure API_URL para conectar ao Google Sheets'}
        </p>
      </main>

      {/* ==================== MODAL ==================== */}
      {modal && (
        <TaskModal
          mode={modal.mode}
          item={modal.item}
          defaults={modal.defaults}
          tarefasPrincipais={tarefasPrincipais}
          responsaveis={responsaveis.filter((r) => r !== 'Todos')}
          solicitantes={solicitantes.filter((s) => s !== 'Todos')}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* ==================== CONFIRM DELETE ==================== */}
      {confirmDel && (
        <ConfirmDialog
          item={confirmDel}
          items={items}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => handleDelete(confirmDel)}
        />
      )}

      {/* ==================== TOAST ==================== */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-sm font-medium z-50 flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MÉTRICA
// ============================================================================
function MetricCard({ label, value, icon: Icon, color }) {
  const colors = {
    slate: 'text-slate-900 bg-slate-100',
    amber: 'text-amber-700 bg-amber-100',
    sky: 'text-sky-700 bg-sky-100',
    emerald: 'text-emerald-700 bg-emerald-100',
    neutral: 'text-neutral-600 bg-neutral-200',
    red: 'text-red-700 bg-red-100',
    orange: 'text-orange-700 bg-orange-100',
  };
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
          {label}
        </span>
        <div
          className={`w-6 h-6 rounded flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div
        className="text-2xl font-semibold text-slate-900 tabular-nums"
        style={{ fontFamily: "'IBM Plex Serif', serif" }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// SELECT FILTER
// ============================================================================
function SelectFilter({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-stone-200 rounded-md px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {label}: {o}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
    </div>
  );
}

// ============================================================================
// LINHA DA TABELA
// ============================================================================
function Row({
  item,
  items,
  collapsed,
  onToggle,
  onStatusChange,
  onEdit,
  onDelete,
  onAddSub,
}) {
  const isSub = item.tipo === 'Subtarefa';
  const style = STATUS_STYLE[item.status];
  const hasSubs = !isSub && items.some((i) => i.idPrincipal === item.id);
  const isCollapsed = collapsed.has(item.id);
  const atrasada = isAtrasada(item);

  // Subtarefas: fundo branco; tarefas principais: fundo colorido pelo status
  const rowBg = isSub
    ? 'bg-white hover:bg-stone-50'
    : `${style.bg} ${style.bgHover}`;
  const borderLeft = isSub
    ? 'border-l-2 border-l-stone-200'
    : `border-l-4 ${style.border}`;

  return (
    <tr
      className={`${rowBg} ${borderLeft} border-b border-stone-200 transition-colors group`}
    >
      {/* Toggle */}
      <td className="py-2.5 px-3 align-top">
        {hasSubs ? (
          <button
            onClick={() => onToggle(item.id)}
            className="w-5 h-5 rounded hover:bg-white/60 flex items-center justify-center text-stone-500"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        ) : null}
      </td>

      {/* ID */}
      <td className="py-2.5 px-3 align-top">
        <div className={`flex items-center gap-1.5 ${isSub ? 'pl-6' : ''}`}>
          {isSub && <div className="w-3 h-px bg-stone-300"></div>}
          <span
            className={`tabular-nums text-xs font-medium ${
              isSub ? 'text-stone-500' : 'text-slate-900'
            }`}
          >
            {item.id}
          </span>
        </div>
      </td>

      {/* Descrição */}
      <td className="py-2.5 px-3 align-top">
        <div
          className={`${
            isSub ? 'pl-6 text-stone-700' : 'text-slate-900 font-medium'
          } text-sm leading-snug`}
        >
          {item.descricao}
        </div>
        {item.observacoes && (
          <div className="text-xs text-stone-500 mt-1 italic pl-0 line-clamp-2">
            {item.observacoes}
          </div>
        )}
      </td>

      {/* Prioridade */}
      <td className="py-2.5 px-3 align-top">
        {item.prioridade === 'Alta' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded ring-1 bg-red-100 text-red-800 ring-red-300">
            <Siren className="w-3 h-3" /> Alta
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded text-stone-600">
            <Bell className="w-3 h-3" /> Normal
          </span>
        )}
      </td>

      {/* Status — inline editável */}
      <td className="py-2.5 px-3 align-top">
        <StatusDropdown
          value={item.status}
          onChange={(v) => onStatusChange(item, v)}
        />
      </td>

      {/* Datas */}
      <td className="py-2.5 px-3 align-top text-xs text-stone-600 tabular-nums">
        {fmtDate(item.dataSolic)}
      </td>
      <td className="py-2.5 px-3 align-top text-xs tabular-nums">
        <span
          className={atrasada ? 'text-red-700 font-semibold' : 'text-stone-600'}
        >
          {fmtDate(item.dataPrazo)}
        </span>
        {atrasada && (
          <div className="text-[10px] text-red-600 font-medium">atrasada</div>
        )}
      </td>

      {/* Solicitante */}
      <td className="py-2.5 px-3 align-top text-xs text-stone-700">
        {item.solicitante || '—'}
      </td>

      {/* Planner */}
      <td className="py-2.5 px-3 align-top text-xs">
        {item.planner === 'Sim' ? (
          <span className="text-emerald-700 font-medium">Sim</span>
        ) : item.planner === 'Não' ? (
          <span className="text-stone-500">Não</span>
        ) : (
          <span className="text-stone-400">—</span>
        )}
      </td>

      {/* Ações */}
      <td className="py-2.5 px-3 align-top">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isSub && (
            <button
              onClick={onAddSub}
              className="p-1.5 rounded hover:bg-white/70 text-stone-600 hover:text-slate-900"
              title="Adicionar subtarefa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-white/70 text-stone-600 hover:text-slate-900"
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-white/70 text-stone-600 hover:text-red-600"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// STATUS DROPDOWN (edição rápida)
// ============================================================================
function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLE[value];
  const Icon = style.icon;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ring-1 ${style.chip} hover:brightness-95`}
      >
        <Icon className="w-3 h-3" />
        {style.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          ></div>
          <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-md shadow-lg z-40 min-w-[160px] overflow-hidden">
            {STATUS_OPTIONS.map((s) => {
              const st = STATUS_STYLE[s];
              const SIcon = st.icon;
              return (
                <button
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-stone-50 ${
                    s === value ? 'bg-stone-50 font-medium' : ''
                  }`}
                >
                  <SIcon className="w-3.5 h-3.5 text-stone-500" />
                  {st.label}
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
// MODAL CRIAR/EDITAR
// ============================================================================
function TaskModal({
  mode,
  item,
  defaults,
  tarefasPrincipais,
  responsaveis,
  solicitantes,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => ({
    descricao: item?.descricao || '',
    prioridade: item?.prioridade || 'Normal',
    status: item?.status || 'Pendente',
    dataSolic: item?.dataSolic || new Date().toISOString().slice(0, 10),
    dataPrazo: item?.dataPrazo || '',
    solicitante: item?.solicitante || '',
    planner: item?.planner || 'Não',
    tipo: item?.tipo || defaults?.tipo || 'Tarefa',
    idPrincipal: item?.idPrincipal || defaults?.idPrincipal || null,
    observacoes: item?.observacoes || '',
    id: item?.id,
  }));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.descricao.trim()) e.descricao = 'Descrição obrigatória';
    if (!form.dataSolic) e.dataSolic = 'Data obrigatória';
    if (form.dataPrazo && form.dataSolic && form.dataPrazo < form.dataSolic)
      e.dataPrazo = 'Prazo deve ser posterior à solicitação';
    if (form.tipo === 'Subtarefa' && !form.idPrincipal)
      e.idPrincipal = 'Selecione a tarefa principal';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSave(form);
  };
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-12 px-4 overflow-y-auto">
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2
            className="text-lg font-semibold text-slate-900"
            style={{ fontFamily: "'IBM Plex Serif', serif" }}
          >
            {mode === 'create'
              ? form.tipo === 'Subtarefa'
                ? 'Nova Subtarefa'
                : 'Nova Tarefa'
              : `Editar ${item.tipo}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-100 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {mode === 'create' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <div className="flex rounded-md border border-stone-200 overflow-hidden">
                  {['Tarefa', 'Subtarefa'].map((t) => (
                    <button
                      key={t}
                      onClick={() => update('tipo', t)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        form.tipo === t
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              {form.tipo === 'Subtarefa' && (
                <Field label="Tarefa Principal" error={errors.idPrincipal}>
                  <select
                    value={form.idPrincipal || ''}
                    onChange={(e) => update('idPrincipal', e.target.value)}
                    className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="">Selecione...</option>
                    {tarefasPrincipais.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} — {t.descricao.slice(0, 60)}
                        {t.descricao.length > 60 ? '…' : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          )}

          <Field label="Descrição *" error={errors.descricao}>
            <textarea
              value={form.descricao}
              onChange={(e) => update('descricao', e.target.value)}
              rows={3}
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
              placeholder="Descreva a demanda..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridade">
              <div className="flex rounded-md border border-stone-200 overflow-hidden">
                <button
                  onClick={() => update('prioridade', 'Normal')}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    form.prioridade === 'Normal'
                      ? 'bg-stone-100 text-slate-900'
                      : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" /> Normal
                </button>
                <button
                  onClick={() => update('prioridade', 'Alta')}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    form.prioridade === 'Alta'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <Siren className="w-3.5 h-3.5" /> Alta
                </button>
              </div>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de Solicitação *" error={errors.dataSolic}>
              <input
                type="date"
                value={form.dataSolic}
                onChange={(e) => update('dataSolic', e.target.value)}
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </Field>
            <Field label="Data de Prazo" error={errors.dataPrazo}>
              <input
                type="date"
                value={form.dataPrazo}
                onChange={(e) => update('dataPrazo', e.target.value)}
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Solicitante">
              <input
                type="text"
                list="list-solic"
                value={form.solicitante}
                onChange={(e) => update('solicitante', e.target.value)}
                placeholder="Ex.: Manu, Perdigão..."
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <datalist id="list-solic">
                {solicitantes.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Planner">
              <select
                value={form.planner}
                onChange={(e) => update('planner', e.target.value)}
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option>Sim</option>
                <option>Não</option>
              </select>
            </Field>
          </div>

          <Field label="Observações">
            <textarea
              value={form.observacoes}
              onChange={(e) => update('observacoes', e.target.value)}
              rows={2}
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
              placeholder="Informações adicionais..."
            />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-2 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md"
          >
            {mode === 'create' ? 'Criar' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================
function ConfirmDialog({ item, items, onCancel, onConfirm }) {
  const subCount =
    item.tipo === 'Tarefa'
      ? items.filter((i) => i.idPrincipal === item.id).length
      : 0;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Confirmar exclusão</h3>
            <p className="text-sm text-stone-600 mt-1">
              Excluir <strong>{item.id}</strong> — {item.descricao.slice(0, 80)}
              {item.descricao.length > 80 ? '…' : ''}?
            </p>
            {subCount > 0 && (
              <p className="text-sm text-red-700 mt-2 bg-red-50 border border-red-200 rounded p-2">
                ⚠️ Esta tarefa possui{' '}
                <strong>
                  {subCount} subtarefa{subCount > 1 ? 's' : ''}
                </strong>{' '}
                que também serão excluídas.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
