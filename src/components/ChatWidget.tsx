import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/types'

interface Props {
  requestId: string
  myRole: 'passenger' | 'driver'
  onClose: () => void
}

export function ChatWidget({ requestId, myRole, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Load history ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data as ChatMessage[]) })

    // ── Subscribe to live messages ──────────────────────────────────────────
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    const text = draft.trim()
    setDraft('')
    await supabase.from('chat_messages').insert({
      request_id: requestId,
      sender_role: myRole,
      content: text,
    })
    setSending(false)
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(isRTL ? 'ar-JO' : 'en-JO', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md mx-auto bg-taxi-black-soft rounded-t-3xl border-t border-x border-taxi-yellow/20 flex flex-col"
           style={{ maxHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-taxi-yellow/10">
          <div className="flex items-center gap-2">
            <span className="text-taxi-green text-sm">●</span>
            <span className="font-arabic text-taxi-yellow font-semibold">{t('chat')}</span>
            <span className="font-body text-taxi-gray-light text-xs">
              ({isRTL
                ? myRole === 'passenger' ? 'مع السائق' : 'مع الراكب'
                : myRole === 'passenger' ? 'with driver' : 'with passenger'})
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-taxi-black-mid flex items-center justify-center text-taxi-gray-light hover:text-taxi-white-pure transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8 text-taxi-gray-light font-body text-sm">
              {isRTL ? 'ابدأ المحادثة...' : 'Start the conversation...'}
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_role === myRole
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                    isMine
                      ? 'bg-taxi-yellow text-taxi-black rounded-br-sm'
                      : 'bg-taxi-black-mid text-taxi-white-pure rounded-bl-sm border border-taxi-yellow/10'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className={`text-xs mt-1 opacity-60 ${isMine ? 'text-taxi-black' : 'text-taxi-gray-light'}`}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-taxi-yellow/10 flex gap-3 items-center">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('type_message')}
            className="flex-1 bg-taxi-black-mid border border-taxi-yellow/20 rounded-2xl px-4 py-3 text-taxi-white-pure font-body text-sm focus:outline-none focus:border-taxi-yellow placeholder-taxi-gray-light transition-colors"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-taxi-yellow flex items-center justify-center text-taxi-black disabled:opacity-40 hover:bg-taxi-yellow-glow active:scale-95 transition-all flex-shrink-0"
          >
            <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
