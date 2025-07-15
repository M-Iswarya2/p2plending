import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { formatEther } from "ethers";

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

      const allLoans = await contract.getAllLoans();
      const loansWithId = allLoans.map((loan, index) => ({
        ...loan,
        id: loan.id?.toString() || (index + 1).toString()
      }));

      const userLoans = loansWithId.filter(
        loan => loan.borrower.toLowerCase() === currentUserAddress.toLowerCase()
      );

      setCreditHistory(userLoans);

      try {
        const score = await contract.getCreditScore(currentUserAddress);
        setCreditScore(Number(score));
      } catch {
        setCreditScore(calculateCreditScore(userLoans));
      }

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
    if (score >= 750) return "#4CAF50";
    if (score >= 650) return "#2196F3";
    if (score >= 550) return "#ff8800";
    if (score > 0) return "#ff4444";
    return "#666";
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
    repaidLoans: creditHistory.filter(loan => Number(loan.status) === 2).length,
    activeLoans: creditHistory.filter(loan => Number(loan.status) === 1).length,
    defaultedLoans: creditHistory.filter(loan => Number(loan.status) === 3).length,
    totalBorrowed: creditHistory.reduce((sum, loan) => sum + parseFloat(formatEther(loan.amount)), 0).toFixed(4),
    repaymentRate: creditHistory.length > 0 ? ((creditHistory.filter(loan => Number(loan.status) === 2).length / creditHistory.length) * 100).toFixed(1) : 0
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

  if (loading) return <div style={styles.section}><h2>Loading...</h2></div>;

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📊 Credit Assessment</h2>

      {error && (
        <div style={{ padding: "15px", backgroundColor: "#f8d7da", borderRadius: "5px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div style={{
        ...styles.card,
        marginBottom: "25px",
        textAlign: "center",
        background: `linear-gradient(135deg, ${getCreditScoreColor(creditScore)}15, ${getCreditScoreColor(creditScore)}05)`,
        border: `2px solid ${getCreditScoreColor(creditScore)}`
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: getCreditScoreColor(creditScore) }}>Your Credit Score</h3>
        <div style={{ fontSize: "48px", fontWeight: "bold", color: getCreditScoreColor(creditScore) }}>
          {creditScore}
        </div>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: getCreditScoreColor(creditScore) }}>
          {getCreditScoreLabel(creditScore)}
        </div>
      </div>

      <div style={styles.card}>
        <h3>📋 Summary</h3>
        <p>Total Loans: {metrics.totalLoans}</p>
        <p>Repaid Loans: {metrics.repaidLoans}</p>
        <p>Active Loans: {metrics.activeLoans}</p>
        <p>Defaulted Loans: {metrics.defaultedLoans}</p>
        <p>Total Borrowed: {metrics.totalBorrowed} ETH</p>
        <p>Repayment Rate: {metrics.repaymentRate}%</p>
      </div>

      <div style={styles.card}>
        <h3>💡 Credit Tips</h3>
        <ul>
          {creditTips.map((tip, i) => <li key={i}>{tip}</li>)}
        </ul>
      </div>

      {creditHistory.length > 0 && (
        <div style={styles.card}>
          <h3>📝 Recent Loans</h3>
          {creditHistory.slice(0, 3).map((loan, index) => {
            const status = Number(loan.status);
            const statusInfo = {
              0: { text: "Pending", color: "#999" },
              1: { text: "Funded", color: "#2196F3" },
              2: { text: "Repaid", color: "#4CAF50" },
              3: { text: "Defaulted", color: "#ff4444" }
            };
            const info = statusInfo[status] || { text: "Unknown", color: "#666" };

            return (
              <div key={index} style={{ marginBottom: "10px", padding: "10px", borderLeft: `5px solid ${info.color}`, backgroundColor: "#f9f9f9", borderRadius: "5px" }}>
                <strong>ID:</strong> {loan.id?.toString() || "N/A"}<br />
                <strong>Amount:</strong> {parseFloat(formatEther(loan.amount)).toFixed(4)} ETH<br />
                <strong>Status:</strong> <span style={{ color: info.color }}>{info.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "15px", fontSize: "12px", color: "#999" }}>
        <strong>Your address:</strong> {userAddress || "Not connected"}
      </div>
    </div>
  );
}
