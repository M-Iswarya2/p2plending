import React, { useEffect, useState } from "react";
import { getContract } from "../contracts/contract";
import { formatEther } from "ethers";

export default function BorrowerLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLoans = async () => {
    try {
      const contract = await getContract();
      if (!contract) return;

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const [account] = await window.ethereum.request({ method: "eth_accounts" });

      const all = await contract.getAllLoans();
      const mine = all.filter((loan) => loan.borrower.toLowerCase() === account.toLowerCase());
      setLoans(mine);
    } catch (err) {
      console.error("Error fetching borrower's loans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return "#f59e0b"; // amber for requested
      case 1: return "#10b981"; // green for funded
      case 2: return "#3b82f6"; // blue for repaid
      default: return "#6b7280"; // gray
    }
  };

  const getStatusBadge = (status) => {
    const statusText = ["Requested", "Funded", "Repaid"][status];
    const color = getStatusColor(status);
    
    return (
      <span style={{
        backgroundColor: color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {statusText}
      </span>
    );
  };

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
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    emptyText: {
      fontSize: '16px',
      color: '#6b7280'
    },
    loansGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px',
      marginTop: '24px'
    },
    loanCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    },
    loanCardHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
    },
    loanHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    loanId: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937'
    },
    loanAmount: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#059669',
      marginBottom: '16px'
    },
    ethLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '400'
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
    },
    refreshButtonHover: {
      backgroundColor: '#2563eb',
      transform: 'translateY(-1px)'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>
        📊 My Loan Portfolio
      </h1>
      <p style={styles.subtitle}>
        Track and manage all your active loans in one place
      </p>

      <button 
        style={styles.refreshButton}
        onClick={fetchMyLoans}
        onMouseEnter={(e) => {
          Object.assign(e.target.style, styles.refreshButtonHover);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.target.style, styles.refreshButton);
        }}
      >
        🔄 Refresh Loans
      </button>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading your loans...</p>
        </div>
      ) : loans.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💰</div>
          <h3 style={styles.emptyTitle}>No Loans Found</h3>
          <p style={styles.emptyText}>
            You haven't taken any loans yet. Start by requesting a loan to see it here.
          </p>
        </div>
      ) : (
        <div style={styles.loansGrid}>
          {loans.map((loan, idx) => (
            <div 
              key={idx} 
              style={styles.loanCard}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, {
                  ...styles.loanCard,
                  ...styles.loanCardHover
                });
              }}
              onMouseLeave={(e) => {
                Object.assign(e.target.style, styles.loanCard);
              }}
            >
              <div style={styles.loanHeader}>
                <span style={styles.loanId}>
                  Loan #{loan.id.toString()}
                </span>
                {getStatusBadge(loan.status)}
              </div>
              
              <div style={styles.loanAmount}>
                {formatEther(loan.amount)} <span style={styles.ethLabel}>ETH</span>
              </div>
              
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                borderTop: '1px solid #f3f4f6',
                paddingTop: '16px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Status:</span>
                  <span style={{ fontWeight: '600', color: getStatusColor(loan.status) }}>
                    {["Requested", "Funded", "Repaid"][loan.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Loan ID:</span>
                  <span style={{ fontWeight: '600', color: '#374151' }}>
                    {loan.id.toString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}