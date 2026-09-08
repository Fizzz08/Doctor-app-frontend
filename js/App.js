import "@/App.css";

function App() {
  useEffect(() => {
    // Default landing → register page (set ?page=login to view login)
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page") === "login" ? "loginDemo.html" : "registerDemo.html";
    window.location.replace(`/HTML/${page}`);
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "Manrope, sans-serif",
      color: "#0369a1"
    }} data-testid="redirect-loader">
      Loading MediBook…
    </div>
  );
}

export default App;
