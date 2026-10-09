import { Link } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer>
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <div className="font-display text-[7rem] font-extrabold leading-none text-white/[0.07] sm:text-[11rem]">404</div>
        <h1 className="-mt-6 font-display text-2xl font-bold text-white sm:text-3xl">Page not found</h1>
        <p className="mt-3 max-w-md text-sm text-white/50">
          The page you’re looking for doesn’t exist — it may have been a typo or an outdated link.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-accent h-11 px-6">
            <Compass className="h-4 w-4" /> Go home
          </Link>
          <Link to="/search" className="btn-ghost h-11 px-6">
            <Search className="h-4 w-4" /> Search music
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
