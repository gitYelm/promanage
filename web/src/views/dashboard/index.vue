<script setup lang="ts">
import { Activity, ArrowUpRight, CreditCard, DollarSign, Users } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
</script>

<template>
  <div class="flex min-h-screen w-full flex-col">
    <main class="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium"> 总营收 </CardTitle>
            <DollarSign class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">$45,231.89</div>
            <p class="text-xs text-muted-foreground">较上月增长 +20.1%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium"> 订阅用户 </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+2350</div>
            <p class="text-xs text-muted-foreground">较上月增长 +180.1%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium"> 销售额 </CardTitle>
            <CreditCard class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+12,234</div>
            <p class="text-xs text-muted-foreground">较上月增长 +19%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium"> 活跃用户 </CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">+573</div>
            <p class="text-xs text-muted-foreground">较上小时增长 +201</p>
          </CardContent>
        </Card>
      </div>
      <div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card class="xl:col-span-2">
          <CardHeader class="flex flex-row items-center">
            <div class="grid gap-2">
              <CardTitle>交易记录</CardTitle>
              <CardDescription> 近期共有 5 笔交易记录。 </CardDescription>
            </div>
            <Button as-child size="sm" class="ml-auto gap-1">
              <a href="#">
                查看全部
                <ArrowUpRight class="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead class="hidden xl:table-cell"> 类型 </TableHead>
                  <TableHead class="hidden xl:table-cell"> 状态 </TableHead>
                  <TableHead class="hidden xl:table-cell"> 日期 </TableHead>
                  <TableHead class="text-right"> 金额 </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div class="font-medium">Liam Johnson</div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      liam@example.com
                    </div>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> Sale </TableCell>
                  <TableCell class="hidden xl:table-cell">
                    <Badge class="text-xs" variant="outline"> Approved </Badge>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> 2023-06-23 </TableCell>
                  <TableCell class="text-right"> $250.00 </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div class="font-medium">Olivia Smith</div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      olivia@example.com
                    </div>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> Refund </TableCell>
                  <TableCell class="hidden xl:table-cell">
                    <Badge class="text-xs" variant="outline"> Declined </Badge>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> 2023-06-24 </TableCell>
                  <TableCell class="text-right"> $150.00 </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div class="font-medium">Noah Williams</div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      noah@example.com
                    </div>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> Subscription </TableCell>
                  <TableCell class="hidden xl:table-cell">
                    <Badge class="text-xs" variant="outline"> Approved </Badge>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> 2023-06-25 </TableCell>
                  <TableCell class="text-right"> $350.00 </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div class="font-medium">Emma Brown</div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      emma@example.com
                    </div>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> Sale </TableCell>
                  <TableCell class="hidden xl:table-cell">
                    <Badge class="text-xs" variant="outline"> Approved </Badge>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> 2023-06-26 </TableCell>
                  <TableCell class="text-right"> $450.00 </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div class="font-medium">Liam Johnson</div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      liam@example.com
                    </div>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> Sale </TableCell>
                  <TableCell class="hidden xl:table-cell">
                    <Badge class="text-xs" variant="outline"> Approved </Badge>
                  </TableCell>
                  <TableCell class="hidden xl:table-cell"> 2023-06-27 </TableCell>
                  <TableCell class="text-right"> $550.00 </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>近期销售</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-8">
            <div class="flex items-center gap-4">
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarImage src="/avatars/01.png" alt="Avatar" />
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">Olivia Martin</p>
                <p class="text-sm text-muted-foreground">olivia.martin@email.com</p>
              </div>
              <div class="ml-auto font-medium">+$1,999.00</div>
            </div>
            <div class="flex items-center gap-4">
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarImage src="/avatars/02.png" alt="Avatar" />
                <AvatarFallback>JL</AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">Jackson Lee</p>
                <p class="text-sm text-muted-foreground">jackson.lee@email.com</p>
              </div>
              <div class="ml-auto font-medium">+$39.00</div>
            </div>
            <div class="flex items-center gap-4">
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarImage src="/avatars/03.png" alt="Avatar" />
                <AvatarFallback>IN</AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">Isabella Nguyen</p>
                <p class="text-sm text-muted-foreground">isabella.nguyen@email.com</p>
              </div>
              <div class="ml-auto font-medium">+$299.00</div>
            </div>
            <div class="flex items-center gap-4">
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarImage src="/avatars/04.png" alt="Avatar" />
                <AvatarFallback>WK</AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">William Kim</p>
                <p class="text-sm text-muted-foreground">will@email.com</p>
              </div>
              <div class="ml-auto font-medium">+$99.00</div>
            </div>
            <div class="flex items-center gap-4">
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarImage src="/avatars/05.png" alt="Avatar" />
                <AvatarFallback>SD</AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">Sofia Davis</p>
                <p class="text-sm text-muted-foreground">sofia.davis@email.com</p>
              </div>
              <div class="ml-auto font-medium">+$39.00</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
