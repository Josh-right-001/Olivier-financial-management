import Image from "next/image"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-32 w-32 animate-pulse">
          <Image src="/logo.png" alt="OLIVIER Logo" fill className="object-contain" priority />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite] bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    </div>
  )
}
