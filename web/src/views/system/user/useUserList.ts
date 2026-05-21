import { reactive, ref } from 'vue'
import { listUser } from '@/api/system/user'
import { listDeptTree } from '@/api/system/dept'
import type { SysUser } from '@/api/system/types'
import { toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
import { toggleTableSort } from '@/utils/table-sort'

function toTreeDept(list: any[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []

  list.forEach((item) => {
    const node = { ...item, children: item.children ?? [] }
    map.set(item.deptId, node)
  })

  map.forEach((node) => {
    const pid = node.parentId ?? '0'
    if (pid === '0' || !map.has(pid)) {
      roots.push(node)
    } else {
      const parent = map.get(pid)!
      parent.children = parent.children ?? []
      parent.children.push(node)
    }
  })

  return roots
}

export function useUserList() {
  const loading = ref(true)
  const userList = ref<SysUser[]>([])
  const total = ref(0)
  const deptOptions = ref<any[]>([])
  const queryParams = reactive({
    pageNum: 1,
    pageSize: 20,
    userName: '',
    phonenumber: '',
    status: ALL_OPTION_VALUE as string,
    deptId: undefined as string | undefined,
    roleId: undefined as string | number | undefined,
    beginTime: '',
    endTime: '',
    sortBy: '',
    sortOrder: '' as 'asc' | 'desc' | '',
  })

  async function getList() {
    loading.value = true
    try {
      const res = await listUser({ ...queryParams, status: toQueryValue(queryParams.status) })
      userList.value = res.rows
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function getDeptTree() {
    const res = await listDeptTree()
    deptOptions.value = toTreeDept(res)
  }

  function handleQuery() {
    queryParams.pageNum = 1
    getList()
  }

  function handleSort(key: string) {
    toggleTableSort(queryParams, key)
    getList()
  }

  function resetQuery() {
    queryParams.userName = ''
    queryParams.phonenumber = ''
    queryParams.status = ALL_OPTION_VALUE
    queryParams.deptId = undefined
    queryParams.roleId = undefined
    queryParams.beginTime = ''
    queryParams.endTime = ''
    queryParams.sortBy = ''
    queryParams.sortOrder = ''
    handleQuery()
  }

  return { loading, userList, total, deptOptions, queryParams, getList, getDeptTree, handleQuery, resetQuery, handleSort }
}
