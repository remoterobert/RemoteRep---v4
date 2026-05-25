import { Details, Requirements, TalentData } from 'types';

const fieldsToCompare = {
    technologies: 'technologies',
    yearsOfExperience: 'yearsOfExperience',
    leadTypes: 'leadTypes',
    education: 'education',
    salesRoles: 'salesRoles',
    industries: 'industries',
    salesCycles: 'salesCycles',
    salesTypes: 'salesTypes',
    decisionMakers: 'decisionMakers',
    dealAmounts: 'dealAmounts',
    salesEnvironments: 'salesEnvironments',
    salesVolumes: 'salesVolumes',
};

const goalFieldsToCompare = {
    salesRole: 'salesRole',
    commitment: 'commitment',
    compensationType: 'compensationType',
    benefits: 'benefits',
    minimumCompensation: 'minimumCompensation',
    industry: 'industry',
    companyAge: 'companyAge',
    companyHeadcount: 'companyHeadcount',
};

export const getListingMatchScore = ({
    client,
    talent,
}: {
    client: {
        requirements: Requirements;
        details?: Details & {
            companyAge: string | number;
            industry: string;
            companyHeadcount: string | number;
        };
    };
    talent: Partial<TalentData>;
}) => {
    const expirienceKeys = Object.keys(fieldsToCompare);
    const totalKeysToMatchByExpirience = expirienceKeys.length;
    const matchesByExperience = getMatchByExperience(
        client.requirements,
        talent.experience as Record<string, any>,
        expirienceKeys
    );

    const goalsKeys = Object.keys(goalFieldsToCompare);
    const totalKeysToMatchByGoals = goalsKeys.length;
    const matchesByGoals = getMatchByGoals(
        talent.goals as Record<string, any>,
        goalsKeys,
        client.details
    );

    const totalKeysMatch = matchesByGoals + matchesByExperience;
    const totalKeys = totalKeysToMatchByExpirience + totalKeysToMatchByGoals;

    return Math.round((totalKeysMatch / totalKeys) * 100);
};

const getMatchByExperience = (
    client: Requirements,
    talent: Record<string, any>,
    keys: string[]
) => {
    const matches = keys.reduce((prev, currentKey) => {
        if (!keys.length) {
            return 0;
        }
        if (currentKey === 'technologies') {
            const technologiesMatch = client.technologies?.every((t) =>
                talent.technologies?.includes(t)
            );

            return prev + +technologiesMatch;
        }

        if (currentKey === 'yearsOfExperience') {
            const isYearsEnough =
                talent?.yearsOfExperience >= client?.yearsOfExperience;

            return prev + +isYearsEnough;
        }

        if (currentKey === 'leadTypes') {
            const leadTypesMatch = client.leadTypes?.some((t) =>
                talent.leadTypes?.includes(t)
            );

            return prev + +leadTypesMatch;
        }

        if (currentKey === 'education') {
            const educationMatch = client.education?.includes(
                talent?.education
            );

            return prev + +educationMatch;
        }

        if (currentKey === 'salesRoles') {
            const salesRolesMatch = client.salesRoles?.some((s) =>
                talent.salesRoles?.includes(s)
            );

            return prev + +salesRolesMatch;
        }

        if (currentKey === 'industries') {
            const industriesMatch = client.industries?.some((i) =>
                talent.industries?.includes(i)
            );

            return prev + +industriesMatch;
        }

        if (currentKey === 'salesCycles') {
            const salesCyclesMatch = client.salesCycles?.some((s) =>
                talent.salesCycles?.includes(s)
            );

            return prev + +salesCyclesMatch;
        }

        if (currentKey === 'salesTypes') {
            const salesTypesMatch = client.salesTypes?.some((s) =>
                talent.salesTypes?.includes(s)
            );

            return prev + +salesTypesMatch;
        }

        if (currentKey === 'decisionMakers') {
            const decisionMakersMatch = client.decisionMakers?.some((d) =>
                talent.decisionMakers?.includes(d)
            );

            return prev + +decisionMakersMatch;
        }

        if (currentKey === 'dealAmounts') {
            const dealAmountsMatch = client.dealAmounts?.some((d) =>
                talent.dealAmounts?.includes(d)
            );

            return prev + +dealAmountsMatch;
        }

        if (currentKey === 'salesEnvironments') {
            const salesEnvironmentsMatch = client.salesEnvironments?.some((s) =>
                talent.salesEnvironments?.includes(s)
            );

            return prev + +salesEnvironmentsMatch;
        }

        if (currentKey === 'salesVolumes') {
            const salesVolumesMatch = client.salesVolumes?.some((s) =>
                talent.salesVolumes?.includes(s)
            );

            return prev + +salesVolumesMatch;
        }
        return prev;
    }, 0);

    return matches;
};

const getMatchByGoals = (
    talent: Record<string, any>,
    keys: string[],
    client?: Details & {
        companyAge: string | number;
        industry: string;
        companyHeadcount: string | number;
    }
) => {
    const matches = keys.reduce((prev, currentKey) => {
        if (!keys.length) {
            return 0;
        }
        if (currentKey === 'salesRole') {
            const roleMatch =
                client?.salesRole &&
                talent.salesRoles?.includes(client.salesRole);

            return prev + roleMatch;
        }
        if (currentKey === 'commitment') {
            const commitmentMatch =
                client?.commitment &&
                talent.commitment?.includes(client.commitment);

            return prev + commitmentMatch;
        }
        if (currentKey === 'compensationType') {
            const compensationTypeMatch =
                client?.compensationType &&
                talent.compensationTypes?.includes(client.compensationType);

            return prev + compensationTypeMatch;
        }
        if (currentKey === 'benefits') {
            const benefitsMatch =
                client?.benefits &&
                talent.benefits?.every((b: string) =>
                    client.benefits?.includes(b)
                );

            return prev + (benefitsMatch ? +benefitsMatch : 0);
        }
        if (currentKey === 'minimumCompensation') {
            const isMatch =
                (client?.minimumCompensation &&
                    +client.minimumCompensation >=
                        +talent?.minimumCompensation) ||
                0;

            return prev + +isMatch;
        }
        if (currentKey === 'companyAge') {
            const isMatch =
                (client?.companyAge &&
                    client.companyAge >= talent?.companyAge) ||
                0;

            return prev + +isMatch;
        }
        if (currentKey === 'companyHeadcount') {
            const isMatch =
                (client?.companyHeadcount &&
                    client.companyHeadcount >= talent?.companyHeadcount) ||
                false;

            return prev + +isMatch;
        }

        if (currentKey === 'industry') {
            const isMatch =
                !!client?.industry &&
                talent?.industries?.includes(client.industry);

            return prev + +isMatch;
        }
        return prev;
    }, 0);

    return matches;
};
