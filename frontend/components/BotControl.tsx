'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Square, 
  Search, 
  Camera,
  AlertCircle,
  CheckCircle2,
  Activity
} from 'lucide-react'

export default function BotControl() {
  const [scannerStatus, setScannerStatus] = useState<'stopped' | 'running'>('stopped')
  const [screenshotStatus, setScreenshotStatus] = useState<'stopped' | 'running'>('stopped')

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <CardTitle>Scanner Bot</CardTitle>
            </div>
            <Badge 
              variant={scannerStatus === 'running' ? 'default' : 'secondary'}
              className={scannerStatus === 'running' ? 'bg-green-500' : ''}
            >
              {scannerStatus === 'running' ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Aktywny
                </>
              ) : (
                'Zatrzymany'
              )}
            </Badge>
          </div>
          <CardDescription>
            Skanuje grupy Facebook i filtruje posty według słów kluczowych
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Grupa:</span>
              <span className="font-medium">mywpolsce</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Webhook:</span>
              <span className="font-mono text-xs">n8n-ivorylab.pl</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max postów/sesja:</span>
              <span className="font-medium">15</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Kategorie:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">legalizacja</Badge>
              <Badge variant="outline">tłumaczenia</Badge>
              <Badge variant="outline">uczelnie</Badge>
              <Badge variant="outline">pesel</Badge>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Uruchom bota ręcznie w terminalu:
            </p>
            <code className="block bg-black text-green-400 p-3 rounded text-xs font-mono">
              node fb-scanner-bot.js
            </code>
          </div>

          <Button 
            className="w-full"
            variant={scannerStatus === 'running' ? 'destructive' : 'default'}
            onClick={() => setScannerStatus(scannerStatus === 'running' ? 'stopped' : 'running')}
            disabled
          >
            {scannerStatus === 'running' ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Zatrzymaj (wymaga terminala)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Uruchom (wymaga terminala)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-purple-200 dark:border-purple-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              <CardTitle>Screenshot Bot</CardTitle>
            </div>
            <Badge 
              variant={screenshotStatus === 'running' ? 'default' : 'secondary'}
              className={screenshotStatus === 'running' ? 'bg-green-500' : ''}
            >
              {screenshotStatus === 'running' ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Aktywny
                </>
              ) : (
                'Zatrzymany'
              )}
            </Badge>
          </div>
          <CardDescription>
            Pobiera posty z bazy, robi screenshoty i uploaduje do Storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Polling:</span>
              <span className="font-medium">Co 5s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage:</span>
              <span className="font-medium">Supabase</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Viewport:</span>
              <span className="font-medium">1280x800</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Workflow:</h4>
            <ol className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                Pobiera posty ze statusem "new"
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                Robi screenshot posta
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                Uploaduje do Supabase Storage
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                Aktualizuje status na "done"
              </li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Uruchom bota ręcznie w terminalu:
            </p>
            <code className="block bg-black text-green-400 p-3 rounded text-xs font-mono">
              node fb-screenshot-bot.js
            </code>
          </div>

          <Button 
            className="w-full"
            variant={screenshotStatus === 'running' ? 'destructive' : 'default'}
            onClick={() => setScreenshotStatus(screenshotStatus === 'running' ? 'stopped' : 'running')}
            disabled
          >
            {screenshotStatus === 'running' ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Zatrzymaj (wymaga terminala)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Uruchom (wymaga terminala)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Instrukcja uruchamiania
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">1. Przygotowanie sesji Facebook</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Musisz mieć zapisane ciasteczka sesji Facebook w pliku:
              </p>
              <code className="block bg-muted p-2 rounded text-xs">
                fb-session/cookies.json
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Konfiguracja środowiska</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Upewnij się, że plik .env zawiera:
              </p>
              <code className="block bg-muted p-2 rounded text-xs">
                SUPABASE_URL=...<br/>
                SUPABASE_KEY=...
              </code>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">3. Uruchomienie botów</h4>
            <p className="text-sm text-muted-foreground mb-2">
              W dwóch osobnych terminalach uruchom:
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              <code className="block bg-black text-green-400 p-3 rounded text-xs font-mono">
                # Terminal 1<br/>
                node fb-scanner-bot.js
              </code>
              <code className="block bg-black text-green-400 p-3 rounded text-xs font-mono">
                # Terminal 2<br/>
                node fb-screenshot-bot.js
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
