import React, { useEffect, useState } from "react";
import styles from "../styles";
import { getContract } from "../contracts/contract";
import { formatEther } from "ethers";

export default function ViewLoanRequestsPage() {
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoanRequests = async () => {
    try {
      const contract = await getContract();
      if (!contract) return;

      const loans = await contract.getAllLoans();
      const requestedLoans = loans.filter((loan) => loan.status === 0); // 0 = Requested
      setLoanRequests(requestedLoans);
    } catch (err) {
      console.error("Error fetching loan requests:", err);
      alert("Failed to load loan requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanRequests();
  }, []);

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📄 Loan Requests</h2>
      {loading ? (
        <p>Loading loan requests...</p>
      ) : loanRequests.length === 0 ? (
        <p>No pending loan requests found.</p>
      ) : (
        loanRequests.map((loan, index) => (
          <div key={index} style={styles.card}>
            <p><strong>Loan ID:</strong> {loan.id.toString()}</p>
            <p><strong>Borrower:</strong> {loan.borrower}</p>
            <p><strong>Amount:</strong> {formatEther(loan.amount)} ETH</p>
            <p><strong>Interest:</strong> {loan.interest.toString()}%</p>
            <p><strong>Duration:</strong> {Math.floor(loan.duration / 86400)} days</p>
            <p><strong>Status:</strong> Requested</p>
          </div>
        ))
      )}
    </div>
  );
}
