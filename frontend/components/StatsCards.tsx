'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    total: number
    done: number
    processing: number
    error: number
    processed: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wszystkie posty</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Łącznie w bazie</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow border-green-200 dark:border-green-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gotowe</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.done}</div>
          <p className="text-xs text-muted-foreground">Ze screenshotami</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">W trakcie</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          <p className="text-xs text-muted-foreground">Przetwarzane</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow border-red-200 dark:border-red-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Błędy</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <p className="text-xs text-muted-foreground">Wymagają uwagi</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Opracowane</CardTitle>
          <Activity className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.processed}</div>
          <p className="text-xs text-muted-foreground">Zakończone</p>
        </CardContent>
      </Card>
    </div>
  )
}
