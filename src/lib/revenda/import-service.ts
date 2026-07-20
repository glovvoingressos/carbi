import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { ImportJob } from './adapters/types'

export async function getImportJobs(userId: string): Promise<ImportJob[]> {
  const client = getSupabaseServerClient()
  const { data } = await client
    .from('import_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data as ImportJob[]) || []
}

export async function getImportJob(jobId: string): Promise<ImportJob | null> {
  const client = getSupabaseServerClient()
  const { data } = await client
    .from('import_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  return (data as ImportJob) || null
}

export async function createImportJob(userId: string, filename: string, mapping: Record<string, string>): Promise<ImportJob> {
  const client = getSupabaseServerClient()
  const { data } = await client
    .from('import_jobs')
    .insert({ user_id: userId, filename, mapping })
    .select()
    .single()
  return data as ImportJob
}

export async function updateImportJob(jobId: string, updates: Partial<ImportJob>): Promise<void> {
  const client = getSupabaseServerClient()
  await client.from('import_jobs').update(updates).eq('id', jobId)
}
