import { useMemo, useState } from 'react'
import { ChartBar, Globe2, RefreshCw } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { MediaCard } from '@/components/music/MediaCard'
import { CardRowSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useCharts } from '@/hooks/queries'
import { COUNTRIES } from '@/constants/countries'
import { cn } from '@/utils/cn'

export function ChartsPage() {
  const [country, setCountry] = useState('US')
  const { data, isLoading, isError, refetch, isFetching } = useCharts(country)
  const countryName = useMemo(() => COUNTRIES.find((c) => c.code === country)?.name ?? country, [country])

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Discover"
        title="Charts"
        subtitle={`Chart playlists for ${countryName}, supplied directly by the Verome API.`}
        action={
          <button type="button" onClick={() => void refetch()} className="btn-ghost h-9 text-xs" disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
          </button>
        }
      />

      <div className="mb-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCountry(c.code)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition',
              country === c.code
                ? 'border-brand-500/50 bg-brand-dim text-brand-300'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-ink-850/70 px-4 py-3 text-xs leading-relaxed text-white/50">
        <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
        <span>
          These are curated chart <em>playlists</em> provided by YouTube Music. SonicWave does not compute or claim official
          rankings — it simply surfaces the lists the API returns for the selected region.
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-9">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-5 w-40 animate-pulse rounded bg-white/[0.06]" />
              <CardRowSkeleton count={5} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Charts unavailable" message="The charts endpoint did not respond." onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState
          icon={<ChartBar className="h-6 w-6" />}
          title="No charts for this region"
          description="Try another country — this region returned no chart sections."
        />
      ) : (
        <div className="space-y-9">
          {data.map((section) => (
            <section key={section.title} className="animate-fade-up">
              <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-white">{section.title}</h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {section.items.slice(0, 15).map((item) => (
                  <MediaCard
                    key={item.id}
                    variant="playlist"
                    title={item.title}
                    subtitle={item.subtitle ?? undefined}
                    image={item.thumbnail}
                    href={item.browseId ? `/playlist/${item.browseId.replace(/^VL/, '')}` : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
