-- WhatsApp SaaS Multi-Tenant Database Schema
-- PostgreSQL Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants Table (Empresas/SaaS clients)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (Atendentes/Agentes)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Senha hash (bcrypt)
    role VARCHAR(20) NOT NULL DEFAULT 'AGENT' CHECK (role IN ('ADMIN', 'AGENT')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels Table (Canais WhatsApp)
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- ID do usuário responsável pelo canal
    phone_number_id VARCHAR(255) UNIQUE NOT NULL, -- ID do Número na API da Meta
    waba_id VARCHAR(255) NOT NULL, -- WhatsApp Business Account ID
    verify_token VARCHAR(255) NOT NULL, -- Token para verificação do Webhook
    access_token VARCHAR(1000) NOT NULL, -- System User Access Token permanente
    is_active BOOLEAN DEFAULT true, -- Status do canal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts Table (Contatos de clientes)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL, -- wa_id vindo da Meta (ex: 5511999999999)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, phone) -- Um contato único por número de telefone por Tenant
);

-- Tickets Table (Tickets de atendimento)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table (Mensagens)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('VIRTUAL_NUMBER', 'CONTACT', 'SYSTEM')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'TEMPLATE')),
    content JSONB NOT NULL, -- Armazena payload do texto ou URLs de mídia
    meta_id VARCHAR(255), -- ID da mensagem na Meta (wamid) para rastrear status
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'READ', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_channels_tenant_id ON channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_phone_number_id ON channels(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user_id ON tickets(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_meta_id ON messages(meta_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO tenants (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Empresa Exemplo LTDA'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Auto Peças Central S/A')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, tenant_id, name, email, password, role) VALUES 
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Administrador', 'admin@exemplo.com', '$2b$10$example_hash', 'ADMIN'),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Atendente 1', 'atendente1@exemplo.com', '$2b$10$example_hash', 'AGENT'),
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Administrador Auto', 'admin@autpecas.com', '$2b$10$example_hash', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Insert sample channels
INSERT INTO channels (id, tenant_id, user_id, phone_number_id, waba_id, verify_token, access_token) VALUES 
    ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', '1234567890', '987654321', 'VERIFY_TOKEN_123', 'ACCESS_TOKEN_123'),
    ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440021', '0987654321', '123456789', 'VERIFY_TOKEN_456', 'ACCESS_TOKEN_456')
ON CONFLICT (id) DO NOTHING;

-- Insert sample contacts
INSERT INTO contacts (id, tenant_id, name, phone) VALUES 
    ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', 'Carlos Oliveira', '5511987654321'),
    ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440001', 'Mariana Costa', '5531977756666'),
    ('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440002', 'Oficina do Toninho', '5521999998888')
ON CONFLICT (tenant_id, phone) DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (id, tenant_id, contact_id, assigned_user_id, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440012', 'OPEN'),
    ('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440012', 'PENDING'),
    ('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440021', 'OPEN')
ON CONFLICT (id) DO NOTHING;

-- Insert sample messages
INSERT INTO messages (id, ticket_id, sender, type, content, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440051', 'CONTACT', 'TEXT', '{"body": "Boa tarde, vocês têm o parachoque dianteiro do Gol G4 2008?"}', 'READ'),
    ('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440051', 'VIRTUAL_NUMBER', 'TEXT', '{"body": "Boa tarde, Carlos! Temos sim. Original usado em perfeito estado por R$ 350,00."}', 'READ'),
    ('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440052', 'CONTACT', 'TEXT', '{"body": "Comprei uma lanterna traseira ontem, mas o lado está incorreto. Vocês trocam?"}', 'READ'),
    ('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440053', 'CONTACT', 'TEXT', '{"body": "Preciso de um Motor AP 1.8 Flex completo com nota baixa. Consegue?"}', 'READ')
ON CONFLICT (id) DO NOTHING;

-- Create view for monitoring
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT c.id) as total_channels,
    COUNT(DISTINCT co.id) as total_contacts,
    COUNT(DISTINCT tk.id) as total_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'OPEN' THEN tk.id END) as open_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'PENDING' THEN tk.id END) as pending_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'CLOSED' THEN tk.id END) as closed_tickets,
    COUNT(DISTINCT m.id) as total_messages
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
LEFT JOIN channels c ON t.id = c.tenant_id AND c.is_active = true
LEFT JOIN contacts co ON t.id = co.tenant_id
LEFT JOIN tickets tk ON t.id = tk.tenant_id
LEFT JOIN messages m ON tk.id = m.ticket_id
GROUP BY t.id, t.name;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;

-- Verification queries
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as tenant_count FROM tenants;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as channel_count FROM channels;
SELECT COUNT(*) as contact_count FROM contacts;
SELECT COUNT(*) as ticket_count FROM tickets;
SELECT COUNT(*) as message_count FROM messages;
