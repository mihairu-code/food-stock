import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { lockPageScroll } from '@/shared/lib/scrollLock'
import { closeSheet, useActiveSheet } from '@/shared/ui/sheet/sheetStore'
import { AddItemSheet } from './AddItemSheet'
import { HomeSheet } from './HomeSheet'
import { InviteLinkSheet } from './InviteLinkSheet'
import { JoinSheet } from './JoinSheet'
import { NameSheet } from './NameSheet'
import { ProductSheet } from './ProductSheet'
import { PurchaseSheet } from './PurchaseSheet'
import { RemoveMemberSheet } from './RemoveMemberSheet'
import { ResetDataSheet } from './ResetDataSheet'
import { SectionManagerSheet } from './SectionManagerSheet'
import { SectionSheet } from './SectionSheet'
import { SignOutSheet } from './SignOutSheet'

/**
 * Единственное место, где рисуются шторки. Стоит в корневом Layout; экраны только
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
      return <AddItemSheet />
    case 'purchase':
      return <PurchaseSheet item={sheet.item} />
    case 'invite-link':
      return <InviteLinkSheet link={sheet.link} />
    case 'join':
      return <JoinSheet />
    case 'my-name':
      return <NameSheet current={sheet.current} />
    case 'edit-home':
      return <HomeSheet />
    case 'remove-member':
      return <RemoveMemberSheet member={sheet.member} />
    case 'sign-out':
      return <SignOutSheet />
    case 'reset':
      return <ResetDataSheet />
    default:
      return null
  }
}
