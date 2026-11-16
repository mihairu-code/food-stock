import { notifyManager, QueryClient } from '@tanstack/react-query'

// По умолчанию кэш сообщает экранам об изменениях через таймер — то есть не раньше следующей
// задачи, а когда телефон занят касанием или прокруткой, и позже. Микрозадача выполняется
// сразу: правка попадает на экран в ближайшем кадре, без видимой паузы после нажатия.
notifyManager.setScheduler(queueMicrotask)

/** Один кэш запросов на приложение: им пользуются и хуки, и код вне компонентов. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1 },
  },
})
