export interface SyndicateMember {
  id: string;
  name: string;
  email: string;
  gamesCount: number; // 10 games each
  totalPaid: number;
  totalWon: number;
  netBalance: number;
}

export interface DrawRecord {
  drawNumber: number;
  date: string;
  winningNumbers: number[];
  bonusNumbers: number[];
  verifiedSites: string[];
  totalPrizeWon: number;
}

export interface DispatchLogEntry {
  id: string;
  timestamp: string;
  event: string;
  recipient: string;
  status: 'Sent' | 'Confirmed in Sent' | 'Pending' | 'Reported';
  notes: string;
}

export interface SyndicateMoneyEntry {
  id: string;
  date: string;
  type: 'PricePerGame' | 'PrizeWin' | 'MemberContribution' | 'Distribution';
  drawNumber?: number;
  amount: number;
  description: string;
  recordedBy: string;
}

export interface WeeklyEmailPackage {
  weekStarting: string;
  drawNumberStart: number;
  poemTitle: string;
  poemContent: string[];
  progressTableSummary: {
    drawsPlayed: number;
    totalGames: number;
    totalWins: number;
    topDivisionHit: string;
  };
  ngdecDeclaration: string;
  dispatchStatus: 'Drafted' | 'Sent' | 'Confirmed In Sent';
}
