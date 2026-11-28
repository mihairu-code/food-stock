import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useSortedSections } from '@/entities/section'
import { matchProductsByName, normalizeQuery, useHomeSearch } from '@/features/home-search'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { rich } from '@/shared/i18n/rich'
import { AddRow, EmptyState, Hint, openSheet, StatusNote, SummaryBar } from '@/shared/ui'
import { useHomeCoach } from '../model/useHomeCoach'
import { useSearchAnnouncement } from '../model/useSearchAnnouncement'
import { ReadySections } from './ReadySections'
import { SectionBoard } from './SectionBoard'

const addSection = () => openSheet({ type: 'add-section' })

/** Название нового продукта из того, что искали: без лишних пробелов, с заглавной буквы. */
const nameFromQuery = (query: string) => {
  const name = query.trim().replace(/\s+/g, ' ')
  return name.charAt(0).toLocaleUpperCase() + name.slice(1)
}

export function HomePage() {
  const t = useT()
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()
  const search = useHomeSearch()
  const query = search.open ? normalizeQuery(search.query) : ''
  // Сколько найдено во всём доме — для пустого результата и скринридера. Разделы считают своё сами.
  const foundCount = useMemo(() => (query ? matchProductsByName(products, query).length : 0), [products, query])
  const announcement = useSearchAnnouncement(
    query ? (foundCount > 0 ? t('search.found', { count: foundCount }) : t('search.nothing')) : '',
  )

  useHomeCoach({ hasSections: sections.length > 0, products, loaded: !isLoading && !isError })

  if (isLoading) return <StatusNote loading>{t('home.loading')}</StatusNote>
  if (isError) return <StatusNote>{t('common.loadError')}</StatusNote>

  if (sections.length === 0) return <ReadySections />

  const atHome = products.filter((product) => product.is_available).length
  const searchedName = nameFromQuery(search.query)

  return (
    <>
      <SummaryBar onAdd={() => openSheet({ type: 'add-product' })}>
        {rich(t('home.summary', { count: atHome }))}
      </SummaryBar>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {query && foundCount === 0 ? (
        <EmptyState
          emoji="🔍"
          title={t('search.emptyTitle')}
          text={t('search.emptyText', { query: search.query.trim().replace(/\s+/g, ' ') })}
        >
          <button
            className="btn"
            type="button"
            onClick={() => openSheet({ type: 'add-product', name: searchedName })}
          >
            <Plus size={16} /> {t('search.add', { name: searchedName })}
          </button>
        </EmptyState>
      ) : (
        <SectionBoard sections={sections} products={products} query={query} />
      )}

      {/* Во время поиска — только найденное: добавлять разделы и читать подсказку незачем. */}
      {!query && <AddRow label={t('section.newTitle')} onClick={addSection} />}

      {!query && products.length > 0 && (
        <Hint label={t('home.hintLabel')} onlyWhenHintsOn>
          {t('home.hint')}
        </Hint>
      )}
    </>
  )
}
