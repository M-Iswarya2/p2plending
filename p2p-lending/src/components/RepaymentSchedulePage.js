import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { parseEther } from "ethers";

export default function RepaymentSchedulePage() {
  const [myLoans, setMyLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState({});

  const fetchMyLoans = async () => {
    try {
      const contract = await getContract();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const user = accounts[0];

      const allLoans = await contract.getAllLoans();
      const filteredLoans = allLoans.filter(
        (loan) =>
          loan.borrower.toLowerCase() === user.toLowerCase() &&
          Number(loan.status) === 1 // Funded
      );

      const formatted = filteredLoans.map((loan) => {
        const principal = Number(loan.amount);
        const rate = Number(loan.interestRate);
        const months = Number(loan.duration);
        const paid = Number(loan.installmentsPaid);

        const interest = (principal * rate * months) / (100 * 12);
        const totalDue = principal + interest;
        const monthlyPayment = totalDue / months;

        return {
          id: loan.id.toString(),
          principal: principal.toFixed(4),
          interestRate: rate,
          duration: months,
          installmentsPaid: paid,
          monthlyPayment: monthlyPayment.toFixed(4),
          totalAmountDue: totalDue.toFixed(4),
          startTime: Number(loan.startTime),
        };
      });

      setMyLoans(formatted);
    } catch (err) {
      console.error("Error fetching loans:", err);
      alert("❌ Failed to fetch your loans.");
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (loanId, amountEth) => {
    try {
      setPaymentLoading((prev) => ({ ...prev, [loanId]: true }));
      const contract = await getContract();
      const tx = await contract.payInstallment(loanId, {
        value: parseEther(amountEth),
      });
      await tx.wait();
      alert("✅ Installment paid successfully!");
      fetchMyLoans();
    } catch (err) {
      console.error("Payment error:", err);
      alert("❌ Failed to pay: " + (err?.reason || err?.message));
    } finally {
      setPaymentLoading((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const calculateNextPayment = (loan) => {
    const current = loan.installmentsPaid + 1;
    if (current === loan.duration) {
      const totalPaid = loan.monthlyPayment * loan.installmentsPaid;
      const remaining = loan.totalAmountDue - totalPaid;
      return remaining.toFixed(4);
    }
    return loan.monthlyPayment;
  };

  const getDueDate = (loan) => {
    const base = new Date(loan.startTime * 1000);
    base.setMonth(base.getMonth() + loan.installmentsPaid + 1);
    return base.toLocaleDateString("en-IN");
  };

  const isOverdue = (loan) => {
    const due = new Date(loan.startTime * 1000);
    due.setMonth(due.getMonth() + loan.installmentsPaid + 1);
    return new Date() > due;
  };

  const calculateProgress = (loan) => {
    const paid = loan.monthlyPayment * loan.installmentsPaid;
    const percent = ((paid / loan.totalAmountDue) * 100).toFixed(1);
    return {
      paid: paid.toFixed(4),
      remaining: (loan.totalAmountDue - paid).toFixed(4),
      percent,
    };
  };

  useEffect(() => {
    fetchMyLoans();
  }, []);

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📅 Your Repayment Schedule</h2>
      {loading ? (
        <p>Loading...</p>
      ) : myLoans.length === 0 ? (
        <p>No active loans.</p>
      ) : (
        myLoans.map((loan) => {
          const loanId = loan.id;
          const fullyPaid = loan.installmentsPaid >= loan.duration;
          const overdue = isOverdue(loan);
          const progress = calculateProgress(loan);
          const nextPayment = calculateNextPayment(loan);

          return (
            <div key={loanId} style={{
              marginBottom: "24px",
              padding: "20px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              backgroundColor: "#f9fafb",
            }}>
              <h3>💸 Loan #{loanId}</h3>
              <p>Status: {fullyPaid ? "✅ Repaid" : overdue ? "⚠️ Overdue" : "🟡 In Progress"}</p>
              <p>Amount: {loan.principal} ETH</p>
              <p>Interest: {loan.interestRate}%</p>
              <p>Duration: {loan.duration} months</p>
              <p>Monthly: {loan.monthlyPayment} ETH</p>
              <p>Total Due: {loan.totalAmountDue} ETH</p>
              <p>Paid: {progress.paid} ETH</p>
              <p>Remaining: {progress.remaining} ETH</p>
              <p>Installments: {loan.installmentsPaid}/{loan.duration}</p>
              {!fullyPaid && (
                <>
                  <p>Next Due: {getDueDate(loan)}</p>
                  <button
                    onClick={() => handleRepay(loanId, nextPayment)}
                    disabled={paymentLoading[loanId]}
                    style={{
                      padding: "10px 16px",
                      backgroundColor: overdue ? "#dc2626" : "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginTop: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {paymentLoading[loanId]
                      ? "Processing..."
                      : `${overdue ? "⚠️ Pay Overdue" : "💰 Pay"} Installment (${nextPayment} ETH)`}
                  </button>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
