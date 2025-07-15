import React, { useState } from "react";
import styles from "../styles";

export default function RegistrationPage({ onRegister }) {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [error, setError] = useState("");

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { fullName, username, phone, email, password, confirmPassword, role } = formData;

    // ✅ Client-side validation
    if (!fullName || !username || !phone || !email || !password || !confirmPassword || !role) {
      return setError("Please fill in all fields and select role.");
    }

    if (!validateEmail(email)) return setError("Please enter a valid email.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, phone, email, password, role }),
      });

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorMsg = contentType?.includes("application/json")
          ? (await res.json()).message || "Registration failed"
          : await res.text();
        throw new Error(errorMsg);
      }

      alert("✅ Registration successful!");
      onRegister(); // callback to switch to login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>📝 Register</h2>
      {error && (
        <p style={{ color: "red", marginBottom: 15, fontWeight: "bold" }}>{error}</p>
      )}
      <input
        style={styles.input}
        placeholder="Full Name"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
      />
      <input
        style={styles.input}
        placeholder="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
      />
      <input
        style={styles.input}
        placeholder="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
      />
      <input
        style={styles.input}
        placeholder="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        style={styles.input}
        placeholder="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
      />
      <input
        style={styles.input}
        placeholder="Confirm Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
      />
      <select
        style={styles.input}
        name="role"
        value={formData.role}
        onChange={handleChange}
      >
        <option value="" disabled>
          Select Role
        </option>
        <option value="borrower">Borrower</option>
        <option value="lender">Lender</option>
      </select>
      <button style={styles.button} onClick={handleRegister}>
        Sign Up
      </button>
    </div>
  );
}
