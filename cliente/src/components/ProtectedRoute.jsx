// Crea un componente ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await axios.get("https://localhost:3000/api/owner-data", {
          withCredentials: true
        });
        setIsAuthenticated(true);
      } catch (error) {
        navigate("/");
      }
    };
    verifyAuth();
  }, [navigate]);

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;