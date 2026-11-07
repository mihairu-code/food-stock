import { useHomeData, useSortedSections } from '@/data/useHomeData'

export function HomeScreen() {
  const { isLoading } = useHomeData()
  const sections = useSortedSections()
  if (isLoading) return <p className="status">Загрузка…</p>
  return (
    <ul>
      {sections.map((section) => (
        <li key={section.id}>{section.name}</li>
      ))}
    </ul>
  )
}
