import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { parseEther } from "ethers";

export default function LoanSelectionPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState("");

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setUserAddress(addr);

      const rawLoans = await contract.getBorrowerLoans(addr);
      const formatted = rawLoans.map((loan) => {
        const principal = Number(loan.amount);
        const rate = Number(loan.interestRate);
        const months = Number(loan.duration);
        const paid = Number(loan.installmentsPaid);

        const interest = (principal * rate * months) / (100 * 12);
        const totalDue = principal + interest;
        const monthly = totalDue / months;

        return {
          id: loan.id.toString(),
          status: Number(loan.status),
          principal: principal.toFixed(4),
          interestRate: rate,
          duration: months,
          installmentsPaid: paid,
          monthlyPayment: monthly.toFixed(4),
          totalAmountDue: totalDue.toFixed(4),
          lender: loan.lender,
        };
      });

      setLoans(formatted);
    } catch (err) {
      console.error("Error fetching loans:", err);
      alert("Failed to load loans.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (loanId, monthlyEth) => {
    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.payInstallment(loanId, {
        value: parseEther(monthlyEth),
      });
      await tx.wait();
      alert("✅ Installment paid!");
      await fetchLoans();
    } catch (err) {
      console.error(err);
      alert("Installment payment failed: " + (err?.reason || err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLoan = async (loanId) => {
    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.removeLoan(loanId);
      await tx.wait();
      alert("✅ Loan removed");
      await fetchLoans();
    } catch (err) {
      console.error(err);
      alert("Remove failed: " + (err?.reason || err?.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const getStatusColor = (status) => {
    return ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#6b7280"][status] || "#6b7280";
  };

  const getStatusText = (status) => {
    return ["🔵 Requested", "🟡 In Progress", "🟢 Repaid", "🔴 Defaulted", "⚪ Removed"][status] || "Unknown";
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📋 My Loan Requests</h2>
      <p><strong>Your Address:</strong> {userAddress}</p>

      {loans.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>No loan requests yet.</p>
        </div>
      )}

      {loans.map((loan) => {
        const paid = loan.installmentsPaid;
        const duration = loan.duration;
        const canPay = loan.status === 1 && paid < duration;
        const canRemove = loan.status === 0;

        const paidAmount = (paid * parseFloat(loan.monthlyPayment)).toFixed(4);
        const remainingAmount = (parseFloat(loan.totalAmountDue) - parseFloat(paidAmount)).toFixed(4);

        return (
          <div key={loan.id} style={{
            ...styles.card,
            marginBottom: "20px",
            borderLeft: `4px solid ${getStatusColor(loan.status)}`
          }}>
            <h3>💸 Loan #{loan.id}</h3>
            <p><strong>Amount:</strong> {loan.principal} ETH</p>
            <p><strong>Interest:</strong> {loan.interestRate}%</p>
            <p><strong>Duration:</strong> {loan.duration} months</p>
            <p><strong>Monthly:</strong> {loan.monthlyPayment} ETH</p>
            <p><strong>Total Due:</strong> {loan.totalAmountDue} ETH</p>
            <p><strong>Paid:</strong> {paidAmount} ETH</p>
            <p><strong>Remaining:</strong> {remainingAmount} ETH</p>
            <p><strong>Installments:</strong> {paid}/{duration}</p>

            {loan.lender !== "0x0000000000000000000000000000000000000000" && (
              <p><strong>Lender:</strong> {loan.lender}</p>
            )}

            <div style={{ marginTop: "15px" }}>
              {canPay && (
                <button
                  style={{ ...styles.button, backgroundColor: "#10b981", width: "100%", opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                  onClick={() => handlePayInstallment(loan.id, loan.monthlyPayment)}
                >
                  {loading ? "Paying..." : `💰 Pay Installment (${loan.monthlyPayment} ETH)`}
                </button>
              )}
              {canRemove && (
                <button
                  style={{ ...styles.button, backgroundColor: "#ef4444", width: "100%", opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                  onClick={() => handleRemoveLoan(loan.id)}
                >
                  {loading ? "Removing..." : "❌ Remove Request"}
                </button>
              )}
            </div>

            <p style={{ marginTop: "10px", color: getStatusColor(loan.status) }}>
              <strong>Status:</strong> {getStatusText(loan.status)}
            </p>
          </div>
        );
      })}

      <button style={styles.button} onClick={fetchLoans} disabled={loading}>
        {loading ? "Refreshing..." : "🔄 Refresh"}
      </button>
    </div>
  );
}
