// Query/Mutation hooks — ห่อการเรียก API ด้วย TanStack Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Asset,
  AuditRow,
  DashboardStats,
  LogRow,
  Paged,
  Shop,
} from '@/types/database'

type ListParams = Record<string, unknown>

// ---------- Dashboard ----------
export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => api<DashboardStats>('dashboard') })
}

// ---------- Shops ----------
export function useShops(params: ListParams) {
  return useQuery({
    queryKey: ['shops', params],
    queryFn: () => api<Paged<Shop>>('listShops', params),
  })
}
export function useShop(id?: string) {
  return useQuery({
    queryKey: ['shop', id],
    queryFn: () => api<{ shop: Shop; assets: Asset[]; logs: LogRow[] }>('getShop', { id }),
    enabled: !!id,
  })
}
export function useUpsertShop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (shop: Partial<Shop>) => api<Shop>('upsertShop', { shop }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shops'] })
      qc.invalidateQueries({ queryKey: ['shop'] })
    },
  })
}

// ---------- Assets ----------
export function useAssets(params: ListParams) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => api<Paged<Asset> & { categories: string[] }>('listAssets', params),
  })
}
export function useUpsertAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (asset: Partial<Asset>) => api<Asset>('upsertAsset', { asset }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  })
}

// ---------- Loans ----------
export function useLoans(params: ListParams) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: () => api<Paged<LogRow>>('listLoans', params),
  })
}
export function useLoan(id?: string) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: () => api<LogRow>('getLoan', { id }),
    enabled: !!id,
  })
}
export function useCreateLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api<LogRow>('createLoan', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
export function useReturnLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; note?: string }) => api<LogRow>('returnLoan', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['loan'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

// ---------- Movements ----------
export function useMovements(params: ListParams) {
  return useQuery({
    queryKey: ['movements', params],
    queryFn: () => api<Paged<LogRow>>('listMovements', params),
  })
}
export function useCreateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api<LogRow>('createMovement', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movements'] }),
  })
}
export function useApproveMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; decision: 'approved' | 'rejected' }) =>
      api<LogRow>('approveMovement', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ---------- Audit ----------
export function useAudit(params: ListParams) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => api<Paged<AuditRow>>('listAudit', params),
  })
}
export function useCreateAudit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api<{ inserted: number }>('createAudit', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
