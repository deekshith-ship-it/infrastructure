import { useState } from 'react';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import { Domains } from './pages/Domains';
import { Servers } from './pages/Servers';
import { Emails } from './pages/Emails';
import { Infra } from './pages/Infra';
import { Finance } from './pages/Finance';
import { Activity } from './pages/Activity';
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
                        onAddDomain={data.addDomain}
                        onUpdateDomain={data.updateDomain}
                        onDeleteDomain={data.deleteDomain}
                        onAddServer={data.addServer}
                        onDeleteServer={data.deleteServer}
                        onAddEmail={data.addEmail}
                        onDeleteEmail={data.deleteEmail}
                    />
                );
            case 'domains':
                return (
                    <Domains
                        domains={data.domains}
                        onAdd={data.addDomain}
                        onUpdate={data.updateDomain}
                        onDelete={data.deleteDomain}
                        initialSelectedId={infraFilter}
                    />
                );
            case 'servers':
                return (
                    <Servers
                        servers={data.servers}
                        onAdd={data.addServer}
                        onUpdate={data.updateServer}
                        onDelete={data.deleteServer}
                        initialSelectedId={infraFilter}
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
                        initialSelectedId={infraFilter}
                    />
                );
            case 'cost':
                return <Finance initialSelectedId={infraFilter} />;
            case 'activity':
                return <Activity logs={data.activityLogs} onViewAsset={(view, id) => {
                    const viewMap: Record<string, ViewType> = {
                        'domain': 'domains',
                        'server': 'servers',
                        'email': 'emails',
                        'cost': 'cost'
                    };
                    handleViewChange(viewMap[view] || 'dashboard', id);
                }} />;
            default:
                return <Dashboard onViewChange={handleViewChange} />;
        }
    };

    return (
        <Layout
            currentView={currentView}
            onViewChange={handleViewChange}
            notificationCount={data.stats.alerts}
        >
            {renderView()}
        </Layout>
    );
}

export default App;
