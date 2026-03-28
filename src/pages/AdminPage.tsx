import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { Taxi } from '@/types'
import toast from 'react-hot-toast'

interface AdminStats {
  total_rides: number
  active_drivers: number
  pending_verifications: number
  total_drivers: number
}

// ── Style helpers (functions kept separate, not in S object) ──────────────────
function trackStyle(on: boolean): React.CSSProperties {
  return { position: 'absolute', inset: 0, background: on ? '#1dcd9f' : 'rgba(255,255,255,0.1)', borderRadius: 100, cursor: 'pointer', transition: '0.3s' }
}
function thumbStyle(on: boolean): React.CSSProperties {
  return { position: 'absolute', width: 20, height: 20, left: on ? 23 : 3, bottom: 3, background: '#fff', borderRadius: '50%', transition: '0.3s' }
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#08080f', color: '#f0f0f5', fontFamily: "'Cairo', sans-serif", overflowX: 'hidden' },
  adminHead: { background: 'linear-gradient(180deg,#111120 0%,#08080f 100%)', padding: '20px 20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  adminLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 36, height: 36, background: '#f5c518', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 16 },
  kpiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  kpi: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 },
  section: { padding: '20px 20px 0' },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#6b6b80', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  sectionBar: { display: 'block', width: 3, height: 14, background: '#f5c518', borderRadius: 2, flexShrink: 0 },
  adminCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, marginBottom: 12 },
  broadcastCard: { background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 20, padding: 18, marginBottom: 16 },
  textarea: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', color: '#f0f0f5', fontFamily: "'Cairo',sans-serif", fontSize: 14, outline: 'none', resize: 'none' as const, minHeight: 72 },
  targetPill: { flex: 1, padding: 8, textAlign: 'center' as const, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#6b6b80', fontFamily: "'Cairo',sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  targetPillSel: { flex: 1, padding: 8, textAlign: 'center' as const, borderRadius: 10, border: '1px solid rgba(255,71,87,0.4)', background: 'rgba(255,71,87,0.15)', color: '#ff4757', fontFamily: "'Cairo',sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnBroadcast: { width: '100%', background: '#ff4757', border: 'none', color: '#fff', borderRadius: 12, padding: 13, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  driverReq: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f5c518,#c9a012)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#000', flexShrink: 0 },
  reqBtn: { width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 },
  sysRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  btnSm: { background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757', borderRadius: 8, padding: '6px 12px', fontFamily: "'Cairo',sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  btnVerify: { padding: '4px 12px', borderRadius: 100, background: '#f5c518', border: 'none', color: '#000', fontSize: 11, fontFamily: "'Cairo',sans-serif", fontWeight: 700, cursor: 'pointer' },
  btnSuspend: { padding: '4px 12px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', fontSize: 11, fontFamily: "'Cairo',sans-serif", cursor: 'pointer' },
  btnForce: { padding: '4px 12px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(245,197,24,0.3)', color: '#f5c518', fontSize: 11, fontFamily: "'Cairo',sans-serif", cursor: 'pointer' },
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ position: 'relative', width: 46, height: 26, cursor: 'pointer', flexShrink: 0 }} onClick={() => onChange(!on)}>
      <div style={trackStyle(on)} />
      <div style={thumbStyle(on)} />
    </div>
  )
}

function AdSlotToggle({ label }: { label: string }) {
  const [on, setOn] = useState(true)
  return (
    <div style={S.sysRow}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <Toggle on={on} onChange={setOn} />
    </div>
  )
}

function showToast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  Object.assign(el.style, { position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: '#1dcd9f', color: '#000', padding: '10px 20px', borderRadius: '100px', fontFamily: 'Cairo', fontWeight: '700', fontSize: '13px', zIndex: '999', boxShadow: '0 4px 20px rgba(29,205,159,0.4)', opacity: '1', whiteSpace: 'nowrap' })
  document.body.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400) }, 2500)
}

