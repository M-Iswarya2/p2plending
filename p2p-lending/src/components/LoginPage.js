import React, { useState } from "react";
import styles from "../styles";

export default function LoginPage({ onLogin }) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

const handleLogin = async () => {
  if (!emailOrUsername || !password || !role) {
    setError("Please fill in all fields and select role.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: emailOrUsername,
        password,
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message);
    }

    const user = await res.json();
    if (user.role !== role) {
      setError("Incorrect role.");
      return;
    }

    onLogin(user);
    setError("");
  } catch (err) {
    setError(err.message || "Login failed.");
  }
};


  return (
    <div style={styles.section}>
      <h2 style={styles.header}>🔐 Login</h2>
      {error && (
        <p style={{ color: "red", marginBottom: "15px", fontWeight: "bold" }}>
          {error}
        </p>
      )}
      <input
        style={styles.input}
        placeholder="Email or Username"
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select
        style={styles.input}
        onChange={(e) => setRole(e.target.value)}
        value={role}
      >
        <option value="" disabled>
          Select Role
        </option>
        <option value="borrower">Borrower</option>
        <option value="lender">Lender</option>
      </select>
      <button style={styles.button} onClick={handleLogin}>
        Log In
      </button>
    </div>
  );
}
