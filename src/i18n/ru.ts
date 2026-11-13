/** Формы числа по правилам языка (Intl.PluralRules); `other` обязательна. */
export interface Plural {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

/**
 * Русский словарь — образец: по его ключам проверяются остальные языки.
 * `{имя}` — подстановка, `<b>…</b>` — выделение (см. rich.tsx).
 */
export const ru = {
  'app.name': 'Домашние запасы',
  'app.shortName': 'Запасы',
  'app.tagline': 'Общий список продуктов дома и покупок',

  'common.add': 'Добавить',
  'common.cancel': 'Отмена',
  'common.save': 'Сохранить',
  'common.create': 'Создать',
  'common.delete': 'Удалить',
  'common.done': 'Готово',
  'common.ok': 'Понятно',
  'common.continue': 'Продолжить',
  'common.retry': 'Повторить',
  'common.loading': 'Загрузка…',
  'common.loadError': 'Не удалось загрузить данные. Проверьте соединение.',
  'common.saveError': 'Не удалось сохранить изменение',
  'common.actionError': 'Не удалось выполнить действие',
  'common.checkConnection': 'Проверьте соединение с интернетом и попробуйте ещё раз.',

  quote: '«{name}»',

  'n.products': {
    one: '{count} продукт',
    few: '{count} продукта',
    many: '{count} продуктов',
    other: '{count} продукта',
  },
  'n.sections': {
    one: '{count} раздел',
    few: '{count} раздела',
    many: '{count} разделов',
    other: '{count} раздела',
  },
  'n.members': {
    one: '{count} участник',
    few: '{count} участника',
    many: '{count} участников',
    other: '{count} участника',
  },

  'nav.label': 'Основная навигация',
  'nav.home': 'Дом',
  'nav.shopping': 'Покупки',
  'nav.settings': 'Настройки',
  'nav.shoppingCount': 'Покупки, позиций: {count}',

  'title.home': 'Дома',

  'header.settingsLink': 'Участники и настройки',

  'home.loading': 'Загружаем продукты…',
  'home.emptyTitle': 'Начните с раздела',
  'home.emptyText': 'Разделы — это места, где лежат продукты: «Холодильник», «Шкаф», «Вкусняшки».',
  'home.createSection': 'Создать раздел',
  'home.summary': {
    one: '<b>{count}</b> продукт дома',
    few: '<b>{count}</b> продукта дома',
    many: '<b>{count}</b> продуктов дома',
    other: '<b>{count}</b> продукта дома',
  },
  'home.sectionCount': 'Продуктов: {count}',
  'home.editSection': 'Изменить раздел «{name}»',
  'home.addProductTo': 'Добавить продукт в «{name}»',
  'home.defaultName': 'Наш дом',
  'home.preparing': 'Готовим ваш дом…',

  'product.staple': 'Постоянный продукт',
  'product.oneOff': 'Разово',
  'product.out': 'Закончилось',
  'product.inList': 'В покупках',
  'product.outInList': 'Закончилось · в покупках',
  'product.markOut': '{name}: есть дома. Отметить, что закончилось',
  'product.markIn': '{name}: закончилось. Отметить, что есть дома',
  'product.addToList': 'Добавить «{name}» в покупки',
  'product.removeFromList': 'Убрать «{name}» из покупок',
  'product.delete': 'Удалить «{name}»',
  'product.keep': 'Держать дома постоянно',
  'product.keepHint': 'Когда закончится, продукт сам попадёт в покупки',

  'productSheet.title': 'Добавить продукт',
  'productSheet.description': 'Внесите то, что есть дома',
  'productSheet.name': 'Название продукта',
  'productSheet.placeholder': 'Например, йогурт',

  'field.section': 'Раздел дома',

  'emoji.label': 'Иконка — необязательно',
  'emoji.hint': 'подбирается по названию',

  'section.title': 'Раздел',
  'section.newTitle': 'Новый раздел',
  'section.newDescription': 'Например, «Холодильник», «Шкаф» или «Вкусняшки»',
  'section.name': 'Название раздела',
  'section.delete': 'Удалить раздел',
  'section.deleteTitle': 'Удалить «{name}»?',
  'section.deleteText': {
    one: 'Вместе с разделом навсегда удалится <b>{count} продукт</b>.',
    few: 'Вместе с разделом навсегда удалятся <b>{count} продукта</b>.',
    many: 'Вместе с разделом навсегда удалятся <b>{count} продуктов</b>.',
    other: 'Вместе с разделом навсегда удалятся <b>{count} продукта</b>.',
  },
  'section.deleteInList': {
    one: 'Из них {count} исчезнет из списка покупок.',
    few: 'Из них {count} исчезнут из списка покупок.',
    many: 'Из них {count} исчезнут из списка покупок.',
    other: 'Из них {count} исчезнут из списка покупок.',
  },
  'section.deleteNoUndo': 'Отменить удаление нельзя.',

  'shopping.loading': 'Загружаем список…',
  'shopping.nothing': 'Покупать нечего',
  'shopping.summary': {
    one: '<b>{count}</b> позиция к покупке',
    few: '<b>{count}</b> позиции к покупке',
    many: '<b>{count}</b> позиций к покупке',
    other: '<b>{count}</b> позиции к покупке',
  },
  'shopping.emptyTitle': 'Список пуст',
  'shopping.emptyText':
    'Нажмите «+» у продукта на вкладке «Дом» или добавьте позицию здесь. Постоянные продукты попадают сюда сами, когда заканчиваются.',
  'shopping.bought': 'Куплено',
  'shopping.boughtAria': 'Куплено: {name}',
  'shopping.remove': 'Убрать',
  'shopping.manual': 'Добавлено вручную',
  'shopping.out': 'закончилось',
  'shopping.stillHome': 'ещё есть дома',
  'shopping.addTitle': 'Добавить в покупки',
  'shopping.addDescription': 'Раздел выберете потом, когда купите',
  'shopping.whatToBuy': 'Что купить',
  'shopping.placeholder': 'Например, хлеб',

  'purchase.title': 'Куда добавить продукт?',
  'purchase.description': '«{name}» — куплено',
  'purchase.submit': 'Добавить домой',
  'purchase.needSectionTitle': 'Сначала нужен раздел',
  'purchase.needSectionText':
    'Чтобы положить покупку домой, создайте хотя бы один раздел на вкладке «Дом».',

  'toast.backHome': '«{name}» — снова дома',
  'toast.outToList': '«{name}» закончилось — добавлено в покупки',
  'toast.out': '«{name}» — закончилось',
  'toast.addedToList': '«{name}» — в списке покупок',
  'toast.removedFromList': '«{name}» убрано из покупок',
  'toast.deleted': 'Удалено: «{name}»',
  'toast.movedTo': '«{name}» теперь в «{section}»',

  'dnd.instructions':
    'Чтобы переставить, нажмите пробел, двигайте стрелками и нажмите пробел ещё раз. Escape — отмена.',
  'dnd.product': 'продукт, можно переставить',
  'dnd.section': 'раздел, можно переставить',
  'dnd.picked': 'Взято: «{name}»',
  'dnd.over': '«{name}» рядом с «{target}»',
  'dnd.dropped': '«{name}» на новом месте',
  'dnd.cancelled': 'Перестановка отменена: «{name}»',

  'toast.addedTo': 'Добавлено в «{name}»',
  'toast.addedItem': 'Добавлено в список покупок',
  'toast.purchasedStaple': 'Добавлено в «{name}» как постоянный продукт',
  'toast.purchasedOnce': 'Добавлено в «{name}» один раз',
  'toast.sectionCreated': 'Раздел «{name}» создан',
  'toast.sectionDeleted': 'Раздел «{name}» удалён',
  'toast.linkError': 'Не удалось создать ссылку',
  'toast.linkRevoked': 'Ссылка отозвана',
  'toast.memberRemoved': 'Участник удалён из дома',
  'toast.googleError': 'Не удалось открыть вход через Google',
  'toast.googleFailed': 'Вход через Google не выполнен',
  'toast.demoRestored': 'Демо-данные восстановлены',
  'toast.joined': 'Вы присоединились к дому',
  'toast.copied': 'Ссылка скопирована',
  'toast.copyError': 'Не удалось скопировать — выделите ссылку вручную',
  'toast.nameError': 'Не удалось сохранить имя',

  'settings.demoText':
    'Данные хранятся только в этом браузере. Общий доступ и синхронизация между устройствами включаются после подключения Supabase — шаги описаны в README.',
  'settings.groupMembers': 'Участники',
  'settings.you': '(вы)',
  'settings.removeMemberAria': 'Удалить участника: {name}',
  'settings.groupAccount': 'Аккаунт',
  'settings.googleMeta': 'Всё, что есть сейчас, сохранится в аккаунте',
  'settings.googleAccount': 'Аккаунт Google',
  'settings.setName': 'Указать имя',
  'settings.nameMeta': 'Ваше имя — его видят участники дома',
  'settings.joinMeta': 'Вставьте приглашение в другой дом',
  'settings.signOut': 'Выйти из аккаунта',
  'settings.anonGoogle':
    'Доступ к дому хранится только на этом устройстве, а браузер и приложение на экране «Домой» считаются разными участниками. Войдите через Google — и везде будете одним человеком с одними данными.',
  'settings.anonNoGoogle':
    'Доступ к дому хранится на этом устройстве. Если очистить данные браузера или сменить телефон, вернуться можно по новой ссылке от другого участника.',
  'settings.accountText':
    'Войдите в этот же аккаунт Google в браузере или в приложении на экране «Домой» — там будут те же дома и продукты.',
  'settings.groupApp': 'Приложение',
  'settings.language': 'Язык',
  'settings.languageAuto': 'Как на устройстве',
  'settings.theme': 'Тема',
  'settings.themeAuto': 'Как на устройстве',
  'settings.themeLight': 'Светлая',
  'settings.themeDark': 'Тёмная',
  'settings.groupData': 'Данные',
  'settings.reset': 'Сбросить демо-данные',
  'settings.resetMeta': 'Вернуть исходный пример разделов и продуктов',

  'role.owner': 'Владелец',
  'role.member': 'Участник',

  'device.app': 'Приложение',
  'device.browser': 'Браузер',
  'device.unknown': 'устройство',

  'auth.google': 'Войти через Google',

  'welcome.invited': 'Вас пригласили в общий дом. Выберите, как войти.',
  'welcome.googleNote':
    'Данные сохранятся в аккаунте: не пропадут при смене телефона и будут одними и теми же в браузере и в приложении на экране «Домой».',
  'welcome.anon': 'Продолжить без аккаунта',
  'welcome.later': 'Войти можно и позже — в настройках.',

  'start.errorTitle': 'Не удалось начать работу',

  'load.reloadError': 'Не удалось загрузить данные. Проверьте соединение и обновите страницу.',

  'create.failedTitle': 'Не удалось создать дом',

  'invite.title': 'Ссылка-приглашение',
  'invite.rowMeta': 'Ещё не использована · до {date}',
  'invite.revokeAria': 'Отозвать ссылку, действующую до {date}',
  'invite.create': 'Пригласить по ссылке',
  'invite.createMeta': 'Одноразовая ссылка, действует 7 дней',
  'invite.sheetText':
    'Отправьте её тому, кого приглашаете. Ссылка сработает один раз и действует 7 дней. Показывается она только сейчас — потом её можно лишь отозвать.',
  'invite.link': 'Ссылка',
  'invite.pwaNote':
    'Если приложение у человека уже на экране «Домой», ссылку нужно вставить в нём: Настройки → «Присоединиться по ссылке».',
  'invite.share': 'Поделиться',
  'invite.copy': 'Скопировать',
  'invite.shareTitle': 'Приглашение в «Домашние запасы»',

  'join.title': 'Присоединиться по ссылке',
  'join.description': 'Вставьте ссылку-приглашение, которую вам прислали.',
  'join.submit': 'Присоединиться',
  'join.invalid': 'Приглашение недействительно, истекло или уже использовано.',
  'join.notLink': 'Это не похоже на ссылку-приглашение. Вставьте её целиком.',
  'join.working': 'Присоединяемся к дому…',
  'join.failedTitle': 'Ссылка не сработала',
  'join.failedText':
    'Приглашение недействительно, истекло или уже использовано. Попросите прислать новую ссылку.',

  'name.title': 'Ваше имя',
  'name.description': 'Так вас увидят другие участники дома.',
  'name.label': 'Имя',

  'confirm.removeMemberTitle': 'Удалить участника?',
  'confirm.removeMemberText':
    '{name} потеряет доступ к дому «{home}». Вернуть его можно будет новой ссылкой.',
  'confirm.signOutTitle': 'Выйти из аккаунта?',
  'confirm.signOutText':
    'Дома и продукты останутся в аккаунте. Чтобы вернуться к ним, снова войдите через Google.',
  'confirm.signOut': 'Выйти',
  'confirm.resetTitle': 'Сбросить демо-данные?',
  'confirm.resetText': 'Все разделы, продукты и покупки в этом браузере заменятся исходным примером.',
  'confirm.reset': 'Сбросить',

  'merge.working': 'Переносим данные в аккаунт…',
  'merge.done': 'Данные этого устройства теперь в аккаунте',
  'merge.failedTitle': 'Не удалось перенести данные',
  'merge.failedText':
    'Вы вошли в аккаунт, но то, что было на этом устройстве без аккаунта, перенести не получилось.',
  'merge.choiceTitle': 'Какой дом оставить?',
  'merge.choiceLead':
    'На этом устройстве и в аккаунте {email} — разные дома. Оставить можно один, второй пропадёт.',
  'merge.fromDevice': 'С этого устройства',
  'merge.fromAccount': 'Из аккаунта Google',
  'merge.keep': 'Оставить этот',
  'merge.confirm': 'Оставить {homes}?',
  'merge.fateLeave': '{homes} — вы из него выйдете.',
  'merge.fateDelete': '{homes} — будет удалён навсегда.',

  'demo.fridge': 'Холодильник',
  'demo.cupboard': 'Шкаф',
  'demo.treats': 'Вкусняшки',
  'demo.milk': 'Молоко',
  'demo.eggs': 'Яйца',
  'demo.cheese': 'Сыр',
  'demo.strawberry': 'Клубника',
  'demo.coffee': 'Кофе',
  'demo.rice': 'Рис',
  'demo.chocolate': 'Шоколад',
  'demo.coffeeBeans': 'Кофе в зёрнах',
  'demo.bread': 'Хлеб',
}

export type Messages = {
  [K in keyof typeof ru]: (typeof ru)[K] extends string ? string : Plural
}
