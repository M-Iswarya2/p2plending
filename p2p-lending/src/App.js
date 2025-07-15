import React, { useState, useEffect } from "react";

import styles from "./styles";

import LoanListPage from "./components/LoanListPage";
import Sidebar from "./components/Sidebar";
import LoginPage from "./components/LoginPage";
import RegistrationPage from "./components/RegistrationPage";
import DashboardPage from "./components/DashboardPage";
import LoanRequestPage from "./components/LoanRequestPage";
import CreditAssessmentPage from "./components/CreditAssessmentPage";
import LoanSelectionPage from "./components/LoanSelectionPage";
import RepaymentSchedulePage from "./components/RepaymentSchedulePage";
import ViewLoanRequestsPage from "./components/ViewLoanRequestsPage";
import FundLoanPage from "./components/FundLoanPage";
import RepaymentReportsPage from "./components/RepaymentReportsPage";
import BorrowerLoansPage from "./components/BorrowerLoansPage"; 

export default function App() {
  const [page, setPage] = useState("login");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem("users");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      setRole(user.role);
      setPage("dashboard");
    } else {
      localStorage.removeItem("currentUser");
      setRole(null);
      setPage("login");
    }
  }, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setRole(parsedUser.role);
      setPage("dashboard");
    }
  }, []);

  const handleLogin = (user) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setPage("login");
  };

  const handleRegister = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    alert("Registration successful! Please login.");
    setPage("login");
  };

  let content = null;
  if (!user) {
    if (page === "login") {
      content = <LoginPage onLogin={handleLogin} existingUsers={users} />;
    } else if (page === "register") {
      content = <RegistrationPage onRegister={handleRegister} existingUsers={users} />;
    } else {
      content = (
        <div style={styles.section}>
          <h2>Please login or register first.</h2>
        </div>
      );
    }
  } else {
    switch (page) {
      case "dashboard":
        content = <DashboardPage role={role} />;
        break;
      case "loanRequest":
        content = role === "borrower" ? <LoanRequestPage /> : <DashboardPage role={role} />;
        break;
      case "myLoans":
        content = role === "borrower" ? <BorrowerLoansPage /> : <DashboardPage role={role} />;
        break;
      case "loanList":
        content = role === "lender" ? <LoanListPage /> : <DashboardPage role={role} />;
        break;
      case "creditAssessment":
        content = role === "borrower" ? <CreditAssessmentPage /> : <DashboardPage role={role} />;
        break;
      case "loanSelection":
        content = role === "borrower" ? <LoanSelectionPage /> : <DashboardPage role={role} />;
        break;
      case "repaymentSchedule":
        content = role === "borrower" ? <RepaymentSchedulePage /> : <DashboardPage role={role} />;
        break;
      case "viewRequests":
        content = role === "lender" ? <ViewLoanRequestsPage /> : <DashboardPage role={role} />;
        break;
      case "fundLoan":
        content = role === "lender" ? <FundLoanPage /> : <DashboardPage role={role} />;
        break;
      case "repaymentReports":
        content = role === "lender" ? <RepaymentReportsPage /> : <DashboardPage role={role} />;
        break;
      default:
        content = <DashboardPage role={role} />;
    }
  }

  return (
    <div style={styles.container}>
      <Sidebar page={page} setPage={setPage} role={role} setRole={setRole} />
      <main style={styles.main}>
        {user && (
          <button
            style={{
              ...styles.button,
              marginBottom: "20px",
              backgroundColor: "#ef4444",
              boxShadow: "0 0 8px #ef4444",
            }}
            onClick={handleLogout}
          >
            🔒 Logout
          </button>
        )}
        {content}
      </main>
    </div>
  );
}
