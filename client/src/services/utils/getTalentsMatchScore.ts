import { ClientDataProfile } from 'types';

const fieldsToCompare = {
    companyAge: 'companyAge',
    companyHeadcount: 'companyHeadcount',
    industry: 'industry',
};

export const getTalentsMatchScore = ({
    client,
    talent,
}: {
    client: ClientDataProfile;
    talent: any;
}) => {
    const keys = Object.keys(fieldsToCompare);
    const totalKeysToMatch = keys.length;

    const matchScore = getMatch(client, talent, keys);

    const percentMatch =
        matchScore > 0 ? Math.round((matchScore / totalKeysToMatch) * 100) : 0;

    return Math.round(percentMatch);
};

const getMatch = (
    client: ClientDataProfile,
    talent: Record<string, any>,
    keys: string[]
) => {
    const matches = keys.reduce((prev, currentKey) => {
        if (!keys.length) {
            return 0;
        }
        if (currentKey === fieldsToCompare.companyAge) {
            const companyAgeMatch = client.companyAge >= talent.companyAge;

            return prev + +companyAgeMatch;
        }

        if (currentKey === fieldsToCompare.companyHeadcount) {
            const companyHeadcountMatch =
                client.companyHeadcount >= talent.companyHeadcount;

            return prev + +companyHeadcountMatch;
        }

        if (currentKey === fieldsToCompare.industry) {
            const industryMatch = talent?.industries?.includes(
                client?.industry
            );

            return prev + +industryMatch;
        }

        return prev;
    }, 0);
    return matches;
};
