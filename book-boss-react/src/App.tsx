import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Library } from './pages/Library';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Layout>
          <Library />
        </Layout>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
