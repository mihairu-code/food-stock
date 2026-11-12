import { useSignOut } from '@/data/hooks'
import { useT } from '@/i18n'
import { ConfirmSheet } from './ConfirmSheet'

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
