import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { formatEther } from "ethers";

export default function RepaymentReportsPage() {
  const [myLendingHistory, setMyLendingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter] = useState("all"); // all, repaid, active, overdue

  const fetchMyLendingHistory = async () => {
    try {
      const contract = await getContract();
      if (!contract) {
        console.error("❌ Contract not available");
        return;
      }

      if (!window.ethereum) {
        alert("Please install MetaMask to use this feature.");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        alert("Please connect your MetaMask wallet.");
        return;
      }

      const userAddress = accounts[0].toLowerCase();
      const allLoans = await contract.getAllLoans();

      const myLoans = allLoans.filter(
        (loan) => loan.lender?.toLowerCase() === userAddress && loan.id !== undefined
      );

      setMyLendingHistory(myLoans);
    } catch (err) {
      console.error("❌ Error loading lending history:", err);
      alert("Could not load lending history. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLendingHistory();
  }, []);

  const calculateLoanDetails = (loan) => {
    const principalAmount = parseFloat(formatEther(loan.amount));
    const interestRate = Number(loan.interest);
    const interestAmount = (principalAmount * interestRate) / 100;
    const totalDueAmount = principalAmount + interestAmount;

    return {
      principalFormatted: principalAmount.toFixed(6),
      interestFormatted: interestAmount.toFixed(6),
      totalDueFormatted: totalDueAmount.toFixed(6)
    };
  };

  const getLoanStatus = (loan) => {
    const status = Number(loan.status);
    switch (status) {
      case 0:
        return { text: "Pending", color: "#ff8800", icon: "⏳" };
      case 1:
        return { text: "Funded", color: "#2196F3", icon: "✅" };
      case 2:
        return { text: "Repaid", color: "#4CAF50", icon: "💰" };
      case 3:
        return { text: "Defaulted", color: "#ff4444", icon: "❌" };
      default:
        return { text: "Unknown", color: "#888", icon: "❓" };
    }
  };

  const isLoanOverdue = (loan) => {
    if (Number(loan.status) === 2) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    const loanDeadline = Number(loan.timestamp) + Number(loan.duration);
    return currentTime > loanDeadline && Number(loan.status) === 1;
  };

  const getFilteredLoans = () => {
    switch (filter) {
      case "repaid":
        return myLendingHistory.filter(loan => Number(loan.status) === 2);
      case "active":
        return myLendingHistory.filter(loan => Number(loan.status) === 1);
      case "overdue":
        return myLendingHistory.filter(loan => isLoanOverdue(loan));
      default:
        return myLendingHistory;
    }
  };

  const filteredLoans = getFilteredLoans();

  const getStats = () => {
    const totalLoans = myLendingHistory.length;
    const repaidLoans = myLendingHistory.filter(loan => Number(loan.status) === 2).length;
    const activeLoans = myLendingHistory.filter(loan => Number(loan.status) === 1).length;
    const overdueLoans = myLendingHistory.filter(loan => isLoanOverdue(loan)).length;

    const totalLent = myLendingHistory.reduce((sum, loan) => {
      return sum + parseFloat(formatEther(loan.amount));
    }, 0);

    const totalRepaid = myLendingHistory
      .filter(loan => Number(loan.status) === 2)
      .reduce((sum, loan) => {
        const details = calculateLoanDetails(loan);
        return sum + parseFloat(details.totalDueFormatted);
      }, 0);

    return {
      totalLoans,
      repaidLoans,
      activeLoans,
      overdueLoans,
      totalLent: totalLent.toFixed(4),
      totalRepaid: totalRepaid.toFixed(4),
      repaymentRate: totalLoans > 0 ? ((repaidLoans / totalLoans) * 100).toFixed(1) : 0
    };
  };

  const stats = getStats();

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📊 Repayment Reports</h2>
      <p style={{ marginBottom: "20px" }}>Track repayments from your borrowers and monitor your lending performance.</p>

      {loading ? (
        <p>Loading your lending history...</p>
      ) : (
        <>
          {/* Statistics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "25px" }}>
            {/* Cards */}
            <div style={{ ...styles.card, textAlign: "center", padding: "15px" }}>
              <h3 style={{ margin: 0, color: "#2196F3" }}>Total Loans</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.totalLoans}</p>
            </div>
            <div style={{ ...styles.card, textAlign: "center", padding: "15px" }}>
              <h3 style={{ margin: 0, color: "#4CAF50" }}>Repaid</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.repaidLoans}</p>
            </div>
            <div style={{ ...styles.card, textAlign: "center", padding: "15px" }}>
              <h3 style={{ margin: 0, color: "#ff8800" }}>Active</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.activeLoans}</p>
            </div>
            <div style={{ ...styles.card, textAlign: "center", padding: "15px" }}>
              <h3 style={{ margin: 0, color: "#ff4444" }}>Overdue</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.overdueLoans}</p>
            </div>
          </div>

          {/* Loans List */}
          {filteredLoans.length === 0 ? (
            <div style={styles.card}><p>No loans found for the selected filter.</p></div>
          ) : (
            <div>
              <h3 style={{ marginBottom: "15px" }}>
                {filter === "all" ? "All Loans" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Loans`} 
                ({filteredLoans.length})
              </h3>
              {filteredLoans.map((loan, index) => {
                const status = getLoanStatus(loan);
                return (
                  <div key={index} style={{ ...styles.card, marginBottom: "15px", border: `2px solid ${status.color}`, borderLeft: `6px solid ${status.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{ fontSize: "20px", marginRight: "8px" }}>{status.icon}</span>
                          <h4 style={{ margin: 0, color: status.color }}>
                            Loan ID: {loan.id ? loan.id.toString() : "N/A"} - {status.text}
                          </h4>
                        </div>
                        {/* Loan Details */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}