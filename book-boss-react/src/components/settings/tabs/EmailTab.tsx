import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../../hooks/queries/useSettings';
import { Toast } from '../../common/Toast';

export const EmailTab: React.FC = () => {
    const { data: settings, isLoading } = useSettings();
    const updateSettingsMut = useUpdateSettings();

    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpSecure, setSmtpSecure] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);

    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '', type: 'info', isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    useEffect(() => {
        if (settings) {
            if (settings.smtp_host) setSmtpHost(settings.smtp_host);
            if (settings.smtp_port) setSmtpPort(settings.smtp_port);
            if (settings.smtp_user) setSmtpUser(settings.smtp_user);
            if (settings.smtp_pass) setSmtpPass(settings.smtp_pass);
            if (settings.smtp_secure !== undefined) setSmtpSecure(settings.smtp_secure === 'true');
        }
    }, [settings]);

    const handleSave = async () => {
        try {
            await updateSettingsMut.mutateAsync({
                smtp_host: smtpHost,
                smtp_port: smtpPort,
                smtp_user: smtpUser,
                smtp_pass: smtpPass,
                smtp_secure: smtpSecure.toString()
            });
            showToast('SMTP settings saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save SMTP settings', error);
            showToast('Failed to save SMTP settings', 'error');
        }
    };

    const handleTest = async () => {
        if (!testEmail) {
            showToast('Please enter a test email address', 'error');
            return;
        }

        setIsTesting(true);
        try {
            const token = localStorage.getItem('bookboss_token');
            const res = await fetch('/api/email/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: testEmail,
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpSecure,
                    user: smtpUser,
                    pass: smtpPass
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send test email');
            }

            showToast('Test email sent successfully!', 'success');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Error occurred while testing email', 'error');
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h4>SMTP Configuration</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    Configure an SMTP server to enable the "Send to E-Reader" feature. We recommend using an app password if using Gmail or Outlook.
                </p>

                <div className="form-group">
                    <label>SMTP Host (e.g., smtp.gmail.com)</label>
                    <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="form-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>SMTP Port</label>
                        <input
                            type="text"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            placeholder="587"
                            className="form-input"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                            <input
                                type="checkbox"
                                checked={smtpSecure}
                                onChange={(e) => setSmtpSecure(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <label style={{ marginBottom: 0 }}>Use TLS/SSL (Secure)</label>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>SMTP Username / Email</label>
                    <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="form-input"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="form-group">
                    <label>SMTP Password / App Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showSmtpPass ? "text" : "password"}
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            title={showSmtpPass ? "Hide Password" : "Show Password"}
                        >
                            {showSmtpPass ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <button className="primary-btn" onClick={handleSave} style={{ marginTop: '10px' }}>
                    Save SMTP Settings
                </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h4>Test Configuration</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    Send a test email to verify your SMTP settings are correct.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                            type="email"
                            placeholder="your.email@example.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="form-input"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button
                        className="secondary-btn"
                        onClick={handleTest}
                        disabled={isTesting || !testEmail}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', justifyContent: 'center' }}
                    >
                        {isTesting ? <><span className="spinner-small" /> Sending...</> : 'Send Test'}
                    </button>
                </div>
            </div>

            <Toast {...toast} onClose={() => setToast({ ...toast, isVisible: false })} />
        </div>
    );
};
