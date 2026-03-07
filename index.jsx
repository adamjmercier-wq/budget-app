import React from "react";
import ReactDOM from "react-dom/client";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import App from "./budget-app-v3";
import { Auth } from "./Auth";

function Root() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: "100px", fontFamily: "'DM Sans',sans-serif" }}>
        Loading...
      </div>
    );
  }

  return user ? <App user={user} /> : <Auth user={user} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);