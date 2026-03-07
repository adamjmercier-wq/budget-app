import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

const GREEN = "#1a5632";
const RED = "#c44";
const GRAY = "#666";
const FB = "'DM Sans',sans-serif";

export function Auth({ user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div style={{ padding: "20px", textAlign: "center", background: "#f8f9fa" }}>
        <div style={{ marginBottom: "12px", fontSize: "14px", color: "#555" }}>
          Logged in as: <strong>{user.email}</strong>
        </div>
        <button
          onClick={() => signOut(auth)}
          style={{
            padding: "8px 16px",
            background: RED,
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontFamily: FB,
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "60px auto",
        padding: "24px",
        background: "#f8f9fa",
        borderRadius: "10px",
        fontFamily: FB,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: GREEN }}>
        {isSignUp ? "Create Account" : "Sign In"}
      </h2>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: GRAY }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "13px",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: GRAY }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "13px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {error && (
        <div style={{ color: RED, marginBottom: "12px", fontSize: "12px" }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleAuth}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: GREEN,
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          fontFamily: FB,
        }}
      >
        {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
      </button>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          width: "100%",
          marginTop: "12px",
          background: "transparent",
          border: "none",
          color: GREEN,
          cursor: "pointer",
          fontSize: "13px",
          textDecoration: "underline",
          fontFamily: FB,
        }}
      >
        {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
      </button>
    </div>
  );
}