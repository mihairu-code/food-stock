import { useSignOut } from '@/features/account/api/accountActions'
import { useT } from '@/shared/i18n'
import { ConfirmSheet } from '@/shared/ui/sheet/ConfirmSheet'

export function SignOutSheet() {
  const t = useT()
  const signOut = useSignOut()
  return (
    <ConfirmSheet
      title={t('confirm.signOutTitle')}
      description={t('confirm.signOutText')}
      confirmLabel={t('confirm.signOut')}
      onConfirm={() => signOut.mutate()}
    />
  )
}
