import 'dotenv/config';

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN, PUBLIC_NGROK_URL } =
	process.env;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !PUBLIC_NGROK_URL) {
	console.error('Missing required env vars (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, PUBLIC_NGROK_URL). Check your .env file.');
	process.exit(1);
}

const CALLBACK_URL = `${PUBLIC_NGROK_URL}/api/strava/webhook`;

async function viewSubscription() {
	const url = new URL('https://www.strava.com/api/v3/push_subscriptions');
	url.searchParams.append('client_id', STRAVA_CLIENT_ID!);
	url.searchParams.append('client_secret', STRAVA_CLIENT_SECRET!);

	const res = await fetch(url.toString());
	const data = await res.json();
	console.log('--- Current Subscription ---', JSON.stringify(data, null, 2));
}

async function createSubscription() {
	console.log(`--- Creating Subscription for: ${CALLBACK_URL} ---`);

	const formData = new FormData();
	formData.append('client_id', STRAVA_CLIENT_ID!);
	formData.append('client_secret', STRAVA_CLIENT_SECRET!);
	formData.append('callback_url', CALLBACK_URL);
	formData.append('verify_token', STRAVA_WEBHOOK_VERIFY_TOKEN!);

	const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
		method: 'POST',
		body: formData
	});

	const data = await response.json();
	console.log(response.ok ? '✅ Success:' : '❌ Failed:', data);
}

async function deleteSubscription(id: string) {
	const url = new URL(`https://www.strava.com/api/v3/push_subscriptions/${id}`);
	url.searchParams.append('client_id', STRAVA_CLIENT_ID!);
	url.searchParams.append('client_secret', STRAVA_CLIENT_SECRET!);

	const res = await fetch(url.toString(), { method: 'DELETE' });
	if (res.status === 204) console.log('✅ Deleted successfully');
	else console.log('❌ Delete failed:', await res.json());
}

const [action, id] = process.argv.slice(2);
if (action === 'view') viewSubscription();
else if (action === 'create') createSubscription();
else if (action === 'delete') deleteSubscription(id!);
else console.log('Usage: npx tsx scripts/manage-strava.ts [view|create|delete] [id]');
