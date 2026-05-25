import createError from '../utilities/createError';

const createTalent = async (reqBody: {
    email: string;
    phone: string;
    fullName: string;
    source: string;
}) => {
    try {
        if (process.env.DEPLOYMENT_STAGE !== 'prod') return;

        const ghlRes = await fetch(
            'https://rest.gohighlevel.com/v1/pipelines/Q0vVyvzi1qKRrXvYGi2n/opportunities/',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.GHL_TALENT_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: reqBody.fullName + ' ' + Date.now(),
                    stageId: '6c9c0dbc-2316-47bf-8919-19a61744dd5d',
                    email: reqBody.email,
                    phone: reqBody.phone,
                    status: 'open',
                    name: reqBody.fullName,
                    source: reqBody.source,
                    tags:
                        reqBody.source === 'Administrator-registered'
                            ? ['talent']
                            : ['talent', 'self-registered'],
                }),
            }
        );

        if (!ghlRes.status.toString().startsWith('2')) {
            throw createError(500, `GHL error for ${reqBody.email}`);
        }
    } catch (err) {
        console.error(err);
    }
};

const createClient = async (reqBody: {
    email: string;
    phone: string;
    fullName: string;
    companyName: string;
    source: string;
}) => {
    try {
        if (process.env.DEPLOYMENT_STAGE !== 'prod') return;

        const ghlRes = await fetch(
            'https://rest.gohighlevel.com/v1/pipelines/WxrJIMYTpwIngsR7gO05/opportunities/',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.GHL_CLIENT_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title:
                        reqBody.fullName +
                        ' | ' +
                        reqBody.companyName +
                        ' ' +
                        Date.now(),
                    stageId: '7c57756d-1eb6-408c-9208-5268189098e8',
                    email: reqBody.email,
                    phone: reqBody.phone,
                    status: 'open',
                    name: reqBody.fullName,
                    companyName: reqBody.companyName,
                    source: reqBody.source,
                    tags:
                        reqBody.source === 'Administrator-registered'
                            ? ['client']
                            : ['client', 'self-registered'],
                }),
            }
        );

        if (!ghlRes.status.toString().startsWith('2'))
            throw createError(500, `GHL error for ${reqBody.email}`);
    } catch (err) {
        console.error(err);
    }
};

const updateClientTags = async (email: string, newTags: string[]) => {
    try {
        if (process.env.DEPLOYMENT_STAGE !== 'prod') return;

        const getRes = await fetch(
            'https://rest.gohighlevel.com/v1/pipelines/WxrJIMYTpwIngsR7gO05/opportunities/',
            {
                headers: {
                    Authorization: `Bearer ${process.env.GHL_CLIENT_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!getRes.status.toString().startsWith('2'))
            throw createError(500, 'Error getting opportunities');

        const opps = await getRes.json();

        const opp = opps.find((o) => o?.contact?.email === email);

        if (!opp) throw createError(404, 'Opportunity not found');

        const putRes = await fetch(
            `https://rest.gohighlevel.com/v1/pipelines/WxrJIMYTpwIngsR7gO05/opportunities/${opp.id}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${process.env.GHL_CLIENT_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: opp.name,
                    stageId: opp.pipelineStageId,
                    status: 'open',
                    tags: [...opp.contact.tags, ...newTags],
                }),
            }
        );
    } catch (err) {
        console.error(err);
    }
};

const updateTalentTags = async (email: string, newTags: string[]) => {
    try {
        if (process.env.DEPLOYMENT_STAGE !== 'prod') return;

        const getRes = await fetch(
            'https://rest.gohighlevel.com/v1/pipelines/Q0vVyvzi1qKRrXvYGi2n/opportunities/',
            {
                headers: {
                    Authorization: `Bearer ${process.env.GHL_TALENT_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!getRes.status.toString().startsWith('2'))
            throw createError(500, 'Error getting opportunities');

        const opps = await getRes.json();

        const opp = opps.find((o) => o?.contact?.email === email);

        if (!opp) throw createError(404, 'Opportunity not found');

        const putRes = await fetch(
            'https://rest.gohighlevel.com/v1/pipelines/Q0vVyvzi1qKRrXvYGi2n/opportunities/',
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${process.env.GHL_TALENT_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: opp.name,
                    stageId: opp.pipelineStageId,
                    status: 'open',
                    tags: [...opp.contact.tags, ...newTags],
                }),
            }
        );
    } catch (err) {
        console.error(err);
    }
};

export { createTalent, createClient, updateClientTags, updateTalentTags };
