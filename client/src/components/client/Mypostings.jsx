import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Modal, TextInput, Image,
  Linking, StatusBar, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  getClientApplications, updateApplicationStatus, sendOffer,
  downloadResume, clearApplicationError, clearApplicationSuccess,
} from '../../Redux/slices/applicationSlice';
import { createContract, clearContractError, clearContractSuccess } from '../../Redux/slices/contractSlice';
import { createProjectUpdate } from '../../Redux/slices/projectUpdateSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  ink:        '#0A0F1E',
  inkMid:     '#2D3A52',
  inkLight:   '#64748B',
  inkFaint:   '#94A3B8',
  canvas:     '#F6F8FC',
  surface:    '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border:     '#E2E8F0',
  borderMid:  '#CBD5E1',
  accent:     '#1D4ED8',
  accentMid:  '#3B82F6',
  accentSoft: '#EFF6FF',
  accentFade: '#DBEAFE',
  success:    '#059669',
  successSoft:'#ECFDF5',
  successFade:'#A7F3D0',
  warn:       '#D97706',
  warnSoft:   '#FFFBEB',
  danger:     '#DC2626',
  dangerSoft: '#FEF2F2',
  violet:     '#7C3AED',
  violetSoft: '#F5F3FF',
  amber:      '#B45309',
  amberSoft:  '#FFFBEB',
  navy:       '#0F172A',
  navyMid:    '#1E293B',
  gold:       '#F59E0B',
  white:      '#FFFFFF',
};

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTER_TABS = ['All', 'pending', 'reviewed', 'interview', 'offered', 'hired', 'rejected'];

const STATUS_CONFIG = {
  pending:   { label: 'For Review',  color: C.violet,  icon: 'hourglass-outline',         soft: C.violetSoft },
  reviewed:  { label: 'Shortlisted', color: C.accentMid,icon: 'ribbon-outline',            soft: C.accentSoft },
  interview: { label: 'Interview',   color: C.warn,    icon: 'videocam-outline',           soft: C.warnSoft   },
  offered:   { label: 'Offer Sent',  color: C.success, icon: 'paper-plane-outline',        soft: C.successSoft},
  hired:     { label: 'Hired',       color: C.success, icon: 'checkmark-circle-outline',   soft: C.successSoft},
  rejected:  { label: 'Declined',    color: C.danger,  icon: 'close-circle-outline',       soft: C.dangerSoft },
};

const SUCCESS_EVENTS = {
  reviewed:  { icon: 'ribbon',             iconColor: C.accentMid, title: 'Candidate Shortlisted',    body: 'This applicant has been added to your shortlist for further review.',          action: 'Schedule Interview', nextStatus: 'interview', actionIcon: 'calendar-outline'       },
  interview: { icon: 'calendar',           iconColor: C.warn,      title: 'Interview Scheduled',      body: 'An interview invitation has been sent. Awaiting confirmation.',               action: 'Send Offer',         nextStatus: 'offered',   actionIcon: 'paper-plane-outline'    },
  offered:   { icon: 'paper-plane',        iconColor: C.success,   title: 'Offer Delivered',          body: 'Your offer has been sent successfully. Waiting for their response.',          action: 'Create Contract',    nextStatus: 'contract',  actionIcon: 'document-text-outline'  },
  hired:     { icon: 'checkmark-circle',   iconColor: C.success,   title: 'Freelancer Hired',         body: 'The freelancer is now part of your team. A contract has been created.',       action: null,                 nextStatus: null,        actionIcon: null                     },
  rejected:  { icon: 'close-circle',       iconColor: C.danger,    title: 'Application Declined',     body: 'The applicant has been notified of your decision.',                          action: null,                 nextStatus: null,        actionIcon: null                     },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatus = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;

const formatStatus = (s) => STATUS_CONFIG[s]?.label || s;

const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()];
  let h = dt.getHours(); const m = String(dt.getMinutes()).padStart(2,'0'); const ap = h>=12?'PM':'AM'; h=h%12||12;
  return `${mo} ${dt.getDate()}, ${dt.getFullYear()} · ${h}:${m} ${ap}`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
};

const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
};

const formatSize = (b) => {
  if (!b) return null;
  if (b<1024) return b+' B';
  if (b<1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(1)+' MB';
};

const getFileIcon = (name='') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext==='pdf') return { icon:'document-text', color:C.danger, bg:C.dangerSoft };
  if (['doc','docx'].includes(ext)) return { icon:'document-text', color:C.accent, bg:C.accentSoft };
  return { icon:'attach-outline', color:C.inkLight, bg:C.surfaceAlt };
};

// ── Avatar ─────────────────────────────────────────────────────────────────────
const Avatar = ({ uri, initials, size=44, fontSize=15 }) => (
  <View style={[av.wrap, { width:size, height:size, borderRadius:size/2 }]}>
    {uri
      ? <Image source={{ uri }} style={[av.img, { borderRadius:size/2 }]} />
      : <Text style={[av.text, { fontSize }]}>{initials||'?'}</Text>}
  </View>
);
const av = StyleSheet.create({
  wrap: { backgroundColor:C.accent, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  img:  { width:'100%', height:'100%' },
  text: { fontWeight:'700', color:C.white, letterSpacing:0.5 },
});

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size='sm' }) => {
  const cfg = getStatus(status);
  const pad = size==='lg' ? { paddingHorizontal:12, paddingVertical:6 } : { paddingHorizontal:8, paddingVertical:3 };
  const fs  = size==='lg' ? 12 : 10;
  return (
    <View style={[sb.wrap, pad, { backgroundColor:cfg.soft, borderColor:cfg.color+'40' }]}>
      <Ionicons name={cfg.icon} size={size==='lg'?13:10} color={cfg.color} />
      <Text style={[sb.text, { color:cfg.color, fontSize:fs }]}>{cfg.label}</Text>
    </View>
  );
};
const sb = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', gap:5, borderRadius:20, borderWidth:1 },
  text: { fontWeight:'700', letterSpacing:0.2 },
});

// ── Rating Stars ──────────────────────────────────────────────────────────────
const Stars = ({ rating=0 }) => {
  const full=Math.floor(rating); const half=rating-full>=0.5; const empty=5-full-(half?1:0);
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:3 }}>
      {Array.from({length:full}).map((_,i)=><Ionicons key={'f'+i} name="star" size={13} color={C.gold} />)}
      {half&&<Ionicons name="star-half" size={13} color={C.gold} />}
      {Array.from({length:empty}).map((_,i)=><Ionicons key={'e'+i} name="star-outline" size={13} color={C.gold} />)}
      {rating>0 ? <Text style={{ fontSize:11, fontWeight:'700', color:C.amber, marginLeft:2 }}>{rating.toFixed(1)}</Text> : null}
    </View>
  );
};

