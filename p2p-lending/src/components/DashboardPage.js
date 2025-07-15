import React, { useEffect, useState } from "react";
import styles from "../styles";
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

  if (loading) return <div style={styles.section}><h2>Loading dashboard...</h2></div>;

  if (error) return <div style={styles.section}><h2 style={{ color: "red" }}>{error}</h2></div>;

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📊 {role === "lender" ? "Lender" : "Borrower"} Dashboard</h2>

      <div style={styles.card}>
        <h3>Overview</h3>
        <p>Total Loans: {stats.totalLoans}</p>
        <p>Active: {stats.activeLoans}</p>
        <p>Repaid: {stats.repaidLoans}</p>
        <p>Defaulted: {stats.defaultedLoans}</p>
        <p>Pending: {stats.pendingLoans}</p>
        <p>Total Amount: {stats.totalAmount} ETH</p>
        <p>Active Amount: {stats.activeAmount} ETH</p>
        {role === "lender" && <p>Earnings: {stats.earnings} ETH</p>}
        <p>Installments Paid: {stats.paidInstallments}/{stats.totalInstallments}</p>
        <p>Installment Progress: {stats.installmentProgress}%</p>
      </div>

      <div style={styles.card}>
        <strong>Connected Address:</strong> {userAddress}
      </div>
    </div>
  );
}