export function AdminPage() {
  const { t } = useTranslation()
  const { language } = useAppStore()
  const isRTL = language === 'ar'

  const [taxis, setTaxis] = useState<Taxi[]>([])
  const [stats, setStats] = useState<AdminStats>({ total_rides: 0, active_drivers: 0, pending_verifications: 0, total_drivers: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'drivers' | 'requests'>('drivers')
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'driver' | 'passenger'>('all')
  const [systemOn, setSystemOn] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [driverRequests, setDriverRequests] = useState([
    { id: '1', name: isRTL ? 'سامي العجلوني' : 'Sami Al-Ajlouni', info: isRTL ? 'كيا سيراتو · 98765 ب · منذ 5 دقائق' : 'Kia Cerato · 98765B · 5 min ago', initial: 'س' },
    { id: '2', name: isRTL ? 'محمد بني هاني' : 'Mohammad Bani Hani', info: isRTL ? 'هيونداي إيلنترا · 54321 ج · منذ 18 دقيقة' : 'Hyundai Elantra · 54321C · 18 min ago', initial: 'م' },
  ])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [taxiRes, statsRes] = await Promise.all([
        supabase.from('taxis').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_admin_stats'),
      ])
      if (taxiRes.data) setTaxis(taxiRes.data)
      if (statsRes.data) setStats(statsRes.data)
    } catch { toast.error(t('generic_error')) }
    finally { setLoading(false) }
  }

  const verifyDriver = async (id: string, verified: boolean) => {
    await supabase.from('taxis').update({ verified }).eq('id', id)
    setTaxis((prev) => prev.map((tx) => (tx.id === id ? { ...tx, verified } : tx)))
    showToast(verified ? (isRTL ? '✅ تم التوثيق' : '✅ Verified') : (isRTL ? 'تم إلغاء التوثيق' : 'Verification removed'))
  }

  const toggleOnline = async (id: string, current: boolean) => {
    await supabase.from('taxis').update({ is_online: !current }).eq('id', id)
    setTaxis((prev) => prev.map((tx) => (tx.id === id ? { ...tx, is_online: !current } : tx)))
  }

  const sendBroadcast = () => {
    if (!broadcastMsg.trim()) return
    setBroadcastMsg('')
    const labels = { all: isRTL ? 'الجميع' : 'Everyone', driver: isRTL ? 'السائقين' : 'Drivers', passenger: isRTL ? 'الركاب' : 'Passengers' }
    showToast(`✅ ${isRTL ? 'أُرسل إلى' : 'Sent to'} ${labels[broadcastTarget]}`)
  }

  const kpis = [
    { icon: '🛣️', color: '#f5c518', val: stats.total_rides, label: isRTL ? 'إجمالي الرحلات' : 'Total Rides', change: '↑ 12%' },
    { icon: '💰', color: '#1dcd9f', val: '850 JD', label: isRTL ? 'الأرباح (اليوم)' : "Today's Revenue", change: '↑ 5%' },
    { icon: '🚗', color: '#6699ff', val: stats.active_drivers, label: isRTL ? 'سائقون نشطون' : 'Active Drivers', change: `${isRTL ? 'من أصل' : 'of'} ${stats.total_drivers}` },
    { icon: '👥', color: '#b06aff', val: 134, label: isRTL ? 'ركاب اليوم' : "Today's Passengers", change: '↑ 8%' },
  ]

  return (
    <div style={S.root} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div style={S.adminHead}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={S.adminLogo}>
            <div style={S.logoMark}>🚖</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{isRTL ? 'يلو وانت' : 'YellowWant'}</div>
              <div style={{ fontSize: 11, color: '#6b6b80', marginTop: -2 }}>{isRTL ? 'لوحة التحكم' : 'Admin Dashboard'}</div>
            </div>
          </div>
          <button style={S.btnSm} onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>
            ⏻ {isRTL ? 'خروج' : 'Logout'}
          </button>
        </div>

        {/* KPI Grid */}
        <div style={S.kpiGrid}>
          {kpis.map((k) => (
            <div key={k.label} style={S.kpi}>
              <div style={{ fontSize: 11, color: '#6b6b80', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{k.icon}</span>{k.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 10, color: '#1dcd9f', marginTop: 2 }}>{k.change}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingBottom: 40 }}>

        {/* System Toggles */}
        <div style={S.section}>
          <div style={S.sectionTitle}><span style={S.sectionBar} />{isRTL ? 'النظام' : 'System'}</div>
          <div style={S.adminCard}>
            <div style={S.sysRow}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{isRTL ? 'تفعيل استقبال الطلبات' : 'Enable Request Intake'}</div>
                <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 3 }}>{isRTL ? 'تشغيل أو تعليق المنصة بالكامل' : 'Start or suspend the entire platform'}</div>
              </div>
              <Toggle on={systemOn} onChange={setSystemOn} />
            </div>
          </div>
          <div style={{ ...S.adminCard, marginBottom: 0 }}>
            <div style={S.sysRow}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{isRTL ? 'وضع الصيانة' : 'Maintenance Mode'}</div>
                <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 3 }}>{isRTL ? 'إظهار رسالة صيانة للمستخدمين' : 'Show maintenance message to users'}</div>
              </div>
              <Toggle on={maintenance} onChange={setMaintenance} />
            </div>
          </div>
        </div>

        {/* Broadcast */}
        <div style={{ ...S.section, paddingTop: 20 }}>
          <div style={S.sectionTitle}><span style={S.sectionBar} />{isRTL ? 'الإشعارات' : 'Broadcast'}</div>
          <div style={S.broadcastCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ff4757', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              📢 {isRTL ? 'بث تنبيه عام' : 'Send Broadcast Alert'}
            </div>
            <textarea
              style={S.textarea}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder={isRTL ? 'اكتب رسالة التنبيه هنا...' : 'Write your alert message here...'}
            />
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              {(['all', 'driver', 'passenger'] as const).map((tgt) => (
                <button key={tgt} style={broadcastTarget === tgt ? S.targetPillSel : S.targetPill} onClick={() => setBroadcastTarget(tgt)}>
                  {tgt === 'all' ? (isRTL ? 'الجميع' : 'All') : tgt === 'driver' ? (isRTL ? 'السائقون' : 'Drivers') : (isRTL ? 'الركاب' : 'Passengers')}
                </button>
              ))}
            </div>
            <button style={S.btnBroadcast} onClick={sendBroadcast}>
              📨 {isRTL ? 'إرسال الآن' : 'Send Now'}
            </button>
          </div>
        </div>

        {/* Driver Join Requests */}
        <div style={{ ...S.section, paddingTop: 4 }}>
          <div style={S.sectionTitle}><span style={S.sectionBar} />{isRTL ? 'طلبات الانضمام' : 'Join Requests'}</div>
          {driverRequests.map((req) => (
            <div key={req.id} style={S.adminCard}>
              <div style={S.driverReq}>
                <div style={S.avatar}>{req.initial}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{req.name}</div>
                  <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 2 }}>{req.info}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ ...S.reqBtn, background: 'rgba(255,71,87,0.12)', color: '#ff4757' }}
                    onClick={() => setDriverRequests(prev => prev.filter(r => r.id !== req.id))}
                  >✕</button>
                  <button
                    style={{ ...S.reqBtn, background: 'rgba(29,205,159,0.15)', color: '#1dcd9f' }}
                    onClick={() => { showToast(isRTL ? '✅ تمت الموافقة' : '✅ Approved'); setDriverRequests(prev => prev.filter(r => r.id !== req.id)) }}
                  >✓</button>
                </div>
              </div>
            </div>
          ))}
          {driverRequests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b6b80', fontSize: 13 }}>
              {isRTL ? 'لا توجد طلبات انضمام' : 'No pending join requests'}
            </div>
          )}
        </div>

        {/* Driver Management */}
        <div style={{ ...S.section, paddingTop: 20 }}>
          <div style={S.sectionTitle}><span style={S.sectionBar} />{isRTL ? 'إدارة السائقين' : 'Driver Management'}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['drivers', 'requests'] as const).map((tKey) => (
              <button key={tKey} onClick={() => setTab(tKey)} style={{ padding: '6px 16px', borderRadius: 100, fontFamily: "'Cairo',sans-serif", fontSize: 13, cursor: 'pointer', border: 'none', background: tab === tKey ? '#f5c518' : 'rgba(255,255,255,0.05)', color: tab === tKey ? '#000' : '#6b6b80', fontWeight: tab === tKey ? 700 : 400 }}>
                {tKey === 'drivers' ? (isRTL ? 'السائقون' : 'Drivers') : (isRTL ? 'الطلبات' : 'Requests')}
              </button>
            ))}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b6b80' }}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : taxis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b6b80' }}>{isRTL ? 'لا يوجد سائقون مسجلون بعد' : 'No drivers registered yet'}</div>
          ) : taxis.map((taxi) => (
            <div key={taxi.id} style={S.adminCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: taxi.is_online ? '#1dcd9f' : '#6b6b80', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{taxi.driver_name}</div>
                    <div style={{ fontSize: 11, color: '#6b6b80' }}>{taxi.plate} · {taxi.car_make_model}</div>
                    {taxi.no_show_count > 0 && <div style={{ fontSize: 11, color: '#ff4757' }}>{taxi.no_show_count}x no-show</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'flex-end' }}>
                  {taxi.verified
                    ? <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(29,205,159,0.1)', color: '#1dcd9f', fontSize: 11 }}>✓ {isRTL ? 'موثّق' : 'Verified'}</span>
                    : <button style={S.btnVerify} onClick={() => verifyDriver(taxi.id, true)}>{isRTL ? 'توثيق' : 'Verify'}</button>
                  }
                  {taxi.verified && (
                    <button style={S.btnSuspend} onClick={() => verifyDriver(taxi.id, false)}>{isRTL ? 'إيقاف' : 'Suspend'}</button>
                  )}
                  <button style={S.btnForce} onClick={() => toggleOnline(taxi.id, taxi.is_online)}>
                    {taxi.is_online ? (isRTL ? 'إيقاف' : 'Force off') : (isRTL ? 'تشغيل' : 'Force on')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ad Slots */}
        <div style={{ ...S.section, paddingTop: 20 }}>
          <div style={S.sectionTitle}><span style={S.sectionBar} />{isRTL ? 'المساحات الإعلانية' : 'Ad Slots'}</div>
          <div style={{ ...S.adminCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AdSlotToggle label={isRTL ? 'بانر الراكب' : 'Passenger Banner'} />
            <AdSlotToggle label={isRTL ? 'بانر السائق' : 'Driver Banner'} />
          </div>
        </div>

      </div>
    </div>
  )
}
