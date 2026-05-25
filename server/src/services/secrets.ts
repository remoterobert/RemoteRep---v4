import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

const getSecrets = async () => {
    try {
        return JSON.parse(
            (
                await client.send(
                    new GetSecretValueCommand({
                        SecretId: `v3-secrets-${process.env.DEPLOYMENT_STAGE}`,
                    })
                )
            )?.SecretString || '{}'
        );
    } catch (err) {
        console.error(err);
    }
};

export { getSecrets };
