import React, { useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { parseEther } from "ethers";

export default function LoanRequestPage() {
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState(""); // months
  const [interestRate, setInterestRate] = useState(""); // borrower input in percentage
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !term || !interestRate) {
      alert("Please fill in all fields.");
      return;
    }

    if (
      isNaN(amount) ||
      isNaN(term) ||
      isNaN(interestRate) ||
      parseFloat(amount) <= 0 ||
      parseInt(term) <= 0 ||
      parseFloat(interestRate) < 0
    ) {
      alert("Please enter valid positive numbers.");
      return;
    }

    // Validation checks
    if (parseFloat(amount) > 1000) {
      alert("Maximum loan amount is 1000 ETH");
      return;
    }

    if (parseInt(term) > 60) {
      alert("Maximum loan term is 60 months");
      return;
    }

    if (parseFloat(interestRate) > 100) {
      alert("Maximum interest rate is 100%");
      return;
    }

    try {
      const contract = await getContract();
      if (!contract) return;

      await window.ethereum.request({ method: "eth_requestAccounts" });

      setLoading(true);

      // FIXED: Contract expects ETH amounts as whole numbers
      const amountInEth = parseInt(amount); // Send as whole ETH number
      const durationInMonths = parseInt(term);
      const interestRateForContract = parseInt(parseFloat(interestRate));

      console.log("Submitting loan request:", {
        amount: amountInEth + " ETH",
        duration: durationInMonths + " months",
        interestRate: interestRateForContract + "%"
      });

      const tx = await contract.requestLoan(
        amountInEth,          // Send as ETH number, not wei
        interestRateForContract,
        durationInMonths
      );

      await tx.wait();

      setSubmitted(true);
      alert("✅ Loan request submitted successfully!");

      // Clear form
      setAmount("");
      setTerm("");
      setInterestRate("");
    } catch (err) {
      console.error("❌ Error submitting loan request:", err);
      alert("Error: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Calculate estimated values using the same formula as the contract
  const calculateLoanDetails = () => {
    if (!amount || !term || !interestRate) return null;
    
    const principal = parseFloat(amount);
    const annualRate = parseFloat(interestRate); // Annual rate as percentage
    const months = parseInt(term);
    
    // Simple interest calculation matching the smart contract
    // Formula: Total Interest = Principal * Rate * Time / (100 * 12)
    const totalInterest = (principal * annualRate * months) / (100 * 12);
    const totalAmount = principal + totalInterest;
    const monthlyPayment = totalAmount / months;
    
    return {
      totalInterest: totalInterest.toFixed(4),
      totalAmount: totalAmount.toFixed(4),
      monthlyPayment: monthlyPayment.toFixed(4)
    };
  };

  const loanDetails = calculateLoanDetails();

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "50px auto",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "25px", color: "#1e293b" }}>
        💸 Request a New Loan
      </h2>

      {submitted && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "#d1fae5",
            color: "#065f46",
            textAlign: "center",
            fontWeight: "bold"
          }}
        >
          ✅ Your loan request was submitted successfully!
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Loan Amount (ETH)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min="1"
          step="1"
          max="1000"
          placeholder="e.g., 4 (whole numbers only)"
          style={inputStyle}
        />
        <small style={{ color: "#6b7280", fontSize: "12px", display: "block", marginTop: "4px" }}>
          Enter whole numbers only (1, 2, 3, 4, etc.). Maximum: 1000 ETH
        </small>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Loan Term (Months)</label>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          type="number"
          min="1"
          max="60"
          placeholder="e.g., 12"
          style={inputStyle}
        />
        <small style={{ color: "#6b7280", fontSize: "12px", display: "block", marginTop: "4px" }}>
          Maximum: 60 months
        </small>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <label style={labelStyle}>Annual Interest Rate (%)</label>
        <input
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          type="number"
          min="1"
          max="100"
          step="1"
          placeholder="e.g., 4 (whole numbers only)"
          style={inputStyle}
        />
        <small style={{ color: "#6b7280", fontSize: "12px", display: "block", marginTop: "4px" }}>
          Enter whole numbers only (1, 2, 3, 4, etc.). Maximum: 100% per year
        </small>
      </div>

      {/* FIXED: Payment Preview with correct calculations */}
      {loanDetails && (
        <div style={{
          marginBottom: "25px",
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0"
        }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#374151", fontSize: "18px" }}>
            📊 Loan Summary
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <p style={{ margin: "5px 0", color: "#6b7280" }}>
                <strong>Principal Amount:</strong>
              </p>
              <p style={{ margin: "0 0 10px 0", color: "#374151", fontSize: "16px" }}>
                {amount} ETH
              </p>
            </div>
            
            <div>
              <p style={{ margin: "5px 0", color: "#6b7280" }}>
                <strong>Interest Rate:</strong>
              </p>
              <p style={{ margin: "0 0 10px 0", color: "#374151", fontSize: "16px" }}>
                {interestRate}% per year
              </p>
            </div>
            
            <div>
              <p style={{ margin: "5px 0", color: "#6b7280" }}>
                <strong>Monthly Payment:</strong>
              </p>
              <p style={{ margin: "0 0 10px 0", color: "#374151", fontSize: "16px" }}>
                {loanDetails.monthlyPayment} ETH
              </p>
            </div>
            
            <div>
              <p style={{ margin: "5px 0", color: "#6b7280" }}>
                <strong>Total Interest:</strong>
              </p>
              <p style={{ margin: "0 0 10px 0", color: "#374151", fontSize: "16px" }}>
                {loanDetails.totalInterest} ETH
              </p>
            </div>
          </div>
          
          <div style={{ 
            marginTop: "15px", 
            padding: "12px", 
            backgroundColor: "#e0f2fe", 
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <p style={{ margin: "0", color: "#0369a1", fontWeight: "bold", fontSize: "16px" }}>
              <strong>Total to Repay:</strong> {loanDetails.totalAmount} ETH
            </p>
          </div>
          
          <div style={{ 
            marginTop: "12px", 
            padding: "10px", 
            backgroundColor: "#fef3c7", 
            borderRadius: "6px",
            fontSize: "12px",
            color: "#92400e"
          }}>
            💡 This uses simple interest calculation: Interest = Principal × Rate × Time ÷ (100 × 12)
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "16px",
          backgroundColor: loading ? "#9ca3af" : "#2563eb",
          borderRadius: "8px",
          color: "#ffffff",
          cursor: loading ? "not-allowed" : "pointer",
          border: "none",
          fontWeight: "bold",
          transition: "background-color 0.2s"
        }}
        onMouseOver={(e) => {
          if (!loading) e.target.style.backgroundColor = "#1d4ed8";
        }}
        onMouseOut={(e) => {
          if (!loading) e.target.style.backgroundColor = "#2563eb";
        }}
      >
        {loading ? "Submitting..." : "Submit Loan Request"}
      </button>

      <div style={{ 
        marginTop: "20px", 
        fontSize: "12px", 
        color: "#6b7280", 
        textAlign: "center",
        lineHeight: "1.5"
      }}>
        <p>• Your loan request will be visible to potential lenders</p>
        <p>• Use whole numbers only for amounts and interest rates</p>
        <p>• Once funded, you'll need to make monthly payments of {loanDetails ? loanDetails.monthlyPayment : "X.XXX"} ETH</p>
        <p>• Interest is calculated using simple interest formula</p>
        <p>• All amounts are handled directly in ETH (no wei conversion needed)</p>
      </div>
    </div>
  );
}

// Local styles
const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
  color: "#374151",
  fontSize: "14px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "15px",
  outlineColor: "#60a5fa",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};