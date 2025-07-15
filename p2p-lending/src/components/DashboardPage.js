import React, { useEffect, useState } from "react";
import { getContract } from "../contracts/contract";
import { formatEther } from "ethers";

export default function DashboardPage({ role }) {
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState(null);
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);

  const retryFetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        setError("Please install MetaMask");
        return;
      }

      const contract = await getContract();
      if (!contract) {
        setError("Contract connection failed");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setError("Connect your wallet");
        return;
      }

      const currentUserAddress = accounts[0];
      setUserAddress(currentUserAddress);

      const loans = await contract.getAllLoans();

      const filteredLoans = loans.filter((loan) =>
        role === "lender"
          ? loan.lender?.toLowerCase() === currentUserAddress.toLowerCase()
          : loan.borrower?.toLowerCase() === currentUserAddress.toLowerCase()
      );

      const totalLoans = filteredLoans.length;
      const activeLoans = filteredLoans.filter((loan) => Number(loan.status) === 1).length;
      const repaidLoans = filteredLoans.filter((loan) => Number(loan.status) === 2).length;
      const defaultedLoans = filteredLoans.filter((loan) => Number(loan.status) === 3).length;
      const pendingLoans = filteredLoans.filter((loan) => Number(loan.status) === 0).length;

      const totalAmount = filteredLoans.reduce((sum, loan) => sum + Number(loan.amount), 0);
      const activeAmount = filteredLoans
        .filter((loan) => Number(loan.status) === 1)
        .reduce((sum, loan) => sum + Number(loan.amount), 0);

      let earnings = 0;
      if (role === "lender") {
        earnings = filteredLoans
          .filter((loan) => Number(loan.status) === 2)
          .reduce((sum, loan) => {
            const principal = Number(loan.amount);
            const rate = Number(loan.interestRate);
            const duration = Number(loan.duration);
            const interest = (principal * rate * duration) / (100 * 12);
            return sum + interest;
          }, 0);
      }

      const totalInstallments = filteredLoans.reduce((sum, loan) => sum + Number(loan.duration), 0);
      const paidInstallments = filteredLoans.reduce((sum, loan) => sum + Number(loan.installmentsPaid), 0);

      setStats({
        totalLoans,
        activeLoans,
        repaidLoans,
        defaultedLoans,
        pendingLoans,
        totalAmount: totalAmount.toFixed(4),
        activeAmount: activeAmount.toFixed(4),
        earnings: earnings.toFixed(4),
        successRate: totalLoans > 0 ? ((repaidLoans / totalLoans) * 100).toFixed(1) : 0,
        totalInstallments,
        paidInstallments,
        installmentProgress: totalInstallments > 0 ? ((paidInstallments / totalInstallments) * 100).toFixed(1) : 0,
      });

    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    retryFetchData();
  }, [role]);

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      padding: '0 8px'
    },
    headerTitle: {
      fontSize: '36px',
      fontWeight: '800',
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    roleChip: {
      backgroundColor: role === 'lender' ? '#10b981' : '#3b82f6',
      color: 'white',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      textTransform: 'capitalize'
    },
    refreshButton: {
      backgroundColor: '#6366f1',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 20px',
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '1px solid #e2e8f0'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #6366f1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    },
    errorContainer: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      color: '#dc2626'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    },
    metricCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    metricCardHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
    },
    metricIcon: {
      fontSize: '32px',
      marginBottom: '12px',
      display: 'block'
    },
    metricValue: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: '4px',
      lineHeight: '1'
    },
    metricLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    metricSubValue: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px'
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '1px solid #e2e8f0'
    },
    chartTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '20px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#10b981',
      transition: 'width 0.5s ease',
      borderRadius: '4px'
    },
    progressText: {
      fontSize: '14px',
      color: '#64748b',
      textAlign: 'center'
    },
    donutChart: {
      width: '200px',
      height: '200px',
      margin: '0 auto',
      position: 'relative'
    },
    donutCenter: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center'
    },
    donutCenterValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b'
    },
    donutCenterLabel: {
      fontSize: '12px',
      color: '#64748b',
      textTransform: 'uppercase'
    },
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '16px',
      flexWrap: 'wrap'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#64748b'
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '2px'
    },
    addressCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      border: '1px solid #e2e8f0'
    },
    addressLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '500',
      marginBottom: '8px'
    },
    addressValue: {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#1e293b',
      backgroundColor: '#f8fafc',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0'
    }
  };

  const createDonutChart = (data, colors) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let cumulativePercentage = 0;
    const radius = 80;
    const strokeWidth = 16;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${percentage * 5.03} ${500 - percentage * 5.03}`;
          const strokeDashoffset = -cumulativePercentage * 5.03;
          cumulativePercentage += percentage;

          return (
            <circle
              key={index}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={colors[index]}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            Connection Error
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>{error}</p>
          <button
            onClick={retryFetchData}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const loanStatusData = [
    { label: 'Active', value: stats.activeLoans },
    { label: 'Repaid', value: stats.repaidLoans },
    { label: 'Defaulted', value: stats.defaultedLoans },
    { label: 'Pending', value: stats.pendingLoans }
  ];

  const loanStatusColors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            {role === 'lender' ? '💰' : '📊'} Dashboard
            <span style={styles.roleChip}>{role}</span>
          </h1>
        </div>
        <button
          style={styles.refreshButton}
          onClick={retryFetchData}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#4f46e5';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#6366f1';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div
          style={styles.metricCard}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, styles.metricCardHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.metricCard);
          }}
        >
          <span style={styles.metricIcon}>📊</span>
          <div style={styles.metricValue}>{stats.totalLoans}</div>
          <div style={styles.metricLabel}>Total Loans</div>
          <div style={styles.metricSubValue}>
            {stats.activeLoans} active • {stats.repaidLoans} completed
          </div>
        </div>

        <div
          style={styles.metricCard}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, styles.metricCardHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.metricCard);
          }}
        >
          <span style={styles.metricIcon}>💎</span>
          <div style={styles.metricValue}>{stats.totalAmount}</div>
          <div style={styles.metricLabel}>Total Volume (ETH)</div>
          <div style={styles.metricSubValue}>
            {stats.activeAmount} ETH currently active
          </div>
        </div>

        <div
          style={styles.metricCard}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, styles.metricCardHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.metricCard);
          }}
        >
          <span style={styles.metricIcon}>📈</span>
          <div style={styles.metricValue}>{stats.successRate}%</div>
          <div style={styles.metricLabel}>Success Rate</div>
          <div style={styles.metricSubValue}>
            {stats.repaidLoans} out of {stats.totalLoans} loans
          </div>
        </div>

        {role === 'lender' && (
          <div
            style={styles.metricCard}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, styles.metricCardHover);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, styles.metricCard);
            }}
          >
            <span style={styles.metricIcon}>💰</span>
            <div style={styles.metricValue}>{stats.earnings}</div>
            <div style={styles.metricLabel}>Total Earnings (ETH)</div>
            <div style={styles.metricSubValue}>
              Interest from completed loans
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Loan Status Distribution</h3>
          <div style={styles.donutChart}>
            {createDonutChart(loanStatusData, loanStatusColors)}
            <div style={styles.donutCenter}>
              <div style={styles.donutCenterValue}>{stats.totalLoans}</div>
              <div style={styles.donutCenterLabel}>Total Loans</div>
            </div>
          </div>
          <div style={styles.legend}>
            {loanStatusData.map((item, index) => (
              <div key={index} style={styles.legendItem}>
                <div
                  style={{
                    ...styles.legendColor,
                    backgroundColor: loanStatusColors[index]
                  }}
                ></div>
                <span>{item.label}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Payment Progress</h3>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#1e293b' }}>
              {stats.installmentProgress}%
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {stats.paidInstallments} of {stats.totalInstallments} installments
            </div>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${stats.installmentProgress}%`
              }}
            ></div>
          </div>
          <div style={styles.progressText}>
            Payment completion rate across all loans
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div style={styles.addressCard}>
        <div style={styles.addressLabel}>Connected Wallet Address</div>
        <div style={styles.addressValue}>{userAddress}</div>
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