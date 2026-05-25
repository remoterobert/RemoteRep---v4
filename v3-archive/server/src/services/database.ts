import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    GetCommand,
    UpdateCommand,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const scan = async (options) => {
    const cacheItems = [];
    let lastKey;
    let lastCmd;
    let scanDone = false;

    while (!scanDone) {
        let scanCmd;

        if (lastKey)
            scanCmd = await ddbDocClient.send(
                new ScanCommand({ ...options, ExclusiveStartKey: lastKey })
            );
        else scanCmd = await ddbDocClient.send(new ScanCommand(options));

        cacheItems.push(...scanCmd.Items);

        lastCmd = scanCmd;

        if (scanCmd.LastEvaluatedKey) lastKey = scanCmd.LastEvaluatedKey;
        else scanDone = true;
    }
    return { ...lastCmd, Items: cacheItems };
};

const put = (options) => {
    return ddbDocClient.send(new PutCommand(options));
};

const update = (options) => {
    return ddbDocClient.send(new UpdateCommand(options));
};

const get = (options) => {
    return ddbDocClient.send(new GetCommand(options));
};

const deleteById = (options) => {
    return ddbDocClient.send(new DeleteCommand(options));
};

export { scan, put, update, get, deleteById };
