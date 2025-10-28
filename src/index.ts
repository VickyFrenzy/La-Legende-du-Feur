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
