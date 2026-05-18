import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import type { BugProject, BugUserOptionParams, BugUserRef } from '@/api/bug/types'

export interface PmBasicResources {
  projects: BugProject[]
  users: BugUserRef[]
}

export async function loadPmBasicResources(params: BugUserOptionParams = {}): Promise<PmBasicResources> {
  const [projects, users] = await Promise.all([bugProjectOptions(), bugUserOptions('', params)])
  return { projects, users }
}
