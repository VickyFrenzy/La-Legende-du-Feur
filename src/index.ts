import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

const token: string = process.env.DISCORD_TOKEN!;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async (readyClient: Client) => {
	console.log(`Ready! Logged in as ${readyClient.user!.tag}`);
});

const chooseReply = (): string => {
	if (Math.random() < 0.001) {
		return 'coubeh.';
	}
	return 'feur.';
}

client.on(Events.MessageCreate, async message => {
	if (message.content.toLowerCase().includes('quoi')) {
		await message.reply(chooseReply());
	}
});

client.login(token);

const gracefulShutdown = async (reason: string) => {
	console.log(`Shutting down: ${reason}`);
	try {
		try {
			client.destroy();
		} catch (e) {
			console.warn('Error destroying Discord client', e);
		}
		console.log('Shutdown complete');
		process.exit(0);
	} catch (err) {
		console.error('Shutdown failed', err);
		process.exit(1);
	}
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
	console.error('Unhandled Rejection:', reason);
	void gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
	void gracefulShutdown('uncaughtException');
});
