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
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: 1,
          lastUsed: Date.now(),
        });
      } else {
        if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username },
            { $set: { cringeRate: newRate, lastUsed: Date.now() } }
          );
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
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: -1,
          lastUsed: Date.now(),
        });
      } else {
        if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate - 1;
          users.updateOne(
            { username: username },
            { $set: { cringeRate: newRate, lastUsed: Date.now() } }
          );
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
      ctx.reply(`@${myUsername}, твой счет кринжа: ${me.cringeRate}`);
    }
  } catch (err) {
    console.log(err);
  }
});

bot.launch().then(console.log('Bot is running'));
