import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import {parseEther } from "ethers";

export default function FundLoanPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAvailableLoans = async () => {
    try {
      const contract = await getContract();
      if (!contract) return;

      const rawLoans = await contract.getAvailableLoans();

      const filtered = rawLoans
        .map((loan, i) => ({
          id: loan.id?.toString() || (i + 1).toString(),
          borrower: loan.borrower,
          // FIXED: Contract stores amount as ETH number, convert to string for display
          amount: Number(loan.amount).toString(), // Keep as ETH number
          amountETH: Number(loan.amount).toString(), // Display amount in ETH
          interestRate: loan.interestRate?.toString() || "0",
          duration: loan.duration?.toString() || "0",
          monthlyPayment: Number(loan.monthlyPayment).toString(),
          totalAmountDue: Number(loan.totalAmountDue).toString(),
          status: Number(loan.status)
        }))
        .filter((loan) => loan.status === 0 && Number(loan.amount) > 0); // only Requested loans

      setLoans(filtered);
    } catch (err) {
      console.error("Error fetching available loans:", err);
      setError("Could not load available loans.");
    } finally {
      setLoading(false);
    }
  };

  const fundLoan = async (loanId, amountInEth) => {
    try {
      const contract = await getContract();
      if (!contract) return;

      await window.ethereum.request({ method: "eth_requestAccounts" });

      // FIXED: Convert ETH amount to wei for the transaction
      // Contract expects exact amount in wei as msg.value
      const amountInWei = parseEther(amountInEth.toString());
      
      console.log("Funding loan:", {
        loanId,
        amountInEth: amountInEth + " ETH",
        amountInWei: amountInWei.toString() + " wei"
      });

      const tx = await contract.fundLoan(loanId, { value: amountInWei });
      await tx.wait();

      alert("✅ Loan funded successfully!");
      fetchAvailableLoans();
    } catch (err) {
      console.error("❌ Funding error:", err);
      alert("Error funding loan: " + (err?.reason || err?.message || "Unknown error"));
    }
  };

  // FIXED: Calculate loan details for display
  const calculateLoanDetails = (loan) => {
    const principal = Number(loan.amount);
    const rate = Number(loan.interestRate);
    const months = Number(loan.duration);
    
    // Simple interest calculation matching contract
    const totalInterest = (principal * rate * months) / (100 * 12);
    const totalAmount = principal + totalInterest;
    const monthlyPayment = totalAmount / months;
    
    return {
      totalInterest: totalInterest.toFixed(4),
      totalAmount: totalAmount.toFixed(4),
      monthlyPayment: monthlyPayment.toFixed(4)
    };
  };

  useEffect(() => {
    fetchAvailableLoans();
  }, []);

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📢 Fund Available Loans</h2>

      {loading && <p>Loading available loans...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && loans.length === 0 && (
        <p>No loans available for funding.<br />If a borrower just submitted, wait a moment for it to sync.</p>
      )}

      {loans.map((loan) => {
        const loanDetails = calculateLoanDetails(loan);
        
        return (
          <div
            key={loan.id}
            style={{
              padding: "20px",
              marginBottom: "20px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              background: "#f8fafc",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#1e293b" }}>
              💰 Loan #{loan.id}
            </h3>
            
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Borrower:</strong> {loan.borrower}
              </p>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Principal Amount:</strong> {loan.amountETH} ETH
              </p>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Interest Rate:</strong> {loan.interestRate}% per year
              </p>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Duration:</strong> {loan.duration} months
              </p>
            </div>

            <div style={{
              padding: "12px",
              backgroundColor: "#e0f2fe",
              borderRadius: "6px",
              marginBottom: "15px"
            }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#0369a1" }}>
                📊 Loan Details
              </h4>
              <p style={{ margin: "3px 0", fontSize: "14px", color: "#0369a1" }}>
                <strong>Monthly Payment:</strong> {loanDetails.monthlyPayment} ETH
              </p>
              <p style={{ margin: "3px 0", fontSize: "14px", color: "#0369a1" }}>
                <strong>Total Interest:</strong> {loanDetails.totalInterest} ETH
              </p>
              <p style={{ margin: "3px 0", fontSize: "14px", color: "#0369a1" }}>
                <strong>Total You'll Receive:</strong> {loanDetails.totalAmount} ETH
              </p>
            </div>

            <button
              onClick={() => fundLoan(loan.id, loan.amount)} // Pass ETH amount as number
              style={{
                ...styles.button,
                backgroundColor: "#059669",
                color: "white",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "8px",
                cursor: "pointer",
                border: "none",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#047857"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#059669"}
            >
              💰 Fund This Loan ({loan.amountETH} ETH)
            </button>

            <div style={{ 
              marginTop: "12px", 
              fontSize: "12px", 
              color: "#6b7280" 
            }}>
              <p>• You'll receive {loanDetails.monthlyPayment} ETH per month</p>
              <p>• Total return: {loanDetails.totalAmount} ETH over {loan.duration} months</p>
              <p>• ROI: {((Number(loanDetails.totalAmount) - Number(loan.amount)) / Number(loan.amount) * 100).toFixed(2)}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}