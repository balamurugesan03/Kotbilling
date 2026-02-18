import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SettingsProvider } from './context/SettingsContext';
import AppRoutes from './routes';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
