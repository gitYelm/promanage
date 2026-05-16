import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import type { BugProject, BugUserRef } from '@/api/bug/types'

export interface PmBasicResources {
  projects: BugProject[]
  users: BugUserRef[]
}

export async function loadPmBasicResources(): Promise<PmBasicResources> {
  const [projects, users] = await Promise.all([bugProjectOptions(), bugUserOptions()])
  return { projects, users }
}
