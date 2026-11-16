import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { NameSheet } from '@/features/display-name/ui/NameSheet'
import { HomeSheet } from '@/features/household-form/ui/HomeSheet'
import { InviteLinkSheet } from '@/features/invite-member/ui/InviteLinkSheet'
import { JoinSheet } from '@/features/join-household/ui/JoinSheet'
import { ProductSheet } from '@/features/product-form/ui/ProductSheet'
import { PurchaseSheet } from '@/features/purchase-shopping-item/ui/PurchaseSheet'
import { SectionManagerSheet } from '@/features/section-form/ui/SectionManagerSheet'
import { SectionSheet } from '@/features/section-form/ui/SectionSheet'
import { AddItemSheet } from '@/features/shopping-item-form/ui/AddItemSheet'
import { RemoveMemberSheet } from '@/pages/settings/ui/RemoveMemberSheet'
import { ResetDataSheet } from '@/pages/settings/ui/ResetDataSheet'
import { SignOutSheet } from '@/pages/settings/ui/SignOutSheet'
import { lockPageScroll } from '@/shared/lib/scrollLock'
import { closeSheet, useActiveSheet } from '@/shared/ui/sheet/sheetStore'

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