// ── Resume Card ───────────────────────────────────────────────────────────────
const ResumeCard = ({ resume }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const data = (() => {
    if (!resume) return null;
    if (typeof resume==='string') return { url:resume, name:'resume.pdf' };
    if (resume.url||resume.uri) return { url:resume.url||resume.uri, name:resume.name||'resume.pdf', size:resume.size };
    if (resume.data) return { url:resume.data, name:resume.name||'resume.pdf', size:resume.size };
    return null;
  })();
  if (!data?.url) return null;

  const { url, name, size } = data;
  const fi = getFileIcon(name);
  const ext = (name.split('.').pop()||'').toUpperCase();

  return (
    <View style={rc.wrap}>
      <View style={[rc.iconBox, { backgroundColor:fi.bg }]}>
        <Ionicons name={fi.icon} size={20} color={fi.color} />
      </View>
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={rc.name} numberOfLines={1}>{name}</Text>
        <View style={{ flexDirection:'row', gap:6, marginTop:3 }}>
          <Text style={rc.meta}>{ext}</Text>
          {formatSize(size)&&<Text style={rc.meta}>{formatSize(size)}</Text>}
        </View>
      </View>
      <View style={{ flexDirection:'row', gap:8 }}>
        <TouchableOpacity style={rc.viewBtn} onPress={()=>Linking.openURL(url).catch(()=>Alert.alert('Error','Cannot open file'))}>
          <Ionicons name="eye-outline" size={14} color={C.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[rc.dlBtn, done&&{ backgroundColor:C.success }]}
          disabled={loading}
          onPress={async ()=>{
            setLoading(true);
            try {
              const p = FileSystem.cacheDirectory+name;
              const { uri } = await FileSystem.downloadAsync(url, p);
              if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType:name.endsWith('.pdf')?'application/pdf':'application/octet-stream' });
              else await Linking.openURL(url);
              setDone(true);
            } catch { Alert.alert('Download Failed','Check your connection and try again.'); }
            finally { setLoading(false); }
          }}
        >
          {loading ? <ActivityIndicator size="small" color={C.white} /> :
           done    ? <Ionicons name="checkmark" size={14} color={C.white} /> :
                     <Ionicons name="cloud-download-outline" size={14} color={C.white} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};
const rc = StyleSheet.create({
  wrap:    { flexDirection:'row', alignItems:'center', gap:12, padding:14, borderRadius:12, borderWidth:1.5, borderColor:C.border, backgroundColor:C.surface },
  iconBox: { width:42, height:42, borderRadius:10, alignItems:'center', justifyContent:'center' },
  name:    { fontSize:13, fontWeight:'600', color:C.ink },
  meta:    { fontSize:10, color:C.inkFaint, fontWeight:'500' },
  viewBtn: { width:34, height:34, borderRadius:8, alignItems:'center', justifyContent:'center', backgroundColor:C.accentSoft, borderWidth:1, borderColor:C.accentFade },
  dlBtn:   { width:34, height:34, borderRadius:8, alignItems:'center', justifyContent:'center', backgroundColor:C.accent },
});

// ── Success Modal ─────────────────────────────────────────────────────────────
const SuccessModal = ({ visible, event, applicantName, onContinue, onClose }) => {
  const scale = React.useRef(new Animated.Value(0.88)).current;
  useEffect(() => {
    if (visible) Animated.spring(scale, { toValue:1, tension:90, friction:9, useNativeDriver:true }).start();
    else scale.setValue(0.88);
  }, [visible]);
  if (!event) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={succ.overlay}>
        <Animated.View style={[succ.card, { transform:[{ scale }] }]}>
          <View style={[succ.ring, { backgroundColor:event.iconColor+'15' }]}>
            <Ionicons name={event.icon} size={32} color={event.iconColor} />
          </View>
          <Text style={succ.title}>{event.title}</Text>
          {applicantName ? <Text style={succ.name}>{applicantName}</Text> : null}
          <Text style={succ.body}>{event.body}</Text>
          <View style={succ.actions}>
            {event.action && (
              <TouchableOpacity style={succ.primary} onPress={()=>onContinue(event.nextStatus)} activeOpacity={0.85}>
                <Ionicons name={event.actionIcon} size={15} color={C.white} />
                <Text style={succ.primaryTxt}>{event.action}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={succ.secondary} onPress={onClose} activeOpacity={0.8}>
              <Text style={succ.secondaryTxt}>{event.action ? 'Do This Later' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
const succ = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(10,15,30,0.72)', justifyContent:'center', alignItems:'center', padding:24 },
  card:       { backgroundColor:C.white, borderRadius:24, padding:28, width:'100%', maxWidth:360, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:20}, shadowOpacity:0.18, shadowRadius:40, elevation:16 },
  ring:       { width:76, height:76, borderRadius:38, alignItems:'center', justifyContent:'center', marginBottom:18 },
  title:      { fontSize:19, fontWeight:'800', color:C.ink, marginBottom:4, textAlign:'center', letterSpacing:-0.4 },
  name:       { fontSize:14, fontWeight:'700', color:C.accent, marginBottom:6, textAlign:'center' },
  body:       { fontSize:13, color:C.inkLight, textAlign:'center', lineHeight:20, marginBottom:24 },
  actions:    { width:'100%', gap:10 },
  primary:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:C.accent, paddingVertical:14, borderRadius:12 },
  primaryTxt: { fontSize:14, fontWeight:'700', color:C.white },
  secondary:  { alignItems:'center', paddingVertical:13, borderRadius:12, backgroundColor:C.surfaceAlt, borderWidth:1.5, borderColor:C.border },
  secondaryTxt:{ fontSize:13, fontWeight:'600', color:C.inkLight },
});

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, first }) => (
  <View style={[ir.row, !first&&{ borderTopWidth:1, borderTopColor:C.border }]}>
    <View style={ir.iconBox}><Ionicons name={icon} size={14} color={C.accent} /></View>
    <View style={{ flex:1 }}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value||'—'}</Text>
    </View>
  </View>
);
const ir = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'flex-start', gap:12, paddingVertical:12 },
  iconBox:{ width:28, height:28, borderRadius:7, backgroundColor:C.accentSoft, alignItems:'center', justifyContent:'center', marginTop:1 },
  label:  { fontSize:10, fontWeight:'600', color:C.inkFaint, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 },
  value:  { fontSize:13, color:C.ink, fontWeight:'500' },
});

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHead = ({ label, right }) => (
  <View style={sh.row}>
    <Text style={sh.label}>{label}</Text>
    {right}
  </View>
);
const sh = StyleSheet.create({
  row:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  label: { fontSize:10, fontWeight:'800', color:C.accent, textTransform:'uppercase', letterSpacing:1.2 },
});

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, required, optional, children }) => (
  <View style={fd.wrap}>
    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:7 }}>
      <Text style={fd.label}>{label}</Text>
      {required&&<Text style={fd.req}> *</Text>}
      {optional&&<Text style={fd.opt}> (Optional)</Text>}
    </View>
    {children}
  </View>
);
const fd = StyleSheet.create({
  wrap:  { marginBottom:16 },
  label: { fontSize:12, fontWeight:'700', color:C.inkMid },
  req:   { fontSize:12, color:C.danger, fontWeight:'700' },
  opt:   { fontSize:11, color:C.inkFaint },
});

