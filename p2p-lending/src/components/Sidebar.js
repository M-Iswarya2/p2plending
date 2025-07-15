import React from "react";
import styles from "../styles";

export default function Sidebar({ page, setPage, role, setRole }) {
  const borrowerMenu = [
    { key: "dashboard", label: "🏠 Dashboard" },
    { key: "loanRequest", label: "💸 Loan Request" },// ✅ NEW entry added here
    { key: "creditAssessment", label: "📊 Credit Check" },
    { key: "loanSelection", label: "🤝 My Loans" },
    { key: "repaymentSchedule", label: "📅 Repayment" },
  ];

  const lenderMenu = [
    { key: "dashboard", label: "🏠 Dashboard" },
    { key: "loanList", label: "🧾 All Loans" },
    { key: "fundLoan", label: "💰 Fund Loan" },
    { key: "repaymentReports", label: "📊 Reports" },
  ];

  const staticMenu = [
    { key: "login", label: "🔐 Login" },
    { key: "register", label: "📝 Register" },
  ];

  const menuItems =
    !role || page === "login" || page === "register"
      ? staticMenu
      : role === "lender"
      ? lenderMenu
      : borrowerMenu;

  const handleSwitchRole = () => {
    const newRole = role === "borrower" ? "lender" : "borrower";
    setRole(newRole);
    setPage("dashboard");
  };

  return (
    <div style={styles.sidebar}>
      <h2 style={{ color: "#fff", fontSize: "20px", marginBottom: "30px" }}>
        💼 P2P Lending
      </h2>

      {menuItems.map((item) => (
        <button
          key={item.key}
          style={styles.navButton(page === item.key)}
          onClick={() => setPage(item.key)}
        >
          {item.label}
        </button>
      ))}

      {role && (
        <button
          style={{
            ...styles.navButton(false),
            marginTop: "auto",
            backgroundColor: "#1f2937",
            color: "#fbbf24",
          }}
          onClick={handleSwitchRole}
        >
          🔄 Switch to {role === "borrower" ? "Lender" : "Borrower"}
        </button>
      )}
    </div>
  );
}
