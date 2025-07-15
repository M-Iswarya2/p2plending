import React, { useEffect, useState } from "react";
import { getContract } from "../contracts/contract";

export default function CreditAssessmentPage() {
  const [creditScore, setCreditScore] = useState(0);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [error, setError] = useState(null);

  const calculateCreditScore = (loans) => {
    if (loans.length === 0) return 0;
    const repaidLoans = loans.filter(loan => Number(loan.status) === 2).length;
    const defaultedLoans = loans.filter(loan => Number(loan.status) === 3).length;
    let score = 300 + (repaidLoans / loans.length) * 400;
    if (loans.length >= 5) score += 50;
    score -= defaultedLoans * 100;
    return Math.max(0, Math.min(1000, Math.floor(score)));
  };

  const fetchCreditData = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask");
        return;
      }

      const contract = await getContract();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const currentUserAddress = accounts[0];
      setUserAddress(currentUserAddress);

      const allLoans = await contract.getBorrowerLoans(currentUserAddress);
      const loansWithParsed = allLoans.map((loan, index) => ({
        ...loan,
        id: index + 1,
        amount: parseFloat(loan.amount.toString()),
        monthlyPayment: parseFloat(loan.monthlyPayment.toString()),
        totalAmountDue: parseFloat(loan.totalAmountDue.toString()),
        status: Number(loan.status)
      }));

      setCreditHistory(loansWithParsed);

      // Prefer frontend calculation for accurate score
      const score = calculateCreditScore(loansWithParsed);
      setCreditScore(score);

    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, []);

  const getCreditScoreColor = (score) => {
    if (score >= 750) return "#10b981";
    if (score >= 650) return "#3b82f6";
    if (score >= 550) return "#f59e0b";
    if (score > 0) return "#ef4444";
    return "#6b7280";
  };

  const getCreditScoreLabel = (score) => {
    if (score >= 750) return "Excellent";
    if (score >= 650) return "Good";
    if (score >= 550) return "Fair";
    if (score > 0) return "Poor";
    return "No History";
  };

  const metrics = {
    totalLoans: creditHistory.length,
    repaidLoans: creditHistory.filter(loan => loan.status === 2).length,
    activeLoans: creditHistory.filter(loan => loan.status === 1).length,
    defaultedLoans: creditHistory.filter(loan => loan.status === 3).length,
    totalBorrowed: creditHistory.reduce((sum, loan) => sum + loan.amount, 0).toFixed(4),
    repaymentRate: creditHistory.length > 0 ? ((creditHistory.filter(loan => loan.status === 2).length / creditHistory.length) * 100).toFixed(1) : 0
  };

  const creditTips = creditScore >= 750 ? [
    "🌟 Excellent credit! You get the best rates",
    "🔄 Keep making timely repayments"
  ] : creditScore >= 650 ? [
    "👍 Good credit! Focus on timely payments",
    "📊 Avoid taking too many loans at once"
  ] : creditScore >= 550 ? [
    "⚠️ Fair credit - room for improvement",
    "🎯 Repay all loans on time"
  ] : creditScore > 0 ? [
    "🚨 Poor credit - repay loans immediately",
    "🔧 Start with small loans to rebuild"
  ] : [
    "🆕 No history - take a small loan to start",
    "🎯 Focus on your first payment"
  ];

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '32px'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    },
    errorAlert: {
      padding: '16px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#dc2626',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    creditScoreCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden'
    },
    creditScoreNumber: {
      fontSize: '64px',
      fontWeight: '800',
      margin: '16px 0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    creditScoreLabel: {
      fontSize: '20px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '16px'
    },
    metric: {
      textAlign: 'center',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '4px'
    },
    metricLabel: {
      fontSize: '12px',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    tipsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    tipItem: {
      padding: '12px 0',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      color: '#374151'
    },
    loanHistoryItem: {
      padding: '16px',
      marginBottom: '12px',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderLeft: '4px solid',
      transition: 'all 0.2s ease'
    },
    loanHistoryHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    loanId: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      color: 'white'
    },
    loanAmount: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#059669'
    },
    addressFooter: {
      marginTop: '32px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      color: '#6b7280',
      fontFamily: 'monospace'
    },
    refreshButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      marginBottom: '24px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Analyzing your credit profile...</p>
        </div>
      </div>
    );
  }

  const statusMap = {
    0: { text: "Requested", color: "#f59e0b" },
    1: { text: "Funded", color: "#3b82f6" },
    2: { text: "Repaid", color: "#10b981" },
    3: { text: "Defaulted", color: "#ef4444" },
    4: { text: "Removed", color: "#6b7280" }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>
        📊 Credit Assessment
      </h1>
      <p style={styles.subtitle}>
        Comprehensive analysis of your borrowing history and creditworthiness
      </p>

      <button 
        style={styles.refreshButton}
        onClick={fetchCreditData}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2563eb';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#3b82f6';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        🔄 Refresh Assessment
      </button>

      {error && (
        <div style={styles.errorAlert}>
          ⚠️ {error}
        </div>
      )}

      {/* Credit Score Card */}
      <div style={{
        ...styles.creditScoreCard,
        background: `linear-gradient(135deg, ${getCreditScoreColor(creditScore)}15, ${getCreditScoreColor(creditScore)}05)`
      }}>
        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: '600' }}>
          Your Credit Score
        </h2>
        <div style={{
          ...styles.creditScoreNumber,
          color: getCreditScoreColor(creditScore)
        }}>
          {creditScore}
        </div>
        <div style={{
          ...styles.creditScoreLabel,
          color: getCreditScoreColor(creditScore)
        }}>
          {getCreditScoreLabel(creditScore)}
        </div>
        
        {/* Progress Bar */}
        <div style={{
          marginTop: '24px',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(creditScore / 1000) * 100}%`,
            backgroundColor: getCreditScoreColor(creditScore),
            transition: 'width 0.5s ease'
          }}></div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <span>0</span>
          <span>1000</span>
        </div>
      </div>

      <div style={styles.gridContainer}>
        {/* Metrics Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📈 Credit Metrics</h3>
          <div style={styles.metricsGrid}>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{metrics.totalLoans}</div>
              <div style={styles.metricLabel}>Total Loans</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{metrics.repaidLoans}</div>
              <div style={styles.metricLabel}>Repaid</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{metrics.activeLoans}</div>
              <div style={styles.metricLabel}>Active</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{metrics.defaultedLoans}</div>
              <div style={styles.metricLabel}>Defaulted</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{metrics.totalBorrowed}</div>
              <div style={styles.metricLabel}>Total ETH</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>{metrics.repaymentRate}%</div>
              <div style={styles.metricLabel}>Repayment Rate</div>
            </div>
          </div>
        </div>

        {/* Credit Tips Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💡 Credit Tips</h3>
          <ul style={styles.tipsList}>
            {creditTips.map((tip, idx) => (
              <li key={idx} style={styles.tipItem}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Loan History */}
      {creditHistory.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📝 Recent Loan History</h3>
          {creditHistory.slice(0, 5).map((loan, idx) => {
            const statusInfo = statusMap[loan.status] || { text: "Unknown", color: "#6b7280" };
            return (
              <div
                key={idx}
                style={{
                  ...styles.loanHistoryItem,
                  borderLeftColor: statusInfo.color
                }}
              >
                <div style={styles.loanHistoryHeader}>
                  <span style={styles.loanId}>Loan #{loan.id}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: statusInfo.color
                  }}>
                    {statusInfo.text}
                  </span>
                </div>
                <div style={styles.loanAmount}>
                  {loan.amount.toFixed(4)} ETH
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Address Footer */}
      <div style={styles.addressFooter}>
        <strong>Connected Address:</strong> {userAddress}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}