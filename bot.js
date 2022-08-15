'use strict';

const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const bot = new Telegraf(process.env.TOKEN);
const client = new MongoClient(process.env.DB_URL);

bot.start((ctx) => ctx.reply('Кринж в чате)'));
const connect = (async () => await client.connect())().then(
  console.log('Connected to database')
);

const COMMAND_TIMEOUT = 60000;

bot.command('cringe', async (ctx) => {
  try {
    if (!!ctx.update.message.reply_to_message) {
      const users = client.db().collection('users');
      const username = ctx.update.message.reply_to_message.from.username;
      console.log(username);
      const user = await users.findOne({ username: username });
      const emoji = String.fromCodePoint(0x1f4a9);
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: 1,
          lastUsed: Date.now(),
        });
        ctx.reply(`${emoji} кринж`);
      } else {
        if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username },
            { $set: { cringeRate: newRate, lastUsed: Date.now() } }
          );
          ctx.reply(`${emoji} кринж`);
        } else {
          ctx.reply(
            'Команды cringe и baza можно использовать не чаще, чем раз в минуту'
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('baza', async (ctx) => {
  try {
    if (!!ctx.update.message.reply_to_message) {
      const users = client.db().collection('users');
      const username = ctx.update.message.reply_to_message.from.username;
      console.log(username);
      const user = await users.findOne({ username: username });
      const emoji = String.fromCodePoint(0x1f349);
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: -1,
          lastUsed: Date.now(),
        });
        ctx.reply(`${emoji} база`);
      } else {
        if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate - 1;
          users.updateOne(
            { username: username },
            { $set: { cringeRate: newRate, lastUsed: Date.now() } }
          );
          ctx.reply(`${emoji} база`);
        } else {
          ctx.reply(
            'Команды cringe и baza можно использовать не чаще, чем раз в минуту'
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('mycringe', async (ctx) => {
  try {
    const users = client.db().collection('users');
    const myUsername = ctx.update.message.from.username;
    const me = await users.findOne({ username: myUsername });
    if (!me) {
      ctx.reply(`@${myUsername}, с тебя еще не кринжевали!`);
    } else {
      if (me.cringeRate < 0) {
        const bazaEmoji = String.fromCodePoint(0x1f7e2);
        ctx.reply(
          `${bazaEmoji} @${myUsername}, твой счет базы: ${-1 * me.cringeRate}`
        );
      } else {
        const cringeEmoji = String.fromCodePoint(0x1f534);
        ctx.reply(
          `${cringeEmoji} @${myUsername}, твой счет кринжа: ${me.cringeRate}`
        );
      }
    }
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('topcringe', async (ctx) => {
  try {
    let reply = [];
    const users = client.db().collection('users');
    const topCursor = users.aggregate([
      { $sort: { cringeRate: -1 } },
      { $limit: 5 },
    ]);
    let place = 1;
    await topCursor.forEach((user) => {
      reply.push(`${place}. @${user.username}: ${user.cringeRate} `);
      place++;
    });
    ctx.reply('Топ-5 по кринжу:\n' + reply.join('\n'));
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('topbaza', async (ctx) => {
  try {
    let reply = [];
    const users = client.db().collection('users');
    const topCursor = users.aggregate([
      { $sort: { cringeRate: 1 } },
      { $limit: 5 },
    ]);
    let place = 1;
    await topCursor.forEach((user) => {
      if (user.cringeRate <= 0)
        reply.push(`${place}. @${user.username}: ${-1 * user.cringeRate} `);
      place++;
    });
    ctx.reply('Топ-5 по базе:\n' + reply.join('\n'));
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('test', (ctx) => {
  console.dir(ctx.update.message.from);
});

bot.launch().then(console.log('Bot is running'));
