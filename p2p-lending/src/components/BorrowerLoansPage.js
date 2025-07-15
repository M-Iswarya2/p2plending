import React, { useEffect, useState } from "react";
import styles from "../styles";
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

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📊 My Loan Status</h2>
      {loading ? (
        <p>Loading...</p>
      ) : loans.length === 0 ? (
        <p>No loans found under your account.</p>
      ) : (
        loans.map((loan, idx) => (
          <div key={idx} style={styles.card}>
            <p><strong>Loan ID:</strong> {loan.id.toString()}</p>
            <p><strong>Amount:</strong> {formatEther(loan.amount)} ETH</p>
            <p><strong>Status:</strong> {["Requested", "Funded", "Repaid"][loan.status]}</p>
          </div>
        ))
      )}
    </div>
  );
}