const INPUT = {
  backgroundColor:C.canvas, borderRadius:11, paddingHorizontal:14, paddingVertical:13,
  color:C.ink, fontSize:14, borderWidth:1.5, borderColor:C.border, fontWeight:'400',
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Applications({ onNavigate }) {
  const dispatch = useDispatch();
  const { applications, isLoading } = useSelector((s) => s.applications);
  const { createSuccess } = useSelector((s) => s.contracts);

  const [activeTab,          setActiveTab]          = useState('All');
  const [refreshing,         setRefreshing]         = useState(false);
  const [showProfile,        setShowProfile]        = useState(false);
  const [selectedApp,        setSelectedApp]        = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showInterview,      setShowInterview]      = useState(false);
  const [actionLoading,      setActionLoading]      = useState(null);

  const [successEvent, setSuccessEvent] = useState(null);
  const [successName,  setSuccessName]  = useState('');
  const [showSuccess,  setShowSuccess]  = useState(false);

  const [iDate,    setIDate]    = useState(new Date());
  const [iTime,    setITime]    = useState(new Date());
  const [iLink,    setILink]    = useState('');
  const [iNotes,   setINotes]   = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tmpDate,  setTmpDate]  = useState(new Date());
  const [tmpTime,  setTmpTime]  = useState(new Date());
  const [sendingI, setSendingI] = useState(false);

  const [showContract,   setShowContract]   = useState(false);
  const [contractData,   setContractData]   = useState({ title:'', description:'', budgetAmount:'', budgetType:'fixed', startDate:new Date(), endDate:new Date(Date.now()+30*864e5), terms:'' });
  const [creatingC,      setCreatingC]      = useState(false);

  useEffect(() => { fetchApps(); }, [activeTab]);

  useEffect(() => {
    if (createSuccess) { setShowSuccess(true); dispatch(clearContractSuccess()); }
  }, [createSuccess]);

  const fetchApps = async () => {
    try {
      const p = { page:1, limit:50 };
      if (activeTab!=='All') p.status = activeTab;
      await dispatch(getClientApplications(p)).unwrap();
    } catch { Alert.alert('Error','Failed to load applications'); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchApps(); setRefreshing(false);
  }, [activeTab]);

  const getName = (app) => {
    const fl = app.freelancer_id || {};
    return ((fl.first_name||'')+' '+(fl.last_name||'')).trim() || 'Applicant';
  };

  const updateStatus = async (app, status, extra={}) => {
    setActionLoading(status);
    try {
      await dispatch(updateApplicationStatus({ applicationId:app._id, status, ...extra })).unwrap();
      await fetchApps();
      const ev = SUCCESS_EVENTS[status];
      if (ev) { setSuccessEvent(ev); setSuccessName(getName(app)); setShowSuccess(true); }
    } catch { Alert.alert('Error','Failed to update. Please try again.'); }
    finally { setActionLoading(null); }
  };

  const openInterview = (app) => {
    setSelectedApp(app); setSelectedFreelancer(app.freelancer_id); setShowInterview(true);
  };

  const openContract = (app) => {
    setSelectedApp(app); setSelectedFreelancer(app.freelancer_id);
    const job = app.job_id || {};
    setContractData({
      title: job.title||'Contract',
      description: job.description||'',
      budgetAmount: String(app.proposed_rate||job.budget||0),
      budgetType: app.budget_type||'fixed',
      startDate: new Date(),
      endDate: new Date(Date.now()+30*864e5),
      terms: `Standard contract terms for ${job.title||'this project'}.`,
    });
    setShowContract(true);
  };

  const handleReject = (app) => {
    const name = app.freelancer_id?.first_name||'this applicant';
    Alert.alert('Decline Application', `Decline ${name}'s application? This action cannot be undone.`, [
      { text:'Cancel', style:'cancel' },
      { text:'Decline', style:'destructive', onPress:()=>updateStatus(app,'rejected') },
    ]);
  };

  const handleSuccessContinue = (next) => {
    setShowSuccess(false);
    if (!next||!selectedApp) return;
    if (next==='interview') setShowInterview(true);
    else if (next==='offered') updateStatus(selectedApp,'offered');
    else if (next==='contract') openContract(selectedApp);
  };

  const sendInterview = async () => {
    if (!iDate||!iTime) { Alert.alert('Missing Information','Please set interview date and time.'); return; }
    setSendingI(true);
    try {
      const dt = new Date(iDate);
      dt.setHours(iTime.getHours()); dt.setMinutes(iTime.getMinutes());
      await dispatch(updateApplicationStatus({ applicationId:selectedApp._id, status:'interview', interview:{ scheduled_date:dt.toISOString(), meeting_link:iLink, notes:iNotes } })).unwrap();
      await fetchApps();
      setShowInterview(false); setIDate(new Date()); setITime(new Date()); setILink(''); setINotes('');
      setSuccessEvent(SUCCESS_EVENTS.interview); setSuccessName(getName(selectedApp)); setShowSuccess(true);
    } catch { Alert.alert('Error','Failed to schedule interview.'); }
    finally { setSendingI(false); }
  };

  const createContractHandler = async () => {
    if (!contractData.title.trim()) { Alert.alert('Required','Please enter a contract title.'); return; }
    if (!contractData.budgetAmount||parseFloat(contractData.budgetAmount)<=0) { Alert.alert('Required','Please enter a valid budget amount.'); return; }
    if (!selectedApp) { Alert.alert('Error','No application selected.'); return; }

    setCreatingC(true);
    try {
      const fl = selectedFreelancer || {};
      const fullName = ((fl.first_name||'')+' '+(fl.last_name||'')).trim()||'Freelancer';

      const freelancerId = fl._id||fl.id||selectedApp?.freelancer_id?._id||selectedApp?.freelancer_id||null;
      const jobId = selectedApp?.job_id?._id||selectedApp?.job_id||null;
      const appId = selectedApp?._id||selectedApp?.id||null;

      const missing = [];
      if (!jobId) missing.push('Job ID');
      if (!appId) missing.push('Application ID');
      if (!freelancerId) missing.push('Freelancer ID');
      if (missing.length) { Alert.alert('Error',`Missing: ${missing.join(', ')}.`); setCreatingC(false); return; }

      await dispatch(updateApplicationStatus({ applicationId:appId, status:'hired' })).unwrap().catch(e=>{ if(!e?.message?.includes('already')) throw e; });

      const payload = {
        job_id:jobId, application_id:appId, freelancer_id:freelancerId,
        agreed_budget:{ amount:parseFloat(contractData.budgetAmount), type:contractData.budgetType||'fixed', currency:'PHP' },
        start_date: contractData.startDate instanceof Date ? contractData.startDate.toISOString() : new Date(contractData.startDate).toISOString(),
        end_date:   contractData.endDate   instanceof Date ? contractData.endDate.toISOString()   : new Date(contractData.endDate).toISOString(),
        terms: contractData.terms?.trim()||'Standard contract terms apply.',
        status:'active',
      };

      const result = await dispatch(createContract(payload)).unwrap();
      if (result?.contract||result?.success) {
        const cId = result.contract?._id||result.contract?.id||result._id||result.id;
        if (cId) {
          await dispatch(updateApplicationStatus({ applicationId:appId, status:'hired', contractId:cId })).unwrap().catch(()=>{});
          try {
            await dispatch(createProjectUpdate({
              contract_id:cId, job_id:jobId,
              title:`Contract Started: ${contractData.title}`,
              description:`Initial project update for "${contractData.title}". Freelancer ${fullName} has been hired.`,
              update_type:'announcement', status:'completed', delivery_status:'approved',
              progress:0, priority:'normal', freelancer_comment:null, client_comment:null, due_date:null,
            })).unwrap();
          } catch (e) { console.warn('Project update failed:',e); }
        }

        await fetchApps();
        setShowContract(false);
        setSuccessEvent(SUCCESS_EVENTS.hired); setSuccessName(fullName); setShowSuccess(true);
        setContractData({ title:'', description:'', budgetAmount:'', budgetType:'fixed', startDate:new Date(), endDate:new Date(Date.now()+30*864e5), terms:'' });
      } else {
        throw new Error('Contract creation returned no data.');
      }
    } catch (err) {
      let msg = 'Failed to create contract. Please try again.';
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      if (msg.includes('already exists')) msg = 'A contract already exists for this application.';
      Alert.alert('Error', msg);
    } finally { setCreatingC(false); }
  };

  // ── Action Buttons ─────────────────────────────────────────────────────────
  const ActionButtons = ({ app }) => {
    const st = app.status;
    const ld = (s) => actionLoading===s;
    return (
      <View style={act.row}>
        {st==='pending'   ? <Btn icon="ribbon-outline"      label="Shortlist"          color={C.accentMid} loading={ld('reviewed')}  onPress={()=>updateStatus(app,'reviewed')} /> : null}
        {st==='reviewed'  ? <Btn icon="videocam-outline"    label="Schedule Interview" color={C.warn}      loading={ld('interview')} onPress={()=>{setSelectedApp(app);setSelectedFreelancer(app.freelancer_id);setShowInterview(true);}} /> : null}
        {st==='interview' ? <Btn icon="paper-plane-outline" label="Send Offer"         color={C.success}   loading={ld('offered')}   onPress={()=>updateStatus(app,'offered')} /> : null}
        {st==='offered'   ? <Btn icon="document-text-outline" label="Create Contract"  color={C.accent}    loading={ld('hired')}     onPress={()=>openContract(app)} /> : null}
        {st==='hired' ? (
          <View style={{ flexDirection:'row', gap:8, flex:1 }}>
            <View style={[act.badge, { backgroundColor:C.successSoft, borderColor:C.successFade }]}>
              <Ionicons name="checkmark-circle" size={14} color={C.success} />
              <Text style={[act.badgeTxt, { color:C.success }]}>Hired</Text>
            </View>
            {app.contractId ? (
              <TouchableOpacity style={[act.badge, { backgroundColor:C.accentSoft, borderColor:C.accentFade, flex:1 }]}
                onPress={()=>onNavigate&&onNavigate('ContractDetails',{ contractId:app.contractId })} activeOpacity={0.8}>
                <Ionicons name="document-text-outline" size={14} color={C.accent} />
                <Text style={[act.badgeTxt, { color:C.accent }]}>View Contract</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {!['rejected','hired'].includes(st) ? (
          <Btn icon="close-outline" label="Decline" color={C.danger} loading={ld('rejected')} onPress={()=>handleReject(app)} />
        ) : null}
      </View>
    );
  };

  // ── Application Card ───────────────────────────────────────────────────────
  const AppCard = ({ app }) => {
    const fl   = app.freelancer_id||{};
    const job  = app.job_id||{};
    const name = ((fl.first_name||'')+' '+(fl.last_name||'')).trim()||'Freelancer';
    const init = (fl.first_name||'')[0]+''+(fl.last_name||'')[0];
    const rate = app.proposed_rate ? `₱${app.proposed_rate.toLocaleString()}${app.budget_type==='hourly'?'/hr':''}` : null;

    return (
      <TouchableOpacity style={card.wrap} onPress={()=>{ setSelectedFreelancer(fl); setSelectedApp(app); setShowProfile(true); }} activeOpacity={0.72}>
        {/* Header */}
        <View style={card.head}>
          <Avatar uri={fl.profile_picture} initials={init} size={48} fontSize={16} />
          <View style={{ flex:1, minWidth:0 }}>
            <Text style={card.name} numberOfLines={1}>{name}</Text>
            <Text style={card.sub}  numberOfLines={1}>{fl.experience_level||'Freelancer'}</Text>
            {fl.skills?.length > 0 ? (
              <View style={card.pills}>
                {fl.skills.slice(0,2).map((sk,i)=>(
                  <View key={i} style={card.pill}><Text style={card.pillTxt} numberOfLines={1}>{sk}</Text></View>
                ))}
                {fl.skills.length>2 ? <Text style={card.more}>+{String(fl.skills.length-2)}</Text> : null}
              </View>
            ) : null}
          </View>
          <StatusBadge status={app.status} />
        </View>

        {/* Meta */}
        <View style={card.divider} />
        <View style={card.meta}>
          <View style={card.metaItem}>
            <Ionicons name="briefcase-outline" size={13} color={C.accent} />
            <Text style={card.metaTxt} numberOfLines={1}>{job.title||'Untitled Job'}</Text>
          </View>
          <View style={card.metaItem}>
            <Ionicons name="time-outline" size={12} color={C.inkFaint} />
            <Text style={card.metaTime}>{formatDateTime(app.applied_at||app.createdAt)}</Text>
          </View>
        </View>

        {app.cover_letter ? <Text style={card.cover} numberOfLines={2}>{app.cover_letter}</Text> : null}

        {/* Footer */}
        <View style={card.foot}>
          <View>
            {rate ? <Text style={card.rate}>{rate}</Text> : null}
            {app.contractId ? (
              <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:2 }}>
                <Ionicons name="shield-checkmark-outline" size={11} color={C.success} />
                <Text style={{ fontSize:10, color:C.success, fontWeight:'700' }}>Contract Active</Text>
              </View>
            ) : null}
          </View>
          <View style={card.profileBtn}>
            <Ionicons name="person-outline" size={12} color={C.accent} />
            <Text style={card.profileBtnTxt}>Full Profile</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Filtered List ──────────────────────────────────────────────────────────
  const filtered = activeTab==='All' ? applications : applications.filter(a=>a.status===activeTab);

  if (isLoading&&!refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <TopBar onBack={()=>onNavigate&&onNavigate('ClientDashboard')} onOffers={()=>onNavigate&&onNavigate('Sentoffers')} />
        <View style={s.center}><ActivityIndicator size="large" color={C.accent} /><Text style={s.loadTxt}>Loading applicants…</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={s.root}>
        <TopBar onBack={()=>onNavigate&&onNavigate('ClientDashboard')} onOffers={()=>onNavigate&&onNavigate('Sentoffers')} />

        {/* Filter tabs */}
        <View style={s.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
            {FILTER_TABS.map(tab=>{
              const active = activeTab===tab;
              const count  = tab==='All' ? applications.length : applications.filter(a=>a.status===tab).length;
              const cfg    = tab!=='All' ? getStatus(tab) : null;
              return (
                <TouchableOpacity key={tab} style={[s.tab, active&&{ backgroundColor:C.accent, borderColor:C.accent }]} onPress={()=>setActiveTab(tab)} activeOpacity={0.75}>
                  {cfg&&!active&&<Ionicons name={cfg.icon} size={11} color={cfg.color} />}
                  <Text style={[s.tabTxt, active&&{ color:C.white }]}>{tab==='All'?'All':formatStatus(tab)}</Text>
                  {count > 0 ? <View style={[s.tabBadge, active ? { backgroundColor:'rgba(255,255,255,0.25)' } : null]}>
                    <Text style={[s.tabBadgeTxt, active ? { color:C.white } : null]}>{String(count)}</Text>
                  </View> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Summary strip */}
        {activeTab==='All'&&applications.length>0&&(
          <View style={s.strip}>
            {[['pending','For Review'],['interview','Interviewing'],['hired','Hired']].map(([st,lb], idx, arr)=>{
              const n = applications.filter(a=>a.status===st).length;
              const cfg = getStatus(st);
              const isLast = idx === arr.length - 1;
              return (
                <TouchableOpacity key={st} style={[s.stripItem, isLast && { borderRightWidth:0 }]} onPress={()=>setActiveTab(st)} activeOpacity={0.8}>
                  <Text style={[s.stripNum, { color:cfg.color }]}>{n}</Text>
                  <Text style={s.stripLbl}>{lb}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        >
          {filtered.length===0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><Ionicons name="people-outline" size={32} color={C.accent} /></View>
              <Text style={s.emptyTitle}>No Applicants</Text>
              <Text style={s.emptyDesc}>
                {activeTab==='All' ? "No applications received yet." : `No ${formatStatus(activeTab).toLowerCase()} applications found.`}
              </Text>
            </View>
          ) : (
            filtered.map(app=><AppCard key={app._id} app={app} />)
          )}
        </ScrollView>
      </View>

      {/* ── Profile Modal ────────────────────────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={showProfile} onRequestClose={()=>setShowProfile(false)}>
        <View style={md.overlay}>
          <View style={md.sheet}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Freelancer Profile</Text>
              <TouchableOpacity style={md.closeBtn} onPress={()=>setShowProfile(false)}><Ionicons name="close" size={17} color={C.inkLight} /></TouchableOpacity>
            </View>
            {selectedFreelancer&&selectedApp&&(
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={md.body}>

                {/* Hero */}
                <View style={pf.hero}>
                  <Avatar uri={selectedFreelancer.profile_picture} initials={(selectedFreelancer.first_name||'')[0]+''+(selectedFreelancer.last_name||'')[0]} size={80} fontSize={28} />
                  <Text style={pf.heroName}>{(selectedFreelancer.first_name||'')+' '+(selectedFreelancer.last_name||'')}</Text>
                  <Text style={pf.heroUser}>@{selectedFreelancer.username||''}</Text>
                  {selectedFreelancer.rating > 0 ? <Stars rating={selectedFreelancer.rating} /> : null}
                  <View style={{ marginTop:12 }}><StatusBadge status={selectedApp.status} size="lg" /></View>
                </View>

                {/* Applied Info */}
                <View style={pf.infoCard}>
                  <InfoRow icon="briefcase-outline" label="Applied For" value={selectedApp.job_id?.title||'Untitled Job'} first />
                  <InfoRow icon="time-outline"      label="Applied On"  value={formatDateTime(selectedApp.applied_at||selectedApp.createdAt)} />
                  {selectedApp.contractId&&<InfoRow icon="shield-checkmark-outline" label="Contract" value="Active — tap View Contract" />}
                </View>

                {/* Contact */}
                <View style={pf.section}>
                  <SectionHead label="Contact" />
                  <View style={pf.infoCard}>
                    {selectedFreelancer.email_address ? <InfoRow icon="mail-outline"     label="Email"    value={selectedFreelancer.email_address} first /> : null}
                    {selectedFreelancer.phone_number   ? <InfoRow icon="call-outline"     label="Phone"    value={selectedFreelancer.phone_number} /> : null}
                    {selectedFreelancer.location       ? <InfoRow icon="location-outline" label="Location" value={selectedFreelancer.location} /> : null}
                  </View>
                </View>

                {/* Skills */}
                {selectedFreelancer.skills?.length > 0 ? (
                  <View style={pf.section}>
                    <SectionHead label="Skills" />
                    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                      {selectedFreelancer.skills.map((sk,i)=>(
                        <View key={i} style={pf.skill}><Text style={pf.skillTxt}>{sk}</Text></View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* About */}
                {selectedFreelancer.bio_about_me ? (
                  <View style={pf.section}>
                    <SectionHead label="About" />
                    <View style={pf.infoCard}><Text style={pf.bodyTxt}>{selectedFreelancer.bio_about_me}</Text></View>
                  </View>
                ) : null}

                {/* Resume */}
                <View style={pf.section}>
                  <SectionHead label="Resume / CV"
                    right={
                      (()=>{const has=selectedApp.resume?.url||selectedApp.resume_url||selectedFreelancer.resume?.url||(typeof selectedApp.resume==='string'&&selectedApp.resume.length>0);
                      return has ? <View style={pf.attachedTag}><Ionicons name="checkmark-circle" size={11} color={C.success} /><Text style={pf.attachedTxt}>Attached</Text></View> : null;})()
                    }
                  />
                  {(()=>{const r=selectedApp.resume||selectedApp.resume_url||selectedFreelancer.resume||null;
                    return r ? <ResumeCard resume={r} /> : (
                      <View style={pf.noResume}>
                        <Ionicons name="document-outline" size={18} color={C.inkFaint} />
                        <View><Text style={pf.noResumeTitle}>No resume attached</Text><Text style={pf.noResumeSub}>This applicant did not upload a CV.</Text></View>
                      </View>
                    );})()}
                </View>

                {/* Education */}
                {selectedApp.education ? (
                  <View style={pf.section}>
                    <SectionHead label="Education" />
                    <View style={pf.infoCard}>
                      {selectedApp.education.level           ? <InfoRow icon="school-outline"   label="Level"       value={selectedApp.education.level} first /> : null}
                      {selectedApp.education.field_of_study  ? <InfoRow icon="book-outline"     label="Field"       value={selectedApp.education.field_of_study} /> : null}
                      {selectedApp.education.institution     ? <InfoRow icon="business-outline" label="Institution" value={selectedApp.education.institution} /> : null}
                      {selectedApp.education.graduation_year ? <InfoRow icon="calendar-outline" label="Graduated"   value={String(selectedApp.education.graduation_year)} /> : null}
                    </View>
                  </View>
                ) : null}

                {/* Experience */}
                {selectedApp.experiences?.length > 0 ? (
                  <View style={pf.section}>
                    <SectionHead label="Work Experience" />
                    {selectedApp.experiences.map((ex,i)=>(
                      <View key={i} style={[pf.infoCard, { marginBottom:8 }]}>
                        <Text style={pf.expTitle}>{ex.job_title}</Text>
                        <Text style={pf.expCo}>{ex.company_name}</Text>
                        <Text style={pf.expPeriod}>{(ex.start_date||'')+' — '+(ex.currently_working?'Present':(ex.end_date||''))}</Text>
                        {ex.description ? <Text style={[pf.bodyTxt,{marginTop:8}]}>{ex.description}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Cover Letter */}
                {selectedApp.cover_letter ? (
                  <View style={pf.section}>
                    <SectionHead label="Cover Letter" />
                    <View style={pf.infoCard}><Text style={pf.bodyTxt}>{selectedApp.cover_letter}</Text></View>
                  </View>
                ) : null}

                {/* Rate */}
                {selectedApp.proposed_rate ? (
                  <View style={pf.section}>
                    <SectionHead label="Proposed Rate" />
                    <View style={pf.rateTag}>
                      <Ionicons name="cash-outline" size={16} color={C.amber} />
                      <Text style={pf.rateTxt}>{`₱${selectedApp.proposed_rate.toLocaleString()}${selectedApp.budget_type==='hourly'?'/hr':''}`}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Actions */}
                <ActionButtons app={selectedApp} />

                <TouchableOpacity style={pf.msgBtn} onPress={()=>{ setShowProfile(false); if(onNavigate) onNavigate('Messages',{ userId:selectedFreelancer._id, userRole:'freelancer' }); }} activeOpacity={0.85}>
                  <Ionicons name="chatbubble-outline" size={16} color={C.white} />
                  <Text style={pf.msgTxt}>Message Freelancer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Interview Modal ──────────────────────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={showInterview} onRequestClose={()=>setShowInterview(false)}>
        <View style={md.overlay}>
          <View style={md.sheet}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Schedule Interview</Text>
              <TouchableOpacity style={md.closeBtn} onPress={()=>setShowInterview(false)}><Ionicons name="close" size={17} color={C.inkLight} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={md.body}>

              {selectedFreelancer&&(
                <View style={cstrip.wrap}>
                  <Avatar uri={selectedFreelancer.profile_picture} initials={(selectedFreelancer.first_name||'')[0]+''+(selectedFreelancer.last_name||'')[0]} size={40} fontSize={15} />
                  <View style={{ flex:1 }}>
                    <Text style={cstrip.name}>{(selectedFreelancer.first_name||'')+' '+(selectedFreelancer.last_name||'')}</Text>
                    <Text style={cstrip.role}>{selectedFreelancer.experience_level||'Freelancer'}</Text>
                  </View>
                  <StatusBadge status="interview" />
                </View>
              )}

              <Field label="Interview Date" required>
                <TouchableOpacity style={iv.picker} onPress={()=>setShowDate(true)} activeOpacity={0.75}>
                  <Ionicons name="calendar-outline" size={17} color={C.accent} />
                  <Text style={iv.pickerTxt}>{formatDate(iDate)}</Text>
                  <Ionicons name="chevron-forward" size={15} color={C.inkFaint} />
                </TouchableOpacity>
              </Field>

              <Field label="Interview Time" required>
                <TouchableOpacity style={iv.picker} onPress={()=>setShowTime(true)} activeOpacity={0.75}>
                  <Ionicons name="time-outline" size={17} color={C.accent} />
                  <Text style={iv.pickerTxt}>{formatTime(iTime)}</Text>
                  <Ionicons name="chevron-forward" size={15} color={C.inkFaint} />
                </TouchableOpacity>
              </Field>

              {showDate&&(
                <Modal transparent animationType="fade" visible={showDate} onRequestClose={()=>setShowDate(false)}>
                  <View style={pk.overlay}>
                    <View style={pk.box}>
                      <View style={pk.head}>
                        <TouchableOpacity onPress={()=>setShowDate(false)}><Text style={pk.cancel}>Cancel</Text></TouchableOpacity>
                        <Text style={pk.title}>Select Date</Text>
                        <TouchableOpacity onPress={()=>{ setIDate(tmpDate); setShowDate(false); }}><Text style={pk.confirm}>Confirm</Text></TouchableOpacity>
                      </View>
                      <DateTimePicker value={tmpDate} mode="date" display={Platform.OS==='ios'?'spinner':'default'} onChange={(_,d)=>d&&setTmpDate(d)} minimumDate={new Date()} style={Platform.OS==='ios'?{height:200}:{}} />
                    </View>
                  </View>
                </Modal>
              )}

              {showTime&&(
                <Modal transparent animationType="fade" visible={showTime} onRequestClose={()=>setShowTime(false)}>
                  <View style={pk.overlay}>
                    <View style={pk.box}>
                      <View style={pk.head}>
                        <TouchableOpacity onPress={()=>setShowTime(false)}><Text style={pk.cancel}>Cancel</Text></TouchableOpacity>
                        <Text style={pk.title}>Select Time</Text>
                        <TouchableOpacity onPress={()=>{ setITime(tmpTime); setShowTime(false); }}><Text style={pk.confirm}>Confirm</Text></TouchableOpacity>
                      </View>
                      <DateTimePicker value={tmpTime} mode="time" display={Platform.OS==='ios'?'spinner':'default'} onChange={(_,t)=>t&&setTmpTime(t)} is24Hour={false} style={Platform.OS==='ios'?{height:200}:{}} />
                    </View>
                  </View>
                </Modal>
              )}

              <Field label="Video Call Link" optional>
                <TextInput style={INPUT} placeholder="Zoom, Google Meet, Microsoft Teams…" placeholderTextColor={C.inkFaint} value={iLink} onChangeText={setILink} autoCapitalize="none" />
              </Field>

              <Field label="Notes" optional>
                <TextInput style={[INPUT,{height:96,textAlignVertical:'top'}]} placeholder="Interview agenda or preparation instructions…" placeholderTextColor={C.inkFaint} value={iNotes} onChangeText={setINotes} multiline />
              </Field>

              <View style={btnRow.wrap}>
                <TouchableOpacity style={btnRow.cancel} onPress={()=>setShowInterview(false)}><Text style={btnRow.cancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[btnRow.primary,{backgroundColor:C.warn}]} onPress={sendInterview} disabled={sendingI} activeOpacity={0.85}>
                  {sendingI ? <ActivityIndicator size="small" color={C.white} /> : <>
                    <Ionicons name="calendar-outline" size={16} color={C.white} />
                    <Text style={btnRow.primaryTxt}>Send Invitation</Text>
                  </>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Contract Modal ───────────────────────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={showContract} onRequestClose={()=>setShowContract(false)}>
        <View style={md.overlay}>
          <View style={md.sheet}>
            <View style={md.handle} />
            <View style={md.header}>
              <Text style={md.title}>Create Contract</Text>
              <TouchableOpacity style={md.closeBtn} onPress={()=>setShowContract(false)}><Ionicons name="close" size={17} color={C.inkLight} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={md.body}>

              {selectedFreelancer&&(
                <View style={cstrip.wrap}>
                  <Avatar uri={selectedFreelancer.profile_picture} initials={(selectedFreelancer.first_name||'')[0]+''+(selectedFreelancer.last_name||'')[0]} size={40} fontSize={15} />
                  <View style={{ flex:1 }}>
                    <Text style={cstrip.name}>{(selectedFreelancer.first_name||'')+' '+(selectedFreelancer.last_name||'')}</Text>
                    <Text style={cstrip.role}>{selectedFreelancer.experience_level||'Freelancer'}</Text>
                  </View>
                  <View style={cstrip.hireBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={C.success} />
                    <Text style={cstrip.hireTxt}>Hiring</Text>
                  </View>
                </View>
              )}

              <Field label="Contract Title" required>
                <TextInput style={INPUT} placeholder="e.g., Mobile App Development" placeholderTextColor={C.inkFaint} value={contractData.title} onChangeText={v=>setContractData({...contractData,title:v})} />
              </Field>

              <Field label="Description" optional>
                <TextInput style={[INPUT,{height:80,textAlignVertical:'top'}]} placeholder="Scope of work, deliverables, expectations…" placeholderTextColor={C.inkFaint} value={contractData.description} onChangeText={v=>setContractData({...contractData,description:v})} multiline />
              </Field>

              <Field label="Budget" required>
                <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
                  <View style={[INPUT,{paddingHorizontal:12,justifyContent:'center',borderTopRightRadius:0,borderBottomRightRadius:0,marginTop:0}]}>
                    <Text style={{ fontSize:14, fontWeight:'700', color:C.inkMid }}>₱</Text>
                  </View>
                  <TextInput style={[INPUT,{flex:1,borderTopLeftRadius:0,borderBottomLeftRadius:0}]} placeholder="0.00" placeholderTextColor={C.inkFaint} value={contractData.budgetAmount} onChangeText={v=>setContractData({...contractData,budgetAmount:v})} keyboardType="numeric" />
                  <View style={{ flexDirection:'row', gap:6 }}>
                    {['fixed','hourly'].map(t=>(
                      <TouchableOpacity key={t} style={[ct.typeBtn, contractData.budgetType===t&&ct.typeActive]} onPress={()=>setContractData({...contractData,budgetType:t})}>
                        <Text style={[ct.typeTxt, contractData.budgetType===t&&ct.typeActiveTxt]}>{t==='fixed'?'Fixed':'Hourly'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Field>

              <Field label="Start Date" required>
                <TouchableOpacity style={iv.picker} onPress={()=>Alert.alert('Start Date','',[ {text:'Cancel',style:'cancel'},{text:'Today',onPress:()=>setContractData({...contractData,startDate:new Date()})},{text:'Tomorrow',onPress:()=>{const d=new Date();d.setDate(d.getDate()+1);setContractData({...contractData,startDate:d})}},{text:'Next Week',onPress:()=>{const d=new Date();d.setDate(d.getDate()+7);setContractData({...contractData,startDate:d})}} ])} activeOpacity={0.75}>
                  <Ionicons name="calendar-outline" size={17} color={C.accent} />
                  <Text style={iv.pickerTxt}>{formatDate(contractData.startDate)}</Text>
                  <Ionicons name="chevron-forward" size={15} color={C.inkFaint} />
                </TouchableOpacity>
              </Field>

              <Field label="End Date" required>
                <TouchableOpacity style={iv.picker} onPress={()=>Alert.alert('End Date','',[ {text:'Cancel',style:'cancel'},{text:'30 Days',onPress:()=>{const d=new Date(contractData.startDate);d.setDate(d.getDate()+30);setContractData({...contractData,endDate:d})}},{text:'60 Days',onPress:()=>{const d=new Date(contractData.startDate);d.setDate(d.getDate()+60);setContractData({...contractData,endDate:d})}},{text:'90 Days',onPress:()=>{const d=new Date(contractData.startDate);d.setDate(d.getDate()+90);setContractData({...contractData,endDate:d})}} ])} activeOpacity={0.75}>
                  <Ionicons name="calendar-outline" size={17} color={C.accent} />
                  <Text style={iv.pickerTxt}>{formatDate(contractData.endDate)}</Text>
                  <Ionicons name="chevron-forward" size={15} color={C.inkFaint} />
                </TouchableOpacity>
              </Field>

              <Field label="Terms & Conditions" optional>
                <TextInput style={[INPUT,{height:80,textAlignVertical:'top'}]} placeholder="Special terms or conditions…" placeholderTextColor={C.inkFaint} value={contractData.terms} onChangeText={v=>setContractData({...contractData,terms:v})} multiline />
              </Field>

              <View style={btnRow.wrap}>
                <TouchableOpacity style={btnRow.cancel} onPress={()=>setShowContract(false)} disabled={creatingC}><Text style={btnRow.cancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[btnRow.primary,{backgroundColor:C.success}]} onPress={createContractHandler} disabled={creatingC} activeOpacity={0.85}>
                  {creatingC ? <ActivityIndicator size="small" color={C.white} /> : <>
                    <Ionicons name="document-text-outline" size={16} color={C.white} />
                    <Text style={btnRow.primaryTxt}>Create Contract</Text>
                  </>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ──────────────────────────────────────────────────────── */}
      <SuccessModal visible={showSuccess} event={successEvent} applicantName={successName} onContinue={handleSuccessContinue} onClose={()=>setShowSuccess(false)} />
    </SafeAreaView>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
const TopBar = ({ onBack, onOffers }) => (
  <View style={tb.wrap}>
    <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={tb.iconBtn}>
      <Ionicons name="arrow-back" size={18} color={C.white} />
    </TouchableOpacity>
    <View style={{ flex:1 }}>
      <Text style={tb.title}>Applicants</Text>
      <Text style={tb.sub}>Review and manage candidates</Text>
    </View>
    <TouchableOpacity onPress={onOffers} activeOpacity={0.75} style={tb.iconBtn}>
      <Ionicons name="document-text-outline" size={18} color={C.white} />
    </TouchableOpacity>
  </View>
);
const tb = StyleSheet.create({
  wrap:   { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, backgroundColor:C.navy },
  iconBtn:{ width:36, height:36, borderRadius:9, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.10)' },
  title:  { fontSize:16, fontWeight:'800', color:C.white, letterSpacing:-0.3 },
  sub:    { fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 },
});

// ── Btn ───────────────────────────────────────────────────────────────────────
const Btn = ({ label, icon, color, loading, onPress }) => (
  <TouchableOpacity style={[act.btn, { backgroundColor:color+'14', borderColor:color+'35' }]} onPress={onPress} disabled={loading} activeOpacity={0.8}>
    {loading ? <ActivityIndicator size="small" color={color} /> : <Ionicons name={icon} size={14} color={color} />}
    <Text style={[act.txt, { color }]} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);
const act = StyleSheet.create({
  row:     { flexDirection:'row', flexWrap:'wrap', gap:8, paddingTop:14, marginTop:4, borderTopWidth:1.5, borderTopColor:C.border },
  btn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, paddingHorizontal:8, borderRadius:9, borderWidth:1.5 },
  txt:     { fontSize:12, fontWeight:'700', flexShrink:1 },
  badge:   { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, borderRadius:9, borderWidth:1.5 },
  badgeTxt:{ fontSize:12, fontWeight:'700' },
});

// ── Card styles ───────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap:       { backgroundColor:C.surface, borderRadius:14, padding:14, borderWidth:1.5, borderColor:C.border, marginBottom:10, shadowColor:'#0A0F1E', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  head:       { flexDirection:'row', alignItems:'flex-start', gap:11, marginBottom:10 },
  name:       { fontSize:14, fontWeight:'800', color:C.ink, marginBottom:2, letterSpacing:-0.2 },
  sub:        { fontSize:11, color:C.inkLight, marginBottom:5 },
  pills:      { flexDirection:'row', flexWrap:'wrap', gap:4 },
  pill:       { backgroundColor:C.accentSoft, paddingHorizontal:7, paddingVertical:2, borderRadius:5, borderWidth:1, borderColor:C.accentFade },
  pillTxt:    { fontSize:9, color:C.accent, fontWeight:'700' },
  more:       { fontSize:10, color:C.inkFaint, alignSelf:'center' },
  divider:    { height:1, backgroundColor:C.border, marginBottom:10 },
  meta:       { gap:5, marginBottom:8 },
  metaItem:   { flexDirection:'row', alignItems:'center', gap:6 },
  metaTxt:    { fontSize:12, fontWeight:'600', color:C.ink, flex:1 },
  metaTime:   { fontSize:11, color:C.inkFaint },
  cover:      { fontSize:12, color:C.inkLight, lineHeight:18, marginBottom:8 },
  foot:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTopWidth:1, borderTopColor:C.border },
  rate:       { fontSize:14, fontWeight:'800', color:C.amber },
  profileBtn: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:7, borderRadius:8, backgroundColor:C.accentSoft, borderWidth:1, borderColor:C.accentFade },
  profileBtnTxt:{ fontSize:11, color:C.accent, fontWeight:'700' },
});

// ── Profile styles ────────────────────────────────────────────────────────────
const pf = StyleSheet.create({
  hero:        { alignItems:'center', paddingVertical:24, paddingHorizontal:16, backgroundColor:C.canvas, borderRadius:16, borderWidth:1.5, borderColor:C.border, marginBottom:20 },
  heroName:    { fontSize:20, fontWeight:'800', color:C.ink, marginTop:12, marginBottom:2, letterSpacing:-0.4 },
  heroUser:    { fontSize:12, color:C.inkLight, marginBottom:8 },
  infoCard:    { backgroundColor:C.surface, borderRadius:13, paddingHorizontal:14, paddingVertical:4, borderWidth:1.5, borderColor:C.border, marginBottom:0 },
  section:     { marginBottom:20 },
  skill:       { backgroundColor:C.accentSoft, paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:C.accentFade },
  skillTxt:    { fontSize:12, color:C.accent, fontWeight:'600' },
  bodyTxt:     { fontSize:13, color:C.inkLight, lineHeight:21 },
  expTitle:    { fontSize:13, fontWeight:'800', color:C.ink, marginBottom:2 },
  expCo:       { fontSize:12, color:C.inkMid, marginBottom:3 },
  expPeriod:   { fontSize:11, color:C.inkFaint },
  rateTag:     { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:C.warnSoft, paddingHorizontal:14, paddingVertical:10, borderRadius:10, borderWidth:1, borderColor:C.gold+'40', alignSelf:'flex-start' },
  rateTxt:     { fontSize:17, fontWeight:'800', color:C.amber },
  msgBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:C.navyMid, paddingVertical:14, borderRadius:12, marginTop:16 },
  msgTxt:      { fontSize:14, fontWeight:'700', color:C.white },
  attachedTag: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.successSoft, paddingHorizontal:8, paddingVertical:3, borderRadius:12, borderWidth:1, borderColor:C.successFade },
  attachedTxt: { fontSize:10, fontWeight:'700', color:C.success },
  noResume:    { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:C.canvas, borderRadius:12, padding:14, borderWidth:1.5, borderColor:C.border, borderStyle:'dashed' },
  noResumeTitle:{ fontSize:13, fontWeight:'600', color:C.inkMid, marginBottom:2 },
  noResumeSub: { fontSize:11, color:C.inkFaint, lineHeight:16 },
});

// ── Modal base ────────────────────────────────────────────────────────────────
const md = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(10,15,30,0.65)', justifyContent:'flex-end' },
  sheet:   { backgroundColor:C.white, borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'92%' },
  handle:  { width:36, height:4, borderRadius:2, backgroundColor:C.border, alignSelf:'center', marginTop:12, marginBottom:4 },
  header:  { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1.5, borderBottomColor:C.border, gap:12 },
  title:   { fontSize:16, fontWeight:'800', color:C.ink, flex:1, letterSpacing:-0.3 },
  closeBtn:{ width:32, height:32, borderRadius:16, backgroundColor:C.canvas, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:C.border },
  body:    { padding:16, paddingBottom:40 },
});

// ── Candidate strip ───────────────────────────────────────────────────────────
const cstrip = StyleSheet.create({
  wrap:      { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:C.canvas, borderRadius:12, padding:14, marginBottom:20, borderWidth:1.5, borderColor:C.border },
  name:      { fontSize:14, fontWeight:'700', color:C.ink },
  role:      { fontSize:11, color:C.inkLight, marginTop:1 },
  hireBadge: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.successSoft, paddingHorizontal:10, paddingVertical:4, borderRadius:12, borderWidth:1, borderColor:C.successFade },
  hireTxt:   { fontSize:11, fontWeight:'700', color:C.success },
});

// ── Picker btn ────────────────────────────────────────────────────────────────
const iv = StyleSheet.create({
  picker:    { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:C.canvas, borderRadius:11, paddingHorizontal:14, paddingVertical:13, borderWidth:1.5, borderColor:C.border },
  pickerTxt: { flex:1, fontSize:14, color:C.ink, fontWeight:'500' },
});

// ── Picker modal ──────────────────────────────────────────────────────────────
const pk = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'center', alignItems:'center' },
  box:    { backgroundColor:C.white, borderRadius:20, padding:20, width:'90%', maxWidth:400 },
  head:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
  title:  { fontSize:15, fontWeight:'800', color:C.ink },
  cancel: { fontSize:14, color:C.inkLight, fontWeight:'600' },
  confirm:{ fontSize:14, color:C.accent, fontWeight:'800' },
});

// ── Budget type btns ──────────────────────────────────────────────────────────
const ct = StyleSheet.create({
  typeBtn:       { paddingHorizontal:12, paddingVertical:12, borderRadius:9, borderWidth:1.5, borderColor:C.border, backgroundColor:C.canvas },
  typeActive:    { backgroundColor:C.accent, borderColor:C.accent },
  typeTxt:       { fontSize:11, fontWeight:'700', color:C.inkLight },
  typeActiveTxt: { color:C.white },
});

// ── Button row ────────────────────────────────────────────────────────────────
const btnRow = StyleSheet.create({
  wrap:       { flexDirection:'row', gap:12, marginTop:8 },
  cancel:     { flex:1, alignItems:'center', justifyContent:'center', paddingVertical:14, borderRadius:11, backgroundColor:C.canvas, borderWidth:1.5, borderColor:C.border },
  cancelTxt:  { fontSize:14, fontWeight:'700', color:C.inkLight },
  primary:    { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, paddingVertical:14, borderRadius:11 },
  primaryTxt: { fontSize:14, fontWeight:'700', color:C.white },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:C.navy },
  root:       { flex:1, backgroundColor:C.canvas },
  tabsWrap:   { backgroundColor:C.surface, borderBottomWidth:1.5, borderBottomColor:C.border },
  tabsScroll: { flexDirection:'row', paddingHorizontal:16, paddingVertical:10, gap:8 },
  tab:        { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:13, paddingVertical:7, borderRadius:20, borderWidth:1.5, borderColor:C.border, backgroundColor:C.surface },
  tabTxt:     { fontSize:12, fontWeight:'700', color:C.inkLight },
  tabBadge:   { backgroundColor:C.canvas, borderRadius:10, paddingHorizontal:6, paddingVertical:1, minWidth:18, alignItems:'center' },
  tabBadgeTxt:{ fontSize:9, fontWeight:'800', color:C.inkLight },
  strip:      { flexDirection:'row', backgroundColor:C.surface, borderBottomWidth:1, borderBottomColor:C.border, paddingVertical:12, paddingHorizontal:8 },
  stripItem:  { flex:1, alignItems:'center', borderRightWidth:1, borderRightColor:C.border },
  stripNum:   { fontSize:22, fontWeight:'900', letterSpacing:-0.5 },
  stripLbl:   { fontSize:10, color:C.inkFaint, fontWeight:'600', marginTop:2, textTransform:'uppercase', letterSpacing:0.6 },
  scroll:     { padding:16, paddingBottom:32 },
  center:     { flex:1, alignItems:'center', justifyContent:'center', paddingVertical:60 },
  loadTxt:    { marginTop:12, fontSize:13, color:C.inkLight },
  empty:      { alignItems:'center', paddingVertical:64, paddingHorizontal:24 },
  emptyIcon:  { width:72, height:72, backgroundColor:C.accentSoft, borderRadius:18, alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyTitle: { fontSize:17, fontWeight:'800', color:C.ink, marginBottom:8, letterSpacing:-0.3 },
  emptyDesc:  { fontSize:13, color:C.inkLight, textAlign:'center', lineHeight:20 },
});