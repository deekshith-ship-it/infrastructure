import { useState } from 'react';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import { Domains } from './pages/Domains';
import { Servers } from './pages/Servers';
import { Emails } from './pages/Emails';
import { Infra } from './pages/Infra';
import { useData } from './hooks/useData';
import type { ViewType } from './types';

function App() {
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [infraFilter, setInfraFilter] = useState<string | null>(null);
    const data = useData();

    const handleViewChange = (view: ViewType, filter: string | null = null) => {
        setCurrentView(view);
        setInfraFilter(filter);
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard onViewChange={handleViewChange} />;
            case 'infra':
                return (
                    <Infra
                        domains={data.domains}
                        servers={data.servers}
                        emails={data.emails}
                        initialFilter={infraFilter}
                        onAdd={data.addDomain}
                        onUpdate={data.updateDomain}
                        onDelete={data.deleteDomain}
                    />
                );
            case 'domains':
                return (
                    <Domains
                        domains={data.domains}
                        onAdd={data.addDomain}
                        onUpdate={data.updateDomain}
                        onDelete={data.deleteDomain}
                    />
                );
            case 'servers':
                return (
                    <Servers
                        servers={data.servers}
                        onAdd={data.addServer}
                        onUpdate={data.updateServer}
                        onDelete={data.deleteServer}
                    />
                );
            case 'emails':
                return (
                    <Emails
                        emails={data.emails}
                        domains={data.domains}
                        onAdd={data.addEmail}
                        onUpdate={data.updateEmail}
                        onDelete={data.deleteEmail}
                    />
                );
            default:
                return <Dashboard onViewChange={handleViewChange} />;
        }
    };

    return (
        <Layout currentView={currentView} onViewChange={handleViewChange}>
            {renderView()}
        </Layout>
    );
}

export default App;
