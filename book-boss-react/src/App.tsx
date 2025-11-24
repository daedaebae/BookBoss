import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Layout>
          <h2>Welcome to BookBoss React</h2>
          <p>Migration Phase 1 Complete</p>
        </Layout>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
