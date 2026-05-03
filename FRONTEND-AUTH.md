# Frontend Authentication System

## Overview
Sistema completo de autenticação no frontend com React Context, JWT em localStorage, tela de login moderna com Motion animations, e proteção de rotas.

## Arquivos Criados

### 1. **AuthContext** (`src/frontend/context/AuthContext.tsx`)

#### Funcionalidades:
- ✅ Gerenciamento de estado do usuário e tokens JWT
- ✅ Persistência em localStorage
- ✅ Auto-refresh de token antes da expiração
- ✅ Helper `apiCall` com refresh automático
- ✅ Logout automático em caso de token inválido

#### Interface:
```typescript
interface AuthContextType {
  user: User | null;           // Dados do usuário logado
  tokens: AuthTokens | null;   // Access + Refresh tokens
  isAuthenticated: boolean;    // Estado de autenticação
  isLoading: boolean;          // Carregando dados iniciais
  login(email, password): Promise<void>;
  logout(): void;
  refreshToken(): Promise<boolean>;
}
```

#### Uso:
```typescript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <div>Welcome {user?.name}</div>;
}
```

---

### 2. **Login Page** (`src/frontend/pages/Login.tsx`)

#### Design Moderno:
- ✅ Background gradiente animado
- ✅ Glassmorphism (backdrop blur)
- ✅ Animações com Framer Motion
- ✅ Ícones do Lucide React
- ✅ Formulário com validação
- ✅ Loading states
- ✅ Error handling visual

#### Features:
- Email e senha com ícones
- Mostrar/ocultar senha
- "Remember me" checkbox
- "Forgot password" link
- Animações de entrada suaves
- Feedback de erro animado
- Spinner de loading

#### Animações Implementadas:
```typescript
// Background orbs pulsantes
<motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} />

// Card fade in
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />

// Logo spring animation
<motion.div transition={{ type: "spring", stiffness: 200 }} />

// Error message slide in
<AnimatePresence>
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} />
</AnimatePresence>

// Button hover/tap
<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} />
```

---

### 3. **ProtectedRoute** (`src/frontend/components/ProtectedRoute.tsx`)

#### Funcionalidades:
- ✅ Verificação de autenticação
- ✅ Verificação de role (ADMIN/AGENT)
- ✅ Loading spinner durante verificação
- ✅ Redirecionamento automático para login
- ✅ Página de "Access Denied" para roles insuficientes

#### Uso:
```typescript
// Proteção básica (qualquer usuário logado)
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// Proteção por role (apenas admin)
<Route element={<ProtectedRoute requiredRole="ADMIN" />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>
```

---

### 4. **UserMenu** (`src/frontend/components/UserMenu.tsx`)

#### Features:
- ✅ Avatar com inicial do nome
- ✅ Dropdown com informações do usuário
- ✅ Nome, email e tenant
- ✅ Botão de logout
- ✅ Animações de abertura/fechamento
- ✅ Fecha ao clicar fora

#### Interface:
```typescript
// Mostra no header do dashboard
<UserMenu />
// Avatar + nome + dropdown com logout
```

---

### 5. **App.tsx** - Router Configuration

#### Estrutura de Rotas:
```typescript
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      
      {/* Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>
      
      {/* Admin only */}
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        {/* rotas admin */}
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Fluxo de Autenticação

```
1. Usuário acessa /login
   ↓
2. Preenche email/senha
   ↓
3. Login chama API /api/v1/auth/login
   ↓
4. Recebe { user, tokens }
   ↓
5. AuthContext salva no localStorage
   ↓
6. Redireciona para /dashboard
   ↓
7. Dashboard verifica autenticação
   ↓
8. UserMenu mostra dados do usuário
   ↓
9. Logout limpa localStorage e redireciona
```

---

## API Helper Automático

O contexto expõe uma função `apiCall` global que:

```typescript
// Faz chamadas autenticadas
const response = await window.apiCall('/api/v1/channels', {
  method: 'GET'
});

// Se token expirado (401):
// 1. Automaticamente chama refresh
// 2. Re-tenta a requisição
// 3. Se refresh falhar, faz logout
```

---

## Persistência

### localStorage:
```typescript
// Keys utilizadas:
'auth_tokens'  → { accessToken, refreshToken, expiresIn }
'auth_user'    → { id, name, email, role, tenantId, tenantName }
```

### Auto-refresh:
```typescript
// 5 minutos antes de expirar:
useEffect(() => {
  const timer = setTimeout(() => refreshToken(), expiresIn - 5*60*1000);
  return () => clearTimeout(timer);
}, [tokens]);
```

---

## Estilização (Tailwind CSS)

### Cores Principais:
- **Background**: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- **Card**: `bg-white/10 backdrop-blur-lg border-white/20`
- **Primary**: `from-emerald-500 to-emerald-600`
- **Text**: `text-white` / `text-slate-300`

### Glassmorphism:
```css
backdrop-blur-lg
bg-white/10
border-white/20
```

### Animações:
```css
/* Background orbs */
animate-pulse

/* Transitions */
transition-all duration-300
hover:scale-102
```

---

## Variáveis de Ambiente

```bash
# .env
VITE_API_URL=http://localhost:3000
```

---

## Dependências Instaladas

```bash
npm install react-router-dom  # Roteamento
npm install motion            # Animações (já instalado)
npm install lucide-react      # Ícones (já instalado)
```

---

## Resumo de Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `src/frontend/context/AuthContext.tsx` | Contexto de autenticação |
| `src/frontend/pages/Login.tsx` | Tela de login com Motion |
| `src/frontend/components/ProtectedRoute.tsx` | Proteção de rotas |
| `src/frontend/components/UserMenu.tsx` | Menu do usuário no header |
| `src/App.tsx` | Configuração de rotas |

---

## Screenshots Esperados

### Tela de Login:
```
┌─────────────────────────────────────┐
│  🔮 (Background animado gradiente) │
│                                     │
│    ┌───────────────────────────┐   │
│    │     💬 (Logo WhatsApp)    │   │
│    │    WhatsApp SaaS          │   │
│    │    Sign in to continue    │   │
│    │                           │   │
│    │  📧 Email                 │   │
│    │  🔒 Password [👁️]        │   │
│    │                           │   │
│    │  ☑️ Remember me    Forgot?│   │
│    │                           │   │
│    │  ┌─────────────────────┐  │   │
│    │  │     Sign In         │  │   │
│    │  └─────────────────────┘  │   │
│    │                           │   │
│    │  Don't have an account?   │   │
│    └───────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Status:** Sistema de autenticação frontend completo e moderno! 🎨
