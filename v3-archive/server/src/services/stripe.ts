import Stripe from 'stripe';
import { User, usersTable } from './auth';
import * as databaseService from './database';

const products: {
    [name: string]: {
        mode: Stripe.Checkout.SessionCreateParams.Mode;
        price: string;
        successUrl: string;
    };
} = {
    access: {
        mode: 'subscription',
        price: process.env.STRIPE_ACCESS_PRICE!,
        successUrl: `${process.env.FRONTEND_BASE_URL}/payment-confirmation?sessionId={CHECKOUT_SESSION_ID}&product=access`,
    },
    listing: {
        mode: 'payment',
        price: process.env.STRIPE_LISTING_PRICE!,
        successUrl: `${process.env.FRONTEND_BASE_URL}/payment-confirmation?sessionId={CHECKOUT_SESSION_ID}&product=listing`,
    },
};

const stripe = new Stripe(process.env.STRIPE_KEY!);

const getCustomerId = async (user: User): Promise<string> => {
    if (user?.stripe?.customerId) return user.stripe.customerId;

    const customer = await stripe.customers.create({
        email: user.email,
    });

    await databaseService.update({
        TableName: usersTable,
        Key: { id: user.id },
        UpdateExpression: 'set stripe=:s',
        ExpressionAttributeValues: {
            ':s': { customerId: customer.id },
        },
    });

    return customer.id;
};

const createSession = async (
    user: User,
    type: keyof typeof products,
    urlParams?: string
): Promise<string> => {
    const { mode, price, successUrl } = products[type];

    const session = await stripe.checkout.sessions.create({
        mode,
        customer: await getCustomerId(user),
        line_items: [{ price, quantity: 1 }],
        success_url: successUrl + `&userId=${user.id}` + urlParams,
        invoice_creation: mode === 'payment' ? { enabled: true } : undefined,
        allow_promotion_codes: true,
    });

    return session.url!;
};

const getSubscription = async (subscriptionId: string) =>
    await stripe.subscriptions.retrieve(subscriptionId);

const getAccessSubscriptions = async (customerId: string) =>
    await stripe.subscriptions.list({
        customer: customerId,
        price: process.env.STRIPE_ACCESS_PRICE,
    });

const getSession = async (sessionId: string) =>
    await stripe.checkout.sessions.retrieve(sessionId);

const cancelSubscription = async (subscriptionId: string) =>
    await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });

const resumeSubscription = async (subscriptionId: string) =>
    await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });

const getInvoices = async (cache = []) => {
    const requestConfig = { limit: 100 };
    if (cache.length) requestConfig['starting_after'] = cache.at(-1).id;

    const invoices = await stripe.invoices.list(requestConfig);

    if (invoices.data.length) cache.push(...invoices.data);

    if (invoices.has_more) return await getInvoices(cache);
    else return cache;
};

export {
    stripe,
    createSession,
    getSubscription,
    getAccessSubscriptions,
    getSession,
    cancelSubscription,
    resumeSubscription,
    getInvoices,
};
