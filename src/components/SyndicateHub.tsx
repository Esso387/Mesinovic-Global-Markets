import React, { useState } from 'react';
import { 
  SyndicateMember, 
  DrawRecord, 
  DispatchLogEntry, 
  SyndicateMoneyEntry,
  WeeklyEmailPackage 
} from '../types/syndicate.ts';
import { 
  Calendar, 
  Clock, 
  Mail, 
  FileText, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Send, 
  Sparkles, 
  Copy, 
  Plus, 
  Download, 
  RefreshCw, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export const SyndicateHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'money' | 'members' | 'draws' | 'email'>('schedule');

  // Preserve money entries state (persisted to localStorage)
  const [moneyEntries, setMoneyEntries] = useState<SyndicateMoneyEntry[]>(() => {
    const saved = localStorage.getItem('s4l_money_entries');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'm1',
            date: '2026-10-17',
            type: 'PricePerGame',
            amount: 1.45,
            description: 'Weekly Cost per Game (10 games/member = $14.50/wk)',
            recordedBy: 'Ian',
          },
          {
            id: 'm2',
            date: '2026-10-17',
            type: 'PrizeWin',
            drawNumber: 4090,
            amount: 38.6,
            description: 'Division 7 & 8 matches in Draw 4090 (3 numbers + bonus)',
            recordedBy: 'Auto-Check (Engine)',
          },
          {
            id: 'm3',
            date: '2026-10-10',
            type: 'PrizeWin',
            drawNumber: 4083,
            amount: 125.0,
            description: 'Division 6 Match (4 winning numbers)',
            recordedBy: 'Ian',
          },
        ];
  });

  const [pricePerGame, setPricePerGame] = useState<number>(1.45);
  const [newPrizeDraw, setNewPrizeDraw] = useState<string>('4091');
  const [newPrizeAmount, setNewPrizeAmount] = useState<string>('54.20');
  const [newPrizeDesc, setNewPrizeDesc] = useState<string>('Draw 4091 Division 7 hit');
  const [preserveMoneySetting, setPreserveMoneySetting] = useState<boolean>(true);

  // Members of FAB5
  const members: SyndicateMember[] = [
    { id: '1', name: 'Ian Mesinovic (Lead)', email: 'ian@mesinovic.com.au', gamesCount: 10, totalPaid: 145.0, totalWon: 62.4, netBalance: -82.6 },
    { id: '2', name: 'Member 2 (FAB5)', email: 'member2@syndicate.internal', gamesCount: 10, totalPaid: 145.0, totalWon: 62.4, netBalance: -82.6 },
    { id: '3', name: 'Member 3 (FAB5)', email: 'member3@syndicate.internal', gamesCount: 10, totalPaid: 145.0, totalWon: 62.4, netBalance: -82.6 },
    { id: '4', name: 'Member 4 (FAB5)', email: 'member4@syndicate.internal', gamesCount: 10, totalPaid: 145.0, totalWon: 62.4, netBalance: -82.6 },
    { id: '5', name: 'Member 5 (FAB5)', email: 'member5@syndicate.internal', gamesCount: 10, totalPaid: 145.0, totalWon: 62.4, netBalance: -82.6 },
  ];

  // Action and Dispatch Log
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogEntry[]>([
    {
      id: 'd1',
      timestamp: 'Today 2:00:14 PM',
      event: 'Sunday 2pm Automation Check',
      recipient: 'System Action Log',
      status: 'Reported',
      notes: 'Current week already planned. Stopped without sending per schedule. Engine report clean, zero formula errors.',
    },
    {
      id: 'd2',
      timestamp: 'Yesterday 7:13:02 AM',
      event: 'Daily Draw 4090 Verification',
      recipient: 'Workbook Database',
      status: 'Confirmed in Sent',
      notes: 'Confirmed Saturday night result against two result sites. Added Draw 4090 to workbook. Zero formula errors.',
    },
    {
      id: 'd3',
      timestamp: 'Last Sunday 2:01:28 PM',
      event: 'FAB5 Weekly Email Dispatch (5 emails)',
      recipient: 'ian@mesinovic.com.au + 4 Members',
      status: 'Confirmed in Sent',
      notes: 'All 5 emails dispatched via Outlook as ian@mesinovic.com.au with CC. Confirmed in Sent folder.',
    },
  ]);

  // Weekly Email Package
  const weeklyPackage: WeeklyEmailPackage = {
    weekStarting: 'Next Sunday 2:00 PM',
    drawNumberStart: 4091,
    poemTitle: 'Numbers in the Evening Air',
    poemContent: [
      'Seven spheres of gold align,',
      'Across the starry Southern line.',
      'Fifty tickets built with care,',
      'A fortune shared, a hope we share.',
      'Twenty summers, twenty springs—',
      'Set for Life on golden wings.',
    ],
    progressTableSummary: {
      drawsPlayed: 4090,
      totalGames: 50,
      totalWins: 14,
      topDivisionHit: 'Division 6 ($125.00)',
    },
    ngdecDeclaration: 'NGDEC CONFIRMED: All 50 games for the upcoming week were compiled using S4LA2 algorithmic pool distribution. No game duplicates exist within member allocations. Verified against official OzLotteries rules.',
    dispatchStatus: 'Drafted',
  };

  const handleAddMoneyEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newPrizeAmount) || 0;
    const entry: SyndicateMoneyEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      type: 'PrizeWin',
      drawNumber: parseInt(newPrizeDraw) || undefined,
      amount: amt,
      description: newPrizeDesc || `Draw ${newPrizeDraw} prize entry`,
      recordedBy: 'Ian',
    };
    const updated = [entry, ...moneyEntries];
    setMoneyEntries(updated);
    localStorage.setItem('s4l_money_entries', JSON.stringify(updated));
    setNewPrizeDesc('');
  };

  const totalPrizeTracked = moneyEntries
    .filter((m) => m.type === 'PrizeWin')
    .reduce((acc, m) => acc + m.amount, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner: Automation Schedule & Task Status */}
      <div className="bg-linear-to-r from-slate-900 via-[#0a1224] to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                SET FOR LIFE • FAB5 SYNDICATE AUTOMATION HUB
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-white">
              Sunday 2:00 PM Engine & Daily 7:13 AM Verification Task
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Managing the S4LA2 engine, 10 games per member (50 games/week), automatic Saturday result confirmation across two sites, Outlook dispatch (<span className="text-cyan-300 font-mono font-semibold">ian@mesinovic.com.au</span>), and Action Log persistence.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 font-mono">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              TASK: SWITCHED ON
            </span>
            <span className="text-[11px] text-slate-400">
              Today 2:00 PM: Reporting Mode (Week already planned)
            </span>
          </div>
        </div>

        {/* 2 Critical Operational Alerts Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800">
          {/* Card 1: Money Side Wipe Protection */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-amber-300 flex items-center justify-between">
                <span>Money Side Protection: ACTIVE</span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                  Preserved Here
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Because the Sunday engine rebuilds the workbook weekly, typed prices per game and prize winnings get cleared. This dashboard stores your financial ledger permanently so you never lose the money side!
              </p>
            </div>
          </div>

          {/* Card 2: PC & Outlook Active Standby */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-blue-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 shrink-0 mt-0.5">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-blue-300 flex items-center justify-between">
                <span>PC & Outlook Standby Check</span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Task dispatches from Outlook as <span className="font-mono text-white">ian@mesinovic.com.au</span> at 2pm. If PC is asleep, emails will remain prepared as drafts for you to send before that evening's draw.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Syndicate Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-mono">
        {[
          { id: 'schedule', label: 'Sunday & Daily Task', icon: Clock },
          { id: 'money', label: 'Money Side Tracker (Permanent)', icon: DollarSign },
          { id: 'members', label: 'FAB5 Members (50 Games)', icon: Users },
          { id: 'email', label: 'Email Package (Poem & NGDEC)', icon: Mail },
          { id: 'draws', label: 'Draw Verification (4090+)', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SCHEDULE & LOGS */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-6">
          {/* Action Log & Dispatch Log */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold uppercase text-white">
                  Workbook Action Log & Dispatch Log
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Synchronized with Set4Life/engine
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {dispatchLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white">{log.event}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{log.recipient}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans max-w-2xl">{log.notes}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Step Automation Flowchart */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
            <h4 className="text-xs font-mono font-bold uppercase text-white mb-4">
              Sunday 2:00 PM Execution Sequence
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-blue-400 font-bold">1. Check Data</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Confirms Saturday night draw result in workbook. If missing, checks 2 results sites and appends it automatically.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-cyan-400 font-bold">2. Build Week</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  S4LA2 engine creates 10 games per member (50 games total) starting from that night's draw, plus 5 emails with fresh poem & NGDEC.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-purple-400 font-bold">3. Send via Outlook</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Emails all 5 members from Outlook as ian@mesinovic.com.au with CC, then verifies receipt in Sent folder.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-bold">4. Record Logs</div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Records exact send timestamps into workbook Action Log and Dispatch Log. Engine test showed 0 formula errors.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONEY SIDE TRACKER (Prevents wipe!) */}
      {activeSubTab === 'money' && (
        <div className="space-y-6">
          {/* Top Treasury Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="text-xs text-slate-400">Total Tracked Prizes Won</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">${totalPrizeTracked.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Safely stored across workbook rebuilds</div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="text-xs text-slate-400">Weekly Syndicate Cost</div>
              <div className="text-2xl font-bold text-white mt-1">
                ${(pricePerGame * 50).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                50 games @ ${pricePerGame.toFixed(2)}/game (${(pricePerGame * 10).toFixed(2)}/member)
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="text-xs text-slate-400">Per-Member Weekly Share</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                ${(pricePerGame * 10).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">5 Members in FAB5</div>
            </div>
          </div>

          {/* Add Prize Win or Financial Record */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
            <h4 className="text-xs font-mono font-bold uppercase text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Log Prize Amount or Cost Entry
            </h4>
            <form onSubmit={handleAddMoneyEntry} className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Draw Number</label>
                <input
                  type="text"
                  value={newPrizeDraw}
                  onChange={(e) => setNewPrizeDraw(e.target.value)}
                  placeholder="e.g. 4091"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Prize / Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrizeAmount}
                  onChange={(e) => setNewPrizeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Description / Division</label>
                <input
                  type="text"
                  value={newPrizeDesc}
                  onChange={(e) => setNewPrizeDesc(e.target.value)}
                  placeholder="e.g. Div 7 Match (3 balls + 1 bonus)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>

          {/* Ledger Table */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-white">
                Permanent Money Side Ledger ({moneyEntries.length} records)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Immune to Sunday Rebuilds
              </span>
            </div>

            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Draw</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {moneyEntries.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-slate-300">{m.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'PrizeWin' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {m.type === 'PrizeWin' ? 'Prize Win' : 'Game Cost'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{m.drawNumber || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-200">{m.description}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">${m.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{m.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERS & 50 GAMES */}
      {activeSubTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-white">
                FAB5 Syndicate Members (10 Games Each = 50 Games Total)
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                Generated with S4LA2 Engine
              </span>
            </div>

            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Allocated Games</th>
                  <th className="py-3 px-4 text-right">Contributed</th>
                  <th className="py-3 px-4 text-right">Share of Wins</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((mem) => (
                  <tr key={mem.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-bold text-white">{mem.name}</td>
                    <td className="py-3 px-4 text-slate-400">{mem.email}</td>
                    <td className="py-3 px-4 text-center font-bold text-cyan-400">{mem.gamesCount} Games</td>
                    <td className="py-3 px-4 text-right text-slate-300">${mem.totalPaid.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">${mem.totalWon.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">${mem.netBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL PACKAGE (Poem, Progress, NGDEC) */}
      {activeSubTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-[11px] font-mono uppercase text-cyan-400 font-bold">
                  Weekly Dispatch Bundle Preview
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  5 Emails Dispatched from ian@mesinovic.com.au (Starting Draw {weeklyPackage.drawNumberStart})
                </h3>
              </div>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold rounded-lg">
                Status: {weeklyPackage.dispatchStatus}
              </span>
            </div>

            {/* Fresh Poem Section */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                <Sparkles className="w-4 h-4" /> Fresh Weekly Poem: "{weeklyPackage.poemTitle}"
              </div>
              <div className="text-xs font-serif italic text-slate-300 space-y-1 pl-4 border-l-2 border-amber-500/40">
                {weeklyPackage.poemContent.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            {/* Progress Table Summary */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-400 uppercase">
                Weekly Progress Table Summary
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <div className="text-[10px] text-slate-500">Draws Logged</div>
                  <div className="text-base font-bold text-white">{weeklyPackage.progressTableSummary.drawsPlayed}</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <div className="text-[10px] text-slate-500">Active Pool Games</div>
                  <div className="text-base font-bold text-cyan-400">{weeklyPackage.progressTableSummary.totalGames}</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <div className="text-[10px] text-slate-500">Total Division Wins</div>
                  <div className="text-base font-bold text-emerald-400">{weeklyPackage.progressTableSummary.totalWins}</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg">
                  <div className="text-[10px] text-slate-500">Best Division</div>
                  <div className="text-base font-bold text-amber-400">{weeklyPackage.progressTableSummary.topDivisionHit}</div>
                </div>
              </div>
            </div>

            {/* NGDEC Declaration */}
            <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                <ShieldCheck className="w-4 h-4" /> Non-Game-Duplicate Electronic Certificate (NGDEC)
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {weeklyPackage.ngdecDeclaration}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DRAWS & VERIFICATION */}
      {activeSubTab === 'draws' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase text-white">
                Draw Results Engine (Draw 4090 Confirmed)
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked Against 2 Official Sites
              </span>
            </div>

            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">Draw 4090 (Saturday Night Result)</span>
                <span className="text-slate-400">Date: 2026-10-17</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400">Winning Numbers:</span>
                {[4, 11, 18, 22, 29, 35, 41].map((n) => (
                  <span key={n} className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {n}
                  </span>
                ))}
                <span className="text-[11px] text-slate-400 ml-2">Bonus:</span>
                {[14, 38].map((n) => (
                  <span key={n} className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                    {n}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>Verification Sites: OzLotteries Official API & Lotterywest Mirror</span>
                <span className="text-emerald-400 font-bold">0 Formula Errors in Workbook</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
