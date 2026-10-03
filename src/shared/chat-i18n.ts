import { useTranslation } from './i18n';
const ru = {
  title: 'Что сегодня приготовим?',
  subtitle: 'Ваш AI-повар уже знает, что есть в холодильнике.',
  welcome: 'Давайте приготовим что-нибудь вкусное',
  intro:
    'Предложу блюдо из ваших продуктов, помогу с заменами или объясню шаги приготовления.',
  prompts: [
    'Что приготовить без покупок?',
    'Предложи ужин за 30 минут',
    'Используй продукты, у которых скоро истекает срок',
    'Придумай быстрый завтрак',
  ],
  placeholder: 'Например: что можно приготовить из моих продуктов?',
  send: 'Отправить',
  stop: 'Остановить',
  clear: 'Новый диалог',
  thinking: 'Повар обдумывает ваш вопрос…',
  you: 'Вы',
  assistant: 'AI-повар',
  context: 'Сейчас в холодильнике',
  empty:
    'Холодильник пуст. Можно попросить общую идею блюда — повар укажет, что нужно купить.',
  privacy:
    'Сообщения и актуальные продукты отправляются в Google Gemini. История хранится только до перезагрузки вкладки.',
  note: 'AI может ошибаться. Проверяйте ингредиенты, время и готовность блюда.',
  pantry:
    'Вода и соль доступны всегда. Остальное — только из холодильника или с пометкой о покупке.',
  excluded: 'Просроченных исключено:',
  limit: 'До 2 000 символов. В контекст входят последние сообщения диалога.',
};
const en: Record<keyof typeof ru, string | string[]> = {
  title: 'What shall we cook today?',
  subtitle: 'Your AI Chef already knows what is in your fridge.',
  welcome: 'Let’s make something delicious',
  intro:
    'Find a meal using your ingredients, explore substitutions, or ask for cooking instructions.',
  prompts: [
    'What can I cook without shopping?',
    'Suggest a dinner in 30 minutes',
    'Use ingredients that expire soon',
    'Suggest a quick breakfast',
  ],
  placeholder: 'For example: what can I make with my ingredients?',
  send: 'Send',
  stop: 'Stop',
  clear: 'New conversation',
  thinking: 'Your chef is thinking…',
  you: 'You',
  assistant: 'AI Chef',
  context: 'In your fridge now',
  empty:
    'Your fridge is empty. Ask for a meal idea and the chef will list what you need to buy.',
  privacy:
    'Messages and current ingredients are sent to Google Gemini. History lasts until this tab is reloaded.',
  note: 'AI can make mistakes. Check ingredients, timing, and doneness.',
  pantry:
    'Water and salt are always available. Everything else comes from your fridge or is marked as missing.',
  excluded: 'Expired products excluded:',
  limit:
    'Up to 2,000 characters. Recent conversation messages are included for context.',
};
const errors: Record<string, [string, string]> = {
  NOT_CONFIGURED: [
    'AI-повар ещё не настроен на сервере.',
    'The AI Chef is not configured on the server yet.',
  ],
  PROVIDER_ACCESS: [
    'Gemini отклонил запрос. Проверьте ключ и доступность API для вашего проекта и региона.',
    'Gemini rejected the request. Check the API key and availability for your project and region.',
  ],
  MODEL_UNAVAILABLE: [
    'Выбранная модель Gemini недоступна. Проверьте GEMINI_MODEL на сервере.',
    'The selected Gemini model is unavailable. Check GEMINI_MODEL on the server.',
  ],
  QUOTA_EXCEEDED: [
    'Достигнут лимит Gemini. Попробуйте позже или проверьте квоту в Google AI Studio.',
    'Gemini quota exceeded. Try later or check your quota in Google AI Studio.',
  ],
  RATE_LIMITED: [
    'Слишком много запросов. Подождите минуту.',
    'Too many requests. Please wait a minute.',
  ],
  BLOCKED: [
    'Gemini не смог ответить на этот запрос. Попробуйте переформулировать вопрос.',
    'Gemini could not answer this request. Try rephrasing it.',
  ],
  TIMEOUT: [
    'Ответ занял слишком много времени. Текст вопроса сохранён — можно отправить ещё раз.',
    'The response took too long. Your question is preserved; you can send it again.',
  ],
  CANCELLED: [
    'Запрос отменён. Текст вопроса сохранён.',
    'Request cancelled. Your question is preserved.',
  ],
  INVALID_REQUEST: [
    'Проверьте длину сообщения (до 2 000 символов) и количество продуктов (до 100).',
    'Check message length (up to 2,000 characters) and inventory size (up to 100 products).',
  ],
  INCOMPLETE_RESPONSE: [
    'Ответ оказался слишком длинным. Попросите один короткий рецепт.',
    'The response was too long. Ask for one short recipe.',
  ],
};
export function useChatTranslation() {
  const { language } = useTranslation();
  return {
    c: (language === 'ru' ? ru : en) as typeof ru,
    errorText: (code: string) =>
      errors[code]?.[language === 'ru' ? 0 : 1] ??
      (language === 'ru'
        ? 'Не удалось получить ответ. Попробуйте снова.'
        : 'Could not get a response. Please try again.'),
  };
}
