import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { DisplayNameSheet } from '@/features/display-name'
import { HouseholdSheet } from '@/features/household-form'
import { InviteLinkSheet } from '@/features/invite-member'
import { JoinHouseholdSheet } from '@/features/join-household'
import { ProductSheet } from '@/features/product-form'
import { PurchaseSheet } from '@/features/purchase-shopping-item'
import { SectionManagerSheet, SectionSheet } from '@/features/section-form'
import { ShoppingItemSheet } from '@/features/shopping-item-form'
import { lockPageScroll } from '@/shared/lib/scrollLock'
import { closeSheet, ConfirmSheet, useActiveSheet } from '@/shared/ui'

/**
 * Единственное место, где рисуются шторки. Стоит в корневом каркасе; экраны только
 * вызывают openSheet(...) и ничего о шторках не знают.
 */
export function SheetHost() {
  const sheet = useActiveSheet()
  const { pathname } = useLocation()

  // Переход на другой экран (и выход из приложения) закрывает открытую шторку.
  useEffect(() => closeSheet, [pathname])

  // Пока открыта любая шторка, страница под ней стоит на месте.
  const isOpen = sheet !== null
  useEffect(() => (isOpen ? lockPageScroll() : undefined), [isOpen])

  switch (sheet?.type) {
    case 'add-product':
      return <ProductSheet sectionId={sheet.sectionId} />
    case 'add-section':
      return <SectionSheet />
    case 'manage-section':
      return <SectionManagerSheet section={sheet.section} />
    case 'add-item':
      return <ShoppingItemSheet />
    case 'purchase':
      return <PurchaseSheet item={sheet.item} />
    case 'invite-link':
      return <InviteLinkSheet link={sheet.link} />
    case 'join':
      return <JoinHouseholdSheet />
    case 'my-name':
      return <DisplayNameSheet current={sheet.current} />
    case 'edit-home':
      return <HouseholdSheet />
    case 'confirm':
      return (
        <ConfirmSheet
          title={sheet.title}
          description={sheet.description}
          confirmLabel={sheet.confirmLabel}
          onConfirm={sheet.onConfirm}
        />
      )
    default:
      return null
  }
}
