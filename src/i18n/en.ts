import type { Messages } from './ru'

export const en: Messages = {
  'app.name': 'Home Stock',
  'app.shortName': 'Stock',
  'app.tagline': 'A shared list of food at home and things to buy',

  'common.add': 'Add',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.done': 'Done',
  'common.ok': 'Got it',
  'common.continue': 'Continue',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',
  'common.loadError': 'Couldn’t load the data. Check your connection.',
  'common.saveError': 'Couldn’t save the change',
  'common.actionError': 'Something went wrong',
  'common.checkConnection': 'Check your internet connection and try again.',

  quote: '“{name}”',

  'n.products': { one: '{count} item', other: '{count} items' },
  'n.sections': { one: '{count} section', other: '{count} sections' },
  'n.members': { one: '{count} member', other: '{count} members' },

  'nav.label': 'Main navigation',
  'nav.home': 'Home',
  'nav.shopping': 'Shopping',
  'nav.settings': 'Settings',
  'nav.shoppingCount': 'Shopping, items: {count}',

  'title.home': 'At home',

  'header.settingsLink': 'Members and settings',

  'home.loading': 'Loading your food…',
  'home.emptyTitle': 'Start with a section',
  'home.emptyText': 'Sections are the places where food is kept: “Fridge”, “Cupboard”, “Treats”.',
  'home.createSection': 'Create a section',
  'home.summary': { one: '<b>{count}</b> item at home', other: '<b>{count}</b> items at home' },
  'home.sectionCount': 'Items: {count}',
  'home.editSection': 'Edit section “{name}”',
  'home.addProductTo': 'Add an item to “{name}”',
  'home.defaultName': 'Our home',
  'home.preparing': 'Setting up your home…',

  'product.staple': 'Always at home',
  'product.oneOff': 'One-off',
  'product.out': 'Ran out',
  'product.inList': 'On the shopping list',
  'product.outInList': 'Ran out · on the shopping list',
  'product.markOut': '{name}: at home. Mark as run out',
  'product.markIn': '{name}: ran out. Mark as at home',
  'product.addToList': 'Add “{name}” to the shopping list',
  'product.removeFromList': 'Remove “{name}” from the shopping list',
  'product.delete': 'Delete “{name}”',
  'product.keep': 'Always keep at home',
  'product.keepHint': 'When it runs out, it goes on the shopping list by itself',

  'productSheet.title': 'Add an item',
  'productSheet.description': 'Add something you have at home',
  'productSheet.name': 'Item name',
  'productSheet.placeholder': 'For example, yogurt',

  'field.section': 'Section',

  'emoji.label': 'Icon — optional',
  'emoji.hint': 'suggested from the name',

  'section.title': 'Section',
  'section.newTitle': 'New section',
  'section.newDescription': 'For example, “Fridge”, “Cupboard” or “Treats”',
  'section.name': 'Section name',
  'section.delete': 'Delete section',
  'section.deleteTitle': 'Delete “{name}”?',
  'section.deleteText': {
    one: '<b>{count} item</b> will be deleted for good together with the section.',
    other: '<b>{count} items</b> will be deleted for good together with the section.',
  },
  'section.deleteInList': {
    one: '{count} of them will disappear from the shopping list.',
    other: '{count} of them will disappear from the shopping list.',
  },
  'section.deleteNoUndo': 'This can’t be undone.',

  'shopping.loading': 'Loading the list…',
  'shopping.nothing': 'Nothing to buy',
  'shopping.summary': { one: '<b>{count}</b> item to buy', other: '<b>{count}</b> items to buy' },
  'shopping.emptyTitle': 'The list is empty',
  'shopping.emptyText':
    'Tap “+” next to an item on the Home tab, or add something here. Items you always keep at home land here by themselves when they run out.',
  'shopping.bought': 'Bought',
  'shopping.boughtAria': 'Bought: {name}',
  'shopping.remove': 'Remove',
  'shopping.manual': 'Added by hand',
  'shopping.out': 'ran out',
  'shopping.stillHome': 'still at home',
  'shopping.addTitle': 'Add to the shopping list',
  'shopping.addDescription': 'You’ll pick a section later, once it’s bought',
  'shopping.whatToBuy': 'What to buy',
  'shopping.placeholder': 'For example, bread',

  'purchase.title': 'Where does it go?',
  'purchase.description': '“{name}” — bought',
  'purchase.submit': 'Add to home',
  'purchase.needSectionTitle': 'You need a section first',
  'purchase.needSectionText': 'To put the purchase away, create at least one section on the Home tab.',

  'toast.backHome': '“{name}” is at home again',
  'toast.outToList': '“{name}” ran out — added to the shopping list',
  'toast.out': '“{name}” ran out',
  'toast.addedToList': '“{name}” is on the shopping list',
  'toast.removedFromList': '“{name}” removed from the shopping list',
  'toast.deleted': 'Deleted: “{name}”',
  'toast.movedTo': '“{name}” is now in “{section}”',

  'dnd.instructions':
    'To reorder, press Space, move with the arrow keys and press Space again. Escape cancels.',
  'dnd.product': 'item, can be reordered',
  'dnd.section': 'section, can be reordered',
  'dnd.picked': 'Picked up “{name}”',
  'dnd.over': '“{name}” is next to “{target}”',
  'dnd.dropped': '“{name}” is in its new place',
  'dnd.cancelled': 'Reordering cancelled: “{name}”',

  'toast.addedTo': 'Added to “{name}”',
  'toast.addedItem': 'Added to the shopping list',
  'toast.purchasedStaple': 'Added to “{name}” as an item you always keep',
  'toast.purchasedOnce': 'Added to “{name}” as a one-off',
  'toast.sectionCreated': 'Section “{name}” created',
  'toast.sectionDeleted': 'Section “{name}” deleted',
  'toast.linkError': 'Couldn’t create the link',
  'toast.linkRevoked': 'Link revoked',
  'toast.memberRemoved': 'Member removed from the home',
  'toast.googleError': 'Couldn’t open Google sign-in',
  'toast.googleFailed': 'Google sign-in wasn’t completed',
  'toast.demoRestored': 'Demo data restored',
  'toast.joined': 'You’ve joined the home',
  'toast.copied': 'Link copied',
  'toast.copyError': 'Couldn’t copy — select the link by hand',
  'toast.nameError': 'Couldn’t save the name',
  'toast.renameError': 'Couldn’t rename the home',

  'settings.demoText':
    'Data is kept only in this browser. Sharing and syncing between devices turn on once Supabase is connected — the steps are in the README.',
  'settings.groupHome': 'Home',
  'settings.homeName': 'Home name',
  'settings.sections': 'Sections',
  'settings.sectionsMeta': {
    one: '{count} section · rename or delete',
    other: '{count} sections · rename or delete',
  },
  'settings.currentHome': 'Current home',
  'settings.manyHomes': 'You have several homes',
  'settings.groupMembers': 'Members',
  'settings.you': '(you)',
  'settings.removeMemberAria': 'Remove member: {name}',
  'settings.groupAccount': 'Account',
  'settings.googleMeta': 'Everything you have now will be saved to the account',
  'settings.googleAccount': 'Google account',
  'settings.setName': 'Set your name',
  'settings.nameMeta': 'Your name — members of the home see it',
  'settings.joinMeta': 'Paste an invitation to another home',
  'settings.signOut': 'Sign out',
  'settings.anonGoogle':
    'Access to the home is kept only on this device, and the browser and the Home Screen app count as different members. Sign in with Google to be the same person with the same data everywhere.',
  'settings.anonNoGoogle':
    'Access to the home is kept on this device. If you clear the browser data or change phones, you can come back with a new link from another member.',
  'settings.accountText':
    'Sign in to the same Google account in the browser or in the Home Screen app — you’ll find the same homes and items there.',
  'settings.groupApp': 'App',
  'settings.language': 'Language',
  'settings.languageAuto': 'Same as device',
  'settings.theme': 'Theme',
  'settings.themeAuto': 'Same as device',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.accent': 'Accent colour',

  'accent.green': 'Green',
  'accent.teal': 'Teal',
  'accent.blue': 'Blue',
  'accent.violet': 'Violet',
  'accent.rose': 'Rose',
  'accent.graphite': 'Graphite',

  'settings.homeMeta': 'Home name and avatar',

  'homeSheet.title': 'Home',
  'homeSheet.iconHint': 'home avatar',

  'settings.groupData': 'Data',
  'settings.reset': 'Reset demo data',
  'settings.resetMeta': 'Bring back the sample sections and items',

  'role.owner': 'Owner',
  'role.member': 'Member',

  'device.app': 'App',
  'device.browser': 'Browser',
  'device.unknown': 'device',

  'auth.google': 'Sign in with Google',

  'welcome.invited': 'You’ve been invited to a shared home. Choose how to sign in.',
  'welcome.googleNote':
    'Your data is saved to the account: it survives a change of phone and is the same in the browser and in the Home Screen app.',
  'welcome.anon': 'Continue without an account',
  'welcome.later': 'You can sign in later, in Settings.',

  'start.errorTitle': 'Couldn’t get started',

  'load.reloadError': 'Couldn’t load the data. Check your connection and reload the page.',

  'create.failedTitle': 'Couldn’t create the home',

  'invite.title': 'Invitation link',
  'invite.rowMeta': 'Not used yet · until {date}',
  'invite.revokeAria': 'Revoke the link valid until {date}',
  'invite.create': 'Invite with a link',
  'invite.createMeta': 'One-time link, valid for 7 days',
  'invite.sheetText':
    'Send it to the person you’re inviting. The link works once and is valid for 7 days. It’s shown only now — later it can only be revoked.',
  'invite.link': 'Link',
  'invite.pwaNote':
    'If the person already has the app on their Home Screen, the link has to be pasted there: Settings → “Join with a link”.',
  'invite.share': 'Share',
  'invite.copy': 'Copy',
  'invite.shareTitle': 'Invitation to Home Stock',

  'join.title': 'Join with a link',
  'join.description': 'Paste the invitation link you were sent.',
  'join.submit': 'Join',
  'join.invalid': 'The invitation is invalid, expired or already used.',
  'join.notLink': 'This doesn’t look like an invitation link. Paste the whole link.',
  'join.working': 'Joining the home…',
  'join.failedTitle': 'The link didn’t work',
  'join.failedText': 'The invitation is invalid, expired or already used. Ask for a new link.',

  'name.title': 'Your name',
  'name.description': 'This is how other members of the home will see you.',
  'name.label': 'Name',

  'renameHome.label': 'What is the home called',

  'confirm.removeMemberTitle': 'Remove this member?',
  'confirm.removeMemberText':
    '{name} will lose access to “{home}”. You can bring them back with a new link.',
  'confirm.signOutTitle': 'Sign out?',
  'confirm.signOutText':
    'Your homes and items stay in the account. Sign in with Google again to get back to them.',
  'confirm.signOut': 'Sign out',
  'confirm.resetTitle': 'Reset demo data?',
  'confirm.resetText':
    'All sections, items and shopping in this browser will be replaced with the sample.',
  'confirm.reset': 'Reset',

  'merge.working': 'Moving your data to the account…',
  'merge.done': 'This device’s data is now in your account',
  'merge.failedTitle': 'Couldn’t move the data',
  'merge.failedText':
    'You’re signed in, but what was on this device without an account couldn’t be moved.',
  'merge.choiceTitle': 'Which home do you keep?',
  'merge.choiceLead':
    'This device and the account {email} have different homes. You can keep one; the other will be gone.',
  'merge.fromDevice': 'From this device',
  'merge.fromAccount': 'From the Google account',
  'merge.keep': 'Keep this one',
  'merge.confirm': 'Keep {homes}?',
  'merge.fateLeave': '{homes} — you will leave it.',
  'merge.fateDelete': '{homes} — will be deleted for good.',

  'demo.fridge': 'Fridge',
  'demo.cupboard': 'Cupboard',
  'demo.treats': 'Treats',
  'demo.milk': 'Milk',
  'demo.eggs': 'Eggs',
  'demo.cheese': 'Cheese',
  'demo.strawberry': 'Strawberries',
  'demo.coffee': 'Coffee',
  'demo.rice': 'Rice',
  'demo.chocolate': 'Chocolate',
  'demo.coffeeBeans': 'Coffee beans',
  'demo.bread': 'Bread',
}
