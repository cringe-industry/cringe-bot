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
      const username =
        ctx.update.message.reply_to_message.from.username ||
        ctx.update.message.reply_to_message.sender_chat.title;
      const user = await users.findOne({
        username: username,
        chatId: ctx.update.message.chat.id,
      });
      const emoji = String.fromCodePoint(0x1f4a9);
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: 1,
          chatId: ctx.update.message.chat.id,
          lastUsed: Date.now(),
        });
        ctx.reply(`${emoji} кринж`);
        console.log(username, '+1');
      } else {
        if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username, chatId: ctx.update.message.chat.id },
            { $set: { cringeRate: newRate, lastUsed: Date.now() } }
          );
          ctx.reply(`${emoji} кринж`);
          console.log(username, '+1');
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
      const username =
        ctx.update.message.reply_to_message.from.username ||
        ctx.update.message.reply_to_message.sender_chat.title;
      const user = await users.findOne({
        username: username,
        chatId: ctx.update.message.chat.id,
      });
      const emoji = String.fromCodePoint(0x1f349);
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: -1,
          chatId: ctx.update.message.chat.id,
          lastUsed: Date.now(),
        });
        ctx.reply(`${emoji} база`);
        console.log(username, '-1');
      } else {
        if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate - 1;
          users.updateOne(
            { username: username, chatId: ctx.update.message.chat.id },
            { $set: { cringeRate: newRate, lastUsed: Date.now() } }
          );
          ctx.reply(`${emoji} база`);
          console.log(username, '-1');
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
    const me = await users.findOne({
      username: myUsername,
      chatId: ctx.update.message.chat.id,
    });
    if (!me) {
      ctx.reply(`@${myUsername}, с тебя еще не кринжевали!`);
    } else {
      if (me.cringeRate < 0) {
        const bazaEmoji = String.fromCodePoint(0x1f7e2);
        ctx.reply(
          `${bazaEmoji} @${myUsername}, твой счет базы в этом чате: ${
            -1 * me.cringeRate
          }`
        );
      } else {
        const cringeEmoji = String.fromCodePoint(0x1f534);
        ctx.reply(
          `${cringeEmoji} @${myUsername}, твой счет кринжа в этом чате: ${me.cringeRate}`
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
      { $match: { chatId: ctx.update.message.chat.id } },
      { $sort: { cringeRate: -1 } },
      { $limit: 5 },
    ]);
    let place = 1;
    await topCursor.forEach((user) => {
      if (user.cringeRate >= 0)
        reply.push(`${place}. ${user.username}: ${user.cringeRate} `);
      place++;
    });
    ctx.reply(
      `Топ-${reply.length} по кринжу в этом чате:\n` + reply.join('\n')
    );
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
      { $match: { chatId: ctx.update.message.chat.id } },
      { $sort: { cringeRate: 1 } },
      { $limit: 5 },
    ]);
    let place = 1;
    await topCursor.forEach((user) => {
      if (user.cringeRate <= 0)
        reply.push(`${place}. ${user.username}: ${-1 * user.cringeRate} `);
      place++;
    });
    ctx.reply(`Топ-${reply.length} по базе:\n` + reply.join('\n'));
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('test', (ctx) => {
  console.dir(ctx.update.message.from);
});

bot.launch().then(console.log('Bot is running'));
