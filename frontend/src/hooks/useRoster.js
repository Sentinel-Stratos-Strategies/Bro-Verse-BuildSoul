import { useState, useCallback } from 'react';
import { apiRequest } from '../utils/api';

export function useRoster() {
    const [activeRoster, setActiveRoster] = useState(null);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [availablePersonas, setAvailablePersonas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getActive = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/roster/active');
            setActiveRoster(data.roster);
            setDaysRemaining(data.daysRemaining || 0);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const lockRoster = useCallback(async (personaSlugs, alphaBroConfig) => {
        setLoading(true);
        setError(null);
        try {
            const roster = await apiRequest('/roster', {
                method: 'POST',
                body: { personaSlugs, alphaBroConfig }
            });
            setActiveRoster(roster);
            setDaysRemaining(30);
            return roster;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAvailable = useCallback(async () => {
        setLoading(true);
        try {
            const personas = await apiRequest('/roster/available');
            setAvailablePersonas(personas);
            return personas;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getHistory = useCallback(async () => {
        setLoading(true);
        try {
            const rosters = await apiRequest('/roster/history');
            return rosters;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        activeRoster,
        daysRemaining,
        availablePersonas,
        loading,
        error,
        isLocked: !!activeRoster && daysRemaining > 0,
        getActive,
        lockRoster,
        getAvailable,
        getHistory,
        setError
    };
}
