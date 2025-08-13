
"use client";

import { useMemo } from 'react';
import { useUserProfile, USER_ROLES } from '@/hooks/use-user-profile';
import { useGuests } from '@/hooks/use-guests';
import { useVehicleRequests } from '@/hooks/use-vehicle-requests';
import { Users, AlertTriangle, Car } from 'lucide-react';
import { StatCard } from './StatCard';

export function StatsCards() {
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    
    // Determine scope for data fetching based on roles
    const hasGlobalView = useMemo(() => {
        if (!userProfile) return false;
        return userProfile.roles.some(role => 
            [USER_ROLES.GENERAL_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SECURITY].includes(role)
        );
    }, [userProfile]);
    const scope = hasGlobalView ? 'all' : 'user';

    const canManageVehicleRequests = useMemo(() => 
        userProfile && userProfile.roles.some(r => [USER_ROLES.GENERAL_MANAGER, USER_ROLES.ADMIN].includes(r)),
        [userProfile]
    );

    // Fetch all necessary data
    const { guests, isLoading: areGuestsLoading } = useGuests({ daily: true, scope });
    const { requests, isLoading: areRequestsLoading } = useVehicleRequests(canManageVehicleRequests);

    // Calculate stats from the fetched data
    const totalMeetings = guests.length;
    const atRiskMeetings = guests.filter(g => g.atRisk).length;
    const pendingVehicleRequests = requests.filter(r => r.status === 'pending').length;
    
    // Determine visibility for each card
    const shouldShowTotalMeetings = totalMeetings > 0;
    const shouldShowAtRiskMeetings = atRiskMeetings > 0;
    // This is the updated logic as per your request
    const shouldShowPendingRequests = canManageVehicleRequests && pendingVehicleRequests > 0;
    
    const isLoading = isProfileLoading;

    if (!shouldShowTotalMeetings && !shouldShowAtRiskMeetings && !shouldShowPendingRequests && !isLoading) {
        return null;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {shouldShowPendingRequests && (
                <StatCard 
                    title="בקשות רכב ממתינות"
                    value={pendingVehicleRequests}
                    Icon={Car}
                    isLoading={areRequestsLoading}
                    href="/admin/vehicle-requests"
                    className="border-orange-500/50"
                    valueClassName="text-orange-600"
                    description="בקשות שממתינות לאישורך"
                />
            )}
             {shouldShowTotalMeetings && (
                <StatCard 
                    title="פגישות להיום"
                    value={totalMeetings}
                    Icon={Users}
                    isLoading={areGuestsLoading}
                    description={scope === 'user' ? 'פגישות אישיות' : 'סה"כ פגישות במערכת'}
                />
            )}
            {shouldShowAtRiskMeetings && (
                <StatCard 
                    title="פגישות בסיכון"
                    value={atRiskMeetings}
                    Icon={AlertTriangle}
                    isLoading={areGuestsLoading}
                    className="border-destructive/50"
                    valueClassName="text-destructive"
                    description={scope === 'user' ? 'פגישות אישיות' : 'סה"כ פגישות במערכת'}
                />
            )}
        </div>
    );
}
