import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { formatEther, parseEther } from "ethers";

export default function LoanListPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userAddress, setUserAddress] = useState("");

  const fetchUserLoans = async () => {
    try {
      const contract = await getContract();
      if (!contract) return;

      // Get user's address
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const currentUser = accounts[0];
      setUserAddress(currentUser);

      // Try to get all loans - use the same method as FundLoanPage
      let rawLoans;
      try {
        // First try getAllLoans if it exists
        rawLoans = await contract.getAllLoans();
      } catch (err) {
        // If getAllLoans doesn't exist, use getAvailableLoans
        console.log("getAllLoans not available, using getAvailableLoans");
        rawLoans = await contract.getAvailableLoans();
      }

      console.log("Raw loans from contract:", rawLoans); // Debug log

      // Filter loans for current user - show both borrowed and lent loans
      const userLoans = rawLoans
        .map((loan, i) => {
          // FIXED: Contract stores amounts as ETH units, not wei
          const amountInEth = loan.amount?.toString() || "0";
          const monthlyPaymentEth = loan.monthlyPayment?.toString() || "0";
          const totalAmountDueEth = loan.totalAmountDue?.toString() || "0";
          
          console.log(`Loan ${i}:`, {
            rawAmount: loan.amount,
            amountInEth,
            borrower: loan.borrower,
            lender: loan.lender,
            status: loan.status
          }); // Debug log
          
          return {
            id: loan.id?.toString() || (i + 1).toString(),
            borrower: loan.borrower,
            lender: loan.lender || "Not funded yet",
            amount: amountInEth, // Amount in ETH as string
            amountETH: amountInEth, // Display amount in ETH
            interestRate: loan.interestRate?.toString() || "0",
            duration: loan.duration?.toString() || "0",
            monthlyPayment: monthlyPaymentEth, // Already in ETH
            totalAmountDue: totalAmountDueEth, // Already in ETH
            status: Number(loan.status),
            repaidAmount: loan.repaidAmount ? loan.repaidAmount.toString() : "0", // Already in ETH
            nextPaymentDue: loan.nextPaymentDue ? new Date(Number(loan.nextPaymentDue) * 1000).toLocaleDateString() : "N/A"
          };
        })
        .filter((loan) => {
          const isBorrower = loan.borrower.toLowerCase() === currentUser.toLowerCase();
          const isLender = loan.lender.toLowerCase() === currentUser.toLowerCase();
          const hasAmount = Number(loan.amount) > 0;
          console.log(`Filtering loan ${loan.id}: borrower match: ${isBorrower}, lender match: ${isLender}, has amount: ${hasAmount}`);
          return (isBorrower || isLender) && hasAmount;
        });

      console.log("Filtered user loans:", userLoans); // Debug log
      setLoans(userLoans);
    } catch (err) {
      console.error("Error fetching user loans:", err);
      setError("Could not load your loans.");
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (loanId, paymentAmount) => {
    try {
      const contract = await getContract();
      if (!contract) return;

      await window.ethereum.request({ method: "eth_requestAccounts" });

      // FIXED: Contract expects payment in wei, but stores amounts as ETH
      // Convert ETH amount to wei for the transaction
      const amountInWei = parseEther(paymentAmount.toString());
      
      console.log("Making payment:", {
        loanId,
        paymentAmount: paymentAmount + " ETH",
        amountInWei: amountInWei.toString() + " wei"
      });

      const tx = await contract.payInstallment(loanId, { value: amountInWei });
      await tx.wait();

      alert("✅ Payment made successfully!");
      fetchUserLoans();
    } catch (err) {
      console.error("❌ Payment error:", err);
      alert("Error making payment: " + (err?.reason || err?.message || "Unknown error"));
    }
  };

  // Calculate loan details for display
  const calculateLoanDetails = (loan) => {
    const principal = parseFloat(loan.amount);
    const rate = parseFloat(loan.interestRate);
    const months = parseFloat(loan.duration);
    
    // Validate inputs
    if (isNaN(principal) || isNaN(rate) || isNaN(months) || principal <= 0 || months <= 0) {
      return {
        totalInterest: "0.0000",
        totalAmount: "0.0000",
        monthlyPayment: "0.0000",
        remainingBalance: "0.0000"
      };
    }
    
    // Simple interest calculation
    const totalInterest = (principal * rate * months) / (100 * 12);
    const totalAmount = principal + totalInterest;
    const monthlyPayment = totalAmount / months;
    const repaidAmount = parseFloat(loan.repaidAmount) || 0;
    const remainingBalance = totalAmount - repaidAmount;
    
    return {
      totalInterest: totalInterest.toFixed(4),
      totalAmount: totalAmount.toFixed(4),
      monthlyPayment: monthlyPayment.toFixed(4),
      remainingBalance: Math.max(0, remainingBalance).toFixed(4)
    };
  };

  // Get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 0: return { text: "Requested", color: "#f59e0b", emoji: "⏳" };
      case 1: return { text: "Funded", color: "#10b981", emoji: "✅" };
      case 2: return { text: "Repaid", color: "#6b7280", emoji: "💰" };
      case 3: return { text: "Defaulted", color: "#ef4444", emoji: "❌" };
      default: return { text: "Unknown", color: "#6b7280", emoji: "❓" };
    }
  };

  // Check if current user is the borrower for this loan
  const isUserBorrower = (loan) => {
    return loan.borrower.toLowerCase() === userAddress.toLowerCase();
  };

  // Check if current user is the lender for this loan
  const isUserLender = (loan) => {
    return loan.lender.toLowerCase() === userAddress.toLowerCase();
  };

  useEffect(() => {
    fetchUserLoans();
  }, []);

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📋 My Loans</h2>
      
      {userAddress && (
        <p style={{ marginBottom: "20px", color: "#6b7280" }}>
          <strong>Your Address:</strong> {userAddress}
        </p>
      )}

      {loading && <p>Loading your loans...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && loans.length === 0 && (
        <p>You haven't requested any loans or funded any loans yet.<br />Go to the "Request Loan" page to create your first loan request, or visit "Fund Loans" to lend to others.</p>
      )}

      {loans.map((loan) => {
        const loanDetails = calculateLoanDetails(loan);
        const statusInfo = getStatusDisplay(loan.status);
        const userIsBorrower = isUserBorrower(loan);
        const userIsLender = isUserLender(loan);
        
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
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "15px" 
            }}>
              <h3 style={{ margin: "0", color: "#1e293b" }}>
                {userIsBorrower ? "💰 Loan #" + loan.id : "🏦 Lent Loan #" + loan.id}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {userIsBorrower && (
                  <span style={{ 
                    background: "#3b82f6", 
                    color: "white", 
                    padding: "2px 8px", 
                    borderRadius: "12px", 
                    fontSize: "10px",
                    fontWeight: "bold"
                  }}>
                    BORROWER
                  </span>
                )}
                {userIsLender && (
                  <span style={{ 
                    background: "#059669", 
                    color: "white", 
                    padding: "2px 8px", 
                    borderRadius: "12px", 
                    fontSize: "10px",
                    fontWeight: "bold"
                  }}>
                    LENDER
                  </span>
                )}
                <span style={{ 
                  background: statusInfo.color, 
                  color: "white", 
                  padding: "4px 12px", 
                  borderRadius: "20px", 
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  {statusInfo.emoji} {statusInfo.text}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Principal Amount:</strong> {parseFloat(loan.amountETH).toFixed(4)} ETH
              </p>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Interest Rate:</strong> {loan.interestRate}% per year
              </p>
              <p style={{ margin: "5px 0", color: "#374151" }}>
                <strong>Duration:</strong> {loan.duration} months
              </p>
              {userIsBorrower && loan.lender !== "Not funded yet" && (
                <p style={{ margin: "5px 0", color: "#374151" }}>
                  <strong>Lender:</strong> {loan.lender}
                </p>
              )}
              {userIsLender && (
                <p style={{ margin: "5px 0", color: "#374151" }}>
                  <strong>Borrower:</strong> {loan.borrower}
                </p>
              )}
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
                <strong>Total Amount Due:</strong> {loanDetails.totalAmount} ETH
              </p>
              <p style={{ margin: "3px 0", fontSize: "14px", color: "#0369a1" }}>
                <strong>Repaid Amount:</strong> {parseFloat(loan.repaidAmount).toFixed(4)} ETH
              </p>
              <p style={{ margin: "3px 0", fontSize: "14px", color: "#0369a1" }}>
                <strong>Remaining Balance:</strong> {loanDetails.remainingBalance} ETH
              </p>
            </div>

            {/* Show payment buttons ONLY for borrowers on their own funded loans, but NOT if they're also the lender */}
            {userIsBorrower && !userIsLender && loan.status === 1 && parseFloat(loanDetails.remainingBalance) > 0 && (
              <div style={{ marginTop: "15px" }}>
                <button
                  onClick={() => makePayment(loan.id, loanDetails.monthlyPayment)}
                  style={{
                    ...styles.button,
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "none",
                    transition: "background-color 0.2s",
                    marginRight: "10px"
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}
                >
                  💳 Make Monthly Payment ({loanDetails.monthlyPayment} ETH)
                </button>
                
                <button
                  onClick={() => makePayment(loan.id, loanDetails.remainingBalance)}
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
                  💰 Pay Full Amount ({loanDetails.remainingBalance} ETH)
                </button>
              </div>
            )}

            <div style={{ 
              marginTop: "12px", 
              fontSize: "12px", 
              color: "#6b7280" 
            }}>
              {loan.status === 0 && userIsBorrower && !userIsLender && <p>• Waiting for a lender to fund this loan</p>}
              {loan.status === 0 && userIsLender && !userIsBorrower && <p>• This loan request is still pending funding</p>}
              {loan.status === 0 && userIsBorrower && userIsLender && <p></p>}
              {loan.status === 1 && userIsBorrower && !userIsLender && (
                <>
                  <p>• Next payment due: {loan.nextPaymentDue}</p>
                  <p>• Progress: {((parseFloat(loan.repaidAmount) / parseFloat(loanDetails.totalAmount)) * 100).toFixed(1)}% repaid</p>
                </>
              )}
              {loan.status === 1 && userIsLender && !userIsBorrower && (
                <>
                  <p>• Borrower's next payment due: {loan.nextPaymentDue}</p>
                  <p>• Repayment progress: {((parseFloat(loan.repaidAmount) / parseFloat(loanDetails.totalAmount)) * 100).toFixed(1)}% completed</p>
                </>
              )}
              {loan.status === 1 && userIsBorrower && userIsLender && (
                <p>• This is a self-funded loan - no payments needed</p>
              )}
              {loan.status === 2 && <p>• ✅ Loan fully repaid</p>}
              {loan.status === 3 && <p>• ❌ Loan defaulted</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}