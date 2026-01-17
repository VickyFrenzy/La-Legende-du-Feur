import 'dotenv/config';
import { Client, Events, GatewayIntentBits, Guild } from 'discord.js';
import { prisma } from './lib/prisma.js'

const token: string = process.env.DISCORD_TOKEN!;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async (readyClient: Client) => {
	console.log(`Ready! Logged in as ${readyClient.user!.tag}`);

	try {
		await readyClient.application?.commands.set([
			{
				name: 'goatsdufeur',
				description: 'Le top des gens qui se sont fait feur.',
			},
		]);
		console.log('Registered slash commands.');
	} catch (e) {
		console.warn('Failed to register slash commands', e);
	}
});

const chooseReply = (): string => {
	if (Math.random() < 0.001) {
		return 'coubeh.';
	}
	return 'feur.';
}

async function recordTheFeur(id: string) {
	const user = await prisma.user.findUnique({
		where: {
			id: id,
		},
	});
	if (user) {
		await prisma.user.update({
			where: {
				id: id,
			},
			data: {
				feurCount: user.feurCount + 1,
			},
		});
	} else {
		await prisma.user.create({
			data: {
				id: id,
				feurCount: 1,
			},
		});
	}
}

client.on(Events.MessageCreate, async message => {
	if (message.content.toLowerCase().includes('quoi')) {
		await message.reply(chooseReply());
		recordTheFeur(message.author.id);
	}
});

async function getLeaderboardLines(guild: Guild): Promise<string[]> {
	const top = await prisma.user.findMany({
		orderBy: { feurCount: 'desc' },
		take: 10,
	});

	if (!top || top.length === 0) return ['Personne pour le moment :c'];

	const lines = await Promise.all(top.map(async (u, idx) => {
		let who: string = `❔`;
		// Only mention users that are on the server.
		try {
			await guild.members.fetch(u.id);
			who = `<@${u.id}>`;
		} catch {}
		return `${idx + 1}. ${who} — ${u.feurCount} feur.`;
	}));

	return lines;
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand || !interaction.isChatInputCommand()) return;
	if (interaction.commandName === 'goatsdufeur') {
		await interaction.deferReply();
		const guild: Guild | null = interaction.guild;
		if (!guild) {
			await interaction.editReply('Cette commande ne peut être utilisée que dans un serveur.');
			return;
		}
		try {
			const lines = await getLeaderboardLines(guild);
			const content = `# Le Top du Feur\n${lines.join('\n')}`;
			await interaction.editReply({ content, allowedMentions: { parse: [] } });
		} catch (e) {
			console.error('Error building leaderboard', e);
			await interaction.editReply('Une erreur est survenue :c');
		}
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
		try {
			await prisma.$disconnect();
		} catch (e) {
			console.warn('Error disconnecting Prisma', e);
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
