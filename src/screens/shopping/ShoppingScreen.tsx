import { useShoppingList } from '@/data/useHomeData'

export function ShoppingScreen() {
  const entries = useShoppingList()
  return (
    <ul>
      {entries.map((entry) => (
        <li key={entry.key}>{entry.type === 'product' ? entry.product.name : entry.item.name}</li>
      ))}
    </ul>
  )
}
